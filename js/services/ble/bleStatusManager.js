import { NativeModules, NativeEventEmitter } from 'react-native';
// import { DEBUG_BLE } from 'env';
// import actions, { store } from 'redux-app-config';

// const UPDATE_BLE_STATUS = params => {
//   store.dispatch(actions.UPDATE_BLE_STATUS(params));
// };

const DEVICE_CONNECTED = 1;
const DEVICE_DISCONNECTED = 0;
const DEVICE_NULL = -1;
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

class BleStatusManager {
  constructor() {
    this.hardwareStatus = false;
    this.status = DEVICE_NULL; // peripheral status
    this.onConnect = null;
    bleManagerEmitter.addListener(
      'BleManagerDidUpdateState',
      this._onBleManagerDidUpdateState.bind(this),
    );
  }

  setOnConnect(callback) {
    this.onConnect = callback;
  }

  clearOnConnect() {
    this.onConnect = null;
  }

  _onBleManagerDidUpdateState(data) {
    if (data.state === 'on') {
      console.log('============ [BLE] Cell phone BLE on ============');
      this.turnOn();
      if (this.connId) {
        console.log('[BLE] Automatically connect when turn on BLE');
        if (typeof this.onConnect === 'function') {
          this.onConnect();
        }
      }
      return;
    }

    if (data.state === 'off') {
      console.log('============ [BLE] Cell phone BLE off ============');
      this.turnOff();
      return;
    }

    console.log(`============ [BLE] state ${data.state}`);
  }

  turnOn() {
    console.log('============ [BLE_STATUS] turn on');
    this.hardwareStatus = true;
    // UPDATE_BLE_STATUS({ status: 'BLE_ON' });
  }

  turnOff() {
    console.log('============== [BLE_STATUS] turn off');
    this.hardwareStatus = false;
    // UPDATE_BLE_STATUS({ status: 'BLE_OFF' });

    if (this.status === DEVICE_CONNECTED) {
      this.status = DEVICE_DISCONNECTED;
    }
  }

  hardware() {
    return this.hardwareStatus;
  }

  scanning() {
    console.log('=========== [BLE_STATUS] start scanning');
    // UPDATE_BLE_STATUS({ status: 'BLE_SCANNING' });
  }

  connecting() {
    console.log('============ BLE_STATUS] connecting');

    // if (this.status === DEVICE_NULL) {
    //   UPDATE_BLE_STATUS({ status: 'BLE_CONNECTING' });
    // } else {
    //   UPDATE_BLE_STATUS({ status: 'BLE_RECONNECTING' });
    // }
  }

  connected() {
    console.log('============ [BLE_STATUS] connected');
    this.status = DEVICE_CONNECTED;
    // UPDATE_BLE_STATUS({ status: 'BLE_CONNECTED' });
    // status = DEVICE_CONNECTED;
  }

  disconnected() {
    console.log('============= [BLE_STATUS] disconnected');

    // UPDATE_BLE_STATUS({ status: 'BLE_DISCONNECTED' });
    this.retrieveServices = false;
    if (this.status === DEVICE_CONNECTED) {
      this.status = DEVICE_DISCONNECTED;
    }
  }

  isConnected() {
    return this.status === DEVICE_CONNECTED;
  }

  reset() {
    console.log('[BLE_STATUS] status reset');

    // UPDATE_BLE_STATUS({ status: 'BLE_ON' });
    this.status = DEVICE_NULL;
  }

  setRetrieveServicesStatus() {
    console.log('[BLE_STATUS]  getRetrieveServices');
    this.retrieveServices = true;
  }

  getRetrieveServicesStatus() {
    return this.retrieveServices;
  }
}

export default new BleStatusManager();
