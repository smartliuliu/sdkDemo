import Promise from 'bluebird';
import BleManager from 'react-native-ble-manager';

import retry from './retry';
import bleConnector from './bleConnector';
import bleNotification from './bleNotification';
import bleStatusManager from '../../bleStatusManager';

// import { DEBUG_BLE } from 'env';
// BLE manager class
class BleController {
  constructor() {
    console.log('============ [BLE] constructor ============');

    // init variables
    this.connId = ''; // currently serviceUUID
    this.deviceUUID = '';

    this.resolvers = {};
    this.notification = null;
    this.onReConnectCallback = null;

    bleConnector.startListener();
    bleNotification.startListener();

    bleStatusManager.setOnConnect(() => {
      this.connect(this.connId);
    });
  }

  destructor() {
    console.log('============ [BLE] destructor ============');
    bleStatusManager.clearOnConnect();
    bleNotification.off();
    return bleConnector.disconnect().then(result => {
      this.connId = '';
      this.deviceUUID = '';
      return result;
    });
  }

  connect({ connId, serviceId, onConnect }) {
    console.log('============= [BleController]  connect ', {
      connId,
      serviceId,
      onConnect,
    });
    bleConnector.setReConnect(onConnect);
    this.reConnect({ connId, serviceId, onConnect });
  }

  reConnect({ connId, serviceId, onConnect }) {
    console.log('=============== reConnect() promise = ', Promise);
    if (!connId) {
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
      // if (DEBUG_BLE) {
      console.log(`============ [BLE] connecting to ${connId} ============`);
      // }
      return bleConnector.disconnect().then(() => {
        bleStatusManager.reset();
        return this._connect(connId, serviceId).then(onConnect);
      });
    }
    // if (DEBUG_BLE) {
    console.log('[BLE] previous connect');
    // }
    return this._connect(connId, serviceId).then(onConnect);
  }

  _connect(connId, serviceId) {
    return bleConnector.connect(connId, serviceId).then(result => {
      // if (DEBUG_BLE) {
      console.log(
        `============ [BLE] connected to ${result.peripheral} ============`,
      );
      // }
      this.deviceUUID = result.peripheral;
      bleNotification.setDeviceUUID(result.peripheral);
      return result;
    });
  }

  onValue(service, characteristic, { onReceive, onReady }, currentDevice) {
    if (currentDevice && currentDevice.deviceUUID) {
      bleNotification.setDeviceUUID(currentDevice.deviceUUID);
    }
    bleNotification.on(service, characteristic, { onReceive, onReady });
  }

  read(service, characteristic) {
    if (
      !bleStatusManager.isConnected() ||
      !bleStatusManager.getRetrieveServicesStatus()
    ) {
      return Promise.reject(new Error('[BLE] no connected peripheral'));
    }
    return retry(() =>
      BleManager.read(this.deviceUUID, service, characteristic),
    );
  }

  write(service, characteristic, data) {
    if (
      !bleStatusManager.isConnected() ||
      !bleStatusManager.getRetrieveServicesStatus()
    ) {
      return Promise.reject(new Error('[BLE] no connected peripheral'));
    }
    return retry(() =>
      BleManager.write(this.deviceUUID, service, characteristic, data),
    );
  }

  writeWithoutResponse(service, characteristic, data) {
    if (
      !bleStatusManager.isConnected() ||
      !bleStatusManager.getRetrieveServicesStatus()
    ) {
      return Promise.reject(new Error('[BLE] no connected peripheral'));
    }
    return retry(() =>
      BleManager.writeWithoutResponse(
        this.deviceUUID,
        service,
        characteristic,
        data,
      ),
    );
  }

  retrieveServices(currentDevice) {
    if (currentDevice.deviceUUID) {
      this.deviceUUID = currentDevice.deviceUUID;
    }
    return retry(() => BleManager.retrieveServices(this.deviceUUID));
  }
}

module.exports = BleController;
