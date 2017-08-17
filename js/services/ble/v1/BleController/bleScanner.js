import { DEBUG_BLE } from 'env';

import BleManager from 'react-native-ble-manager';
import bleStatusManager from '../../bleStatusManager';
import subManager from '../../subManager';

const SCAN_INTERVAL = 15; // scan interval 15 sec

let subDiscoverPeripheral;
let resDeviceFound; // set when the device is scanning for peripherals
let subStopScan;

// scan for a connId
// return a promise that resolve the deviceUUID
function scan(connId) {
  if (resDeviceFound) {
    if (DEBUG_BLE) {
      console.log('[BLE_SCAN] Clear previous scanning');
    }
    stop();
  }

  if (DEBUG_BLE) {
    console.log(`[BLE_SCAN] Scanning for ${connId}`);
  }

  bleStatusManager.scanning(); // update ble status UI
  subDiscoverPeripheral = subManager.on(
    'BleManagerDiscoverPeripheral',
    _onBleManagerDiscoverPeripheral,
  ); // add discover subscription

  return new Promise(res => {
    resDeviceFound = res; // resolver for find a peripheral
    BleManager.scan([connId], SCAN_INTERVAL, false); // scan for SCAN_INTERVAL sec

    // add stop scan subscription to automatically retry scanning
    subStopScan = subManager.on('BleManagerStopScan', () =>
      _onBleManagerStopScan(connId),
    );
  });
}

// stop scanning
function stop() {
  if (DEBUG_BLE) {
    console.log('[BLE_SCAN] Stop scanning');
  }

  // remove subscriptions
  subDiscoverPeripheral && subDiscoverPeripheral.remove();
  subStopScan && subStopScan.remove();

  if (resDeviceFound) {
    resDeviceFound(); // resolve without deviceUUID
    resDeviceFound = null;
  }

  // BleManager.stopScan(); // seems not working
}

function _onBleManagerDiscoverPeripheral(data) {
  if (resDeviceFound) {
    // true if waiting for a peripheral
    if (DEBUG_BLE) {
      console.log('[BLE_SCAN] Resolve discovered peripheral:', data);
    }

    resDeviceFound(data.id); // resolve with discovered peripheral UUID
    resDeviceFound = null; // clean the resolver so later discover won't trigger
    stop(); // clear scanning
  } else if (DEBUG_BLE) {
    console.log(
      '[BLE_SCAN] Scanning has been stopped. Discard discovered peripheral:',
      data,
    );
  }
}

function _onBleManagerStopScan(connId) {
  if (resDeviceFound) {
    // true if waiting for a peripheral
    if (DEBUG_BLE) {
      console.log('[BLE_SCAN] No peripheral found. Retry...');
    }
    BleManager.scan([connId], SCAN_INTERVAL, false);
  }
}

module.exports = {
  scan,
  stop,
};
