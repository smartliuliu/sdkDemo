import Promise from 'bluebird';
import BleManager from 'react-native-ble-manager';
import './bleStatusManager';
// import v1 from './v1/PeskController';
import v2 from './v2/PeskController';

let peskControllerVersion = 0;
let peskController = null;

BleManager.start({ showAlert: false });
BleManager.checkState();

function _selectBleVersion() {
  peskControllerVersion = 2;
}

function getPeskController() {
  peskController = new v2();

  return peskController;
}

function connect(deviceData) {
  _selectBleVersion();
  getPeskController();

  if (peskControllerVersion === 2) {
    console.log('=========== [ble] connect   ', deviceData);
    return peskController.connect({
      connId: deviceData.ssid, // connId would be device SSID
      serviceId: deviceData.connId, // device.connId = serviceId
    });
  }

  return Promise.resolve();
}

function reset() {
  console.log('[ble] reset from', { peskControllerVersion, peskController });
  if (!peskControllerVersion || !peskController) {
    return Promise.resolve();
  }

  peskControllerVersion = 0;
  return Promise.attempt(() => peskController.reset()).delay(1000).then(() => {
    // return peskController.reset().then(() => {
    peskController = null;
  });
}

export default {
  getPeskController,
  connect,
  reset,
};
