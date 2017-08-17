import { DEBUG_BLE } from 'env';

import BleManager from 'react-native-ble-manager';
import bleStatusManager from '../../bleStatusManager';
import subManager from '../../subManager';
import bleScanner from './bleScanner';
import bleNotification from './bleNotification';

let currentConnId;
let currentDeviceUUID;
let resDeviceConnected;
let rejDeviceConnected;
let resDisconnect;
let connecting;

function startListener() {
  subManager.on('BleManagerConnectPeripheral', _onBleManagerConnectPeripheral);
  subManager.on(
    'BleManagerDisconnectPeripheral',
    _onBleManagerDisconnectPeripheral,
  );
}

// Get discovered peripheral from connId
// @return deviceUUID if discovered, return undefined if not
function _getDiscoveredPeripherals(connId) {
  return BleManager.getDiscoveredPeripherals([])
    .catch(error => {
      // TODO: handle error
      console.warn('[BLE_CONNECTOR] getDiscoveredPeripherals error', error);
    })
    .then(peripheralsArray => {
      let deviceUUID;
      peripheralsArray.forEach(p => {
        if (
          p.advertising &&
          p.advertising.kCBAdvDataServiceUUIDs &&
          p.advertising.kCBAdvDataServiceUUIDs[0] === connId
        ) {
          deviceUUID = p.id;
        }
      });
      return { connId, deviceUUID };
    });
}

function connect(connId) {
  console.log('[BLE_CONNECTOR] (connect)');

  return _getDiscoveredPeripherals(connId).then(data => {
    if (!bleStatusManager.hardware()) {
      return Promise.reject(new Error('[BLE_CONNECTOR] hardware is off'));
    }

    if (resDisconnect) {
      // true if there is a disconnect order
      return _execDisconnect();
    }

    if (data.deviceUUID) {
      if (DEBUG_BLE) {
        console.log(
          '[BLE_CONNECTOR] (connect) a previously discovered peripheral: ',
          data,
        );
      }
      return _connect(data);
    }

    if (DEBUG_BLE) {
      console.log(
        `[BLE_CONNECTOR] (connect) an undiscovered peripheral (connId: ${connId})`,
      );
    }
    return bleScanner
      .scan(connId)
      .then(deviceUUID => ({ connId, deviceUUID }))
      .then(_connect);
  });
}

function _connect({ connId, deviceUUID }) {
  if (!deviceUUID) {
    if (resDisconnect) {
      // true if there is a disconnect order
      return _execDisconnect();
    }

    connecting = false;
    return Promise.reject(
      new Error('[BLE_CONNECTOR] no peripheral to connect'),
    );
  }

  if (DEBUG_BLE) {
    console.log('[BLE_CONNECTOR] connecting to:', deviceUUID);
  }

  currentConnId = connId;
  currentDeviceUUID = deviceUUID;
  bleStatusManager.connecting(currentConnId); // update ble status UI

  // TODO: handle timeout, connection error
  connecting = true;
  BleManager.connect(deviceUUID);

  return new Promise((res, rej) => {
    resDeviceConnected = res; // resolve when connected
    rejDeviceConnected = rej; // reject when there is a disconnect order
  });
}

function _onBleManagerConnectPeripheral(data) {
  if (DEBUG_BLE) {
    console.log('[BLE_CONNECTOR] connected:', data);
  }

  connecting = false;
  bleStatusManager.connected(); // update ble status UI

  if (resDisconnect) {
    // true if there is a disconnect order
    const connId = currentConnId;
    currentConnId = undefined; // clear currentConnId to disable automatic reconnect

    if (DEBUG_BLE) {
      console.log('[BLE_CONNECTOR] disconnect');
    }
    BleManager.disconnect(connId).then(() => {
      rejDeviceConnected(new Error('disconnect order')); // reject previous connected promise
      rejDeviceConnected = undefined;

      resDisconnect(); // resolve disconnect promise
      resDisconnect = undefined;
    });
    return;
  }

  bleNotification.restart();

  if (resDeviceConnected) {
    // resolve connected device
    resDeviceConnected(data);
    resDeviceConnected = undefined;
  }
}

function _onBleManagerDisconnectPeripheral() {
  if (DEBUG_BLE) {
    console.log('[BLE_CONNECTOR] disconnected');
  }
  bleStatusManager.disconnected(); // update status UI

  // automatically reconnect if currentConnId is set
  if (currentConnId) {
    setTimeout(() => connect(currentConnId).catch(), 100);
  }
}

/**
 * @desc
 * If a peripheral is already connected, disconnect can be done easily.
 * Otherwise, the previous gettingDiscoveredPeripherals, scanning,
 * connecting promises need to be handled properly. In this case, this method
 * set up a disconnect order (by setting resDiconnect), which will be resolved
 * at the right moment in the ongoing promises (see source code).
 */
function disconnect() {
  // disconnect when peripheral is connected
  if (bleStatusManager.isConnected()) {
    console.log(
      '[BLE_CONNECTOR] (disconnect) Disconnect periperal:',
      currentDeviceUUID,
    );
    bleStatusManager.disconnected(); // update status UI
    currentConnId = undefined; // clear currentConnId to disable automatic reconnect
    const deviceUUID = currentDeviceUUID;
    currentDeviceUUID = undefined;
    return BleManager.disconnect(deviceUUID);
  }

  currentConnId = undefined;

  // disconnect when is connecting a peripheral
  if (connecting) {
    console.log(
      '[BLE_CONNECTOR] (disconnect) Abort connecting:',
      currentDeviceUUID,
    );
    return new Promise(res => {
      resDisconnect = res; // set this to disconnect when current connection succeeds
      bleScanner.stop(); // clear previous scanning
    });
  }

  console.log(
    '[BLE_CONNECTOR] (disconnect) No current connection (maybe scanning)',
  );
  bleScanner.stop();
  return new Promise.resolve();
}

function _execDisconnect() {
  console.log('[BLE_CONNECTOR] execute disconnect order');
  currentConnId = undefined;
  resDisconnect();
  resDisconnect = null;
  return Promise.reject(new Error('disconnect order'));
}

module.exports = {
  startListener,
  connect,
  disconnect,
};
