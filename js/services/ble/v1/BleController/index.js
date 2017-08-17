import Promise from 'bluebird';
import base64 from 'base64-js';
import { DEBUG_BLE } from 'env';
import Mixpanel from 'react-native-mixpanel';

import BleManager from 'react-native-ble-manager';
import bleStatusManager from '../../bleStatusManager';

import bleConnector from './bleConnector';
import bleNotification from './bleNotification';

// BLE manager class
class BleController {
  constructor() {
    if (DEBUG_BLE) {
      console.log('============ [BLE] constructor ============');
    }

    // init variables
    this.connId = ''; // currently serviceUUID
    this.deviceUUID = '';

    this.resolvers = {};
    this.notification = null;

    bleConnector.startListener();
    bleNotification.startListener();

    bleStatusManager.setOnConnect(() => {
      this.connect(this.connId);
    });
  }

  destructor() {
    if (DEBUG_BLE) {
      console.log('============ [BLE] destructor ============');
    }
    bleStatusManager.clearOnConnect();
    bleNotification.off();
    return bleConnector.disconnect().then(result => {
      this.connId = '';
      this.deviceUUID = '';
      return result;
    });
  }

  connect({ connId, onConnect }) {
    if (!connId || connId.length !== 4) {
      return Promise.reject(new Error(`:${connId}: is not a valid UUID`));
    }

    if (this.connId !== connId) {
      this.connId = connId;

      // check phone ble on/off
      console.log(
        `============ [BLE] ckeck BLE: ${bleStatusManager.hardware()
          ? 'on'
          : 'off'} ============`,
      );

      if (!bleStatusManager.hardware()) {
        return Promise.reject(new Error('[BLE_CONNECTOR] hardware is off'));
      }

      // connect to peripheral
      if (DEBUG_BLE) {
        console.log(`============ [BLE] connecting to ${connId} ============`);
      }
      return bleConnector.disconnect().then(() => {
        bleStatusManager.reset();
        return this._connect(connId).then(onConnect);
      });
    }
    if (DEBUG_BLE) {
      console.log('[BLE] previous connect');
    }
    return this._connect(connId).then(onConnect);
  }

  _connect(connId) {
    Mixpanel.timeEvent('Connect');
    return bleConnector
      .connect(connId)
      .then(result => {
        if (DEBUG_BLE) {
          console.log(
            `============ [BLE] connected to ${result.peripheral} ============`,
          );
        }
        Mixpanel.trackWithProperties('Connect', { result: 'success', connId });
        this.deviceUUID = result.peripheral;
        bleNotification.setDeviceUUID(result.peripheral);
        return result;
      })
      .catch(() => {
        Mixpanel.trackWithProperties('Connect', { result: 'fail', connId });
      });
  }

  onValue(service, characteristic, onReceive, onReady) {
    bleNotification.on(service, characteristic, onReceive, onReady);
  }

  read(service, characteristic) {
    if (!bleStatusManager.isConnected()) {
      return Promise.reject(new Error('[BLE] no connected peripheral'));
    }

    return Promise.try(() =>
      BleManager.read(this.deviceUUID, service, characteristic),
    );
  }

  write(service, characteristic, data) {
    if (!bleStatusManager.isConnected()) {
      return Promise.reject(new Error('[BLE] no connected peripheral'));
    }

    return Promise.try(() =>
      BleManager.write(
        this.deviceUUID,
        service,
        characteristic,
        base64.fromByteArray(data),
      ),
    );
  }
}

module.exports = BleController;
