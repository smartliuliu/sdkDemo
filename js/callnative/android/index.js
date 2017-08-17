import { NativeModules } from 'react-native';

// const MyModule = NativeModules.MyModule;
// function callToNative(message) {
//   MyModule.rnCallNative(message);
// }
//
// function connectedSuccess(data) {
//   console.log('============ [传输层]  =====  data = ', data);
//   MyModule.connectSuccessed(data);
// }
//
// module.exports = {
//   callToNative,
//   connectedSuccess,
// };


import { NativeModules, NativeEventEmitter } from 'react-native';

const { RNConnectToOC } = NativeModules;

const RNConnectToOADEmitter = new NativeEventEmitter(RNConnectToOC);

/**
 * 监听
 */
function nativeManagerStartListener(callback) {
  this.subscription = RNConnectToOADEmitter.addListener(
    'EventReminder',
    callback,
  );
  RNConnectToOC.getNSNotification();
}

/**
 * 取消监听
 */
function nativeManagerRemoveListener() {
  this.subscription.remove();
  RNConnectToOC.removeNSNotification();
}

function RNSendMessage(msg) {
  RNConnectToOC.RNSendMessage(msg);
}

module.exports = {
  nativeManagerStartListener,
  nativeManagerRemoveListener,
  RNSendMessage,
};
