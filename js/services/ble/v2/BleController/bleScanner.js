// import { DEBUG_BLE } from 'env';

import BleManager from 'react-native-ble-manager';
import bleStatusManager from '../../bleStatusManager';
import subManager from '../../subManager';

const SCAN_INTERVAL = 15; // scan interval 15 sec

let subDiscoverPeripheral;
let resDeviceFound; // set when the device is scanning for peripherals
let subStopScan;

// scan for a connId
// return a promise that resolve the deviceUUID
function scan(connId, serviceId) {
  if (resDeviceFound) {
    console.log('========== [BLE_SCAN] Clear previous scanning');
    stop();
  }

  console.log(`=========== [BLE_SCAN] Scanning for ${connId}`);

  bleStatusManager.scanning(); // update ble status UI
  subDiscoverPeripheral = subManager.on('BleManagerDiscoverPeripheral', data =>
    _onBleManagerDiscoverPeripheral(data, connId),
  ); // add discover subscription

  return new Promise(res => {
    resDeviceFound = res; // resolver for find a peripheral
    console.log(
      '================ 即将调用BleManger.scan() ',
      res,
      '   serviceId = ',
      serviceId,
    );
    BleManager.scan([serviceId], SCAN_INTERVAL, false); // scan for SCAN_INTERVAL sec

    // add stop scan subscription to automatically retry scanning
    subStopScan = subManager.on('BleManagerStopScan', () =>
      _onBleManagerStopScan(serviceId),
    );
  });
}

// stop scanning
function stop() {
  console.log('============= [BLE_SCAN] Stop scanning');

  // remove subscriptions
  subDiscoverPeripheral && subDiscoverPeripheral.remove();
  subStopScan && subStopScan.remove();

  if (resDeviceFound) {
    resDeviceFound(); // resolve without deviceUUID
    resDeviceFound = null;
  }

  // BleManager.stopScan(); // seems not working
}

function _onBleManagerDiscoverPeripheral(data, connId) {
  if (resDeviceFound) {
    // true if waiting for a peripheral
    if (data.name !== connId) {
      console.log('============= [BLE_SCAN] discovered peripheral:', data);
      return;
    }

    console.log(
      '============== [BLE_SCAN] Resolve discovered peripheral:',
      data,
    );

    resDeviceFound(data.id); // resolve with discovered peripheral UUID
    resDeviceFound = null; // clean the resolver so later discover won't trigger
    stop(); // clear scanning
  }
  console.log(
    '============= [BLE_SCAN] Scanning has been stopped. Discard discovered peripheral:',
    data,
  );
}

function _onBleManagerStopScan(serviceId) {
  if (resDeviceFound) {
    // true if waiting for a peripheral
    console.log('[BLE_SCAN] No peripheral found. Retry...');
    BleManager.scan([serviceId], SCAN_INTERVAL + 2, false);
  }
}

module.exports = {
  scan,
  stop,
};
