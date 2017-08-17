// import { DEBUG_BLE } from 'env';

// a subscription manager
import { NativeAppEventEmitter, DeviceEventEmitter } from 'react-native';

const ACRONYM = {
  BleManagerDidUpdateState: '1. ON/OFF',
  BleManagerDiscoverPeripheral: '2. DISCOVER',
  BleManagerStopScan: '3. STOP SCAN',
  BleManagerConnectPeripheral: '4. CONNECT',
  BleManagerDisconnectPeripheral: '5. DISCONNECT',
  BleManagerDidUpdateValueForCharacteristic: '6. UPDATE CHARACTERISTIC VALUE',
};

module.exports = (function() {
  // cache for subscriptions
  let subs = {};

  // register a new subscription
  const on = function(event, callback) {
    // Do no allow duplicate subscription
    if (subs[event]) {
      console.warn(`Subscription for ${event} exists.`);
      subs[event].remove();
    }

    subs[event] = true;
    // if (DEBUG_BLE) {
    const subState = Object.keys(subs)
      .map(key => [ACRONYM[key], !!subs[key]])
      .sort()
      .map(x => `${x[1] ? '+' : '-'} ${x[0]}`)
      .join('\n');
    console.log(`[BLE_SUB_MANAGER] Turn on ${ACRONYM[event]}\n${subState}`);
    // }
    const subscription = DeviceEventEmitter.addListener(event, callback);

    // overwrite the NativeAppEventEmitter remove method
    subs[event] = {
      remove: () => {
        if (!subs[event]) {
          return;
        }

        subs[event] = undefined;
        // if (DEBUG_BLE) {
        const subStateOff = Object.keys(subs)
          .map(key => [ACRONYM[key], !!subs[key]])
          .sort()
          .map(x => `${x[1] ? '+' : '-'} ${x[0]}`)
          .join('\n');
        console.log(
          `[BLE_SUB_MANAGER] Turn off ${ACRONYM[event]}\n${subStateOff}`,
        );
        // }
        subscription.remove();
      },
    };

    return subs[event];
  };

  // register a new subscription that only trigger once
  const once = function(event, callback) {
    const subscription = on(event, data => {
      subscription.remove();
      callback(data);
    });

    return subscription;
  };

  // clear all subscriptions
  const clear = function() {
    Object.keys(subs).forEach(event => {
      // check if such subscription exists
      if (!subs[event]) return;

      subs[event].remove();
    });
    // reset subscription cache
    subs = {};
  };

  return { on, once, clear };
})();
