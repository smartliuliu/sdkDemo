import { DEBUG_BLE } from 'env';
import BleManager from 'react-native-ble-manager';
import retry from './retry';

import subManager from '../../subManager';

let deviceUUID;

// null when there's no notification
// { service, characteristic, on } when notification is set
let currentNotification;
let callbacks = {}; // characteristic -> callback

function startListener() {
  if (DEBUG_BLE) {
    console.log('[BLE_NOTIFICATION] on characteristic update');
  }
  subManager.on(
    'BleManagerDidUpdateValueForCharacteristic',
    ({ characteristic, value }) => {
      const cbs = callbacks[characteristic.toUpperCase()];
      // console.log('[BLE_NOTIFICATION] value updated', { peripheral, characteristic, value, cbs });
      cbs && cbs.onReceive(value);
    },
  );
}

function setDeviceUUID(uuid) {
  // if (currentNotification) {
  //   currentNotification.promise.cancel();
  // }

  deviceUUID = uuid;
}

let index = 0;
function on(service, characteristic, onReceive, onReady) {
  if (DEBUG_BLE) {
    console.log(
      `[BLE_NOTIFICATION] turning on notification for ${characteristic}`,
    );
  }

  if (onReceive) {
    callbacks[characteristic] = { onReceive, onReady };
  }

  if (currentNotification) {
    currentNotification.promise.cancel();
  }

  const promise = retry(
    _startNotification.bind(null, service, characteristic, index++),
  );
  currentNotification = { service, characteristic, promise };

  promise.then(() => {
    if (DEBUG_BLE) {
      console.log(`[BLE_NOTIFICATION] notification began on ${characteristic}`);
    }

    const cbs = callbacks[characteristic];
    cbs && cbs.onReady && cbs.onReady();
  });
}

function restart() {
  if (!currentNotification) {
    return;
  }

  if (DEBUG_BLE) {
    console.log('[BLE_NOTIFICATION] restart');
  }

  const { service, characteristic } = currentNotification;
  on(service, characteristic);
}

function off() {
  callbacks = {};
}

function _startNotification(service, characteristic, count) {
  if (DEBUG_BLE) {
    console.log(
      `[BLE_NOTIFICATION] (${count}) try start notification on ${characteristic}`,
    );
  }
  return BleManager.startNotification(deviceUUID, service, characteristic);
}

module.exports = {
  startListener,
  on,
  off,
  restart,
  setDeviceUUID,
};
