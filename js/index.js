import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  DeviceEventEmitter,
  NativeModules,
  View,
} from 'react-native';

import ble from './services/ble/';
import nativeiOS from './callnative/nativeiOSManager';


export default class sdkDemo extends Component {
  componentWillMount() {
    nativeiOS.oadManagerStartListener(result => {
      this._nativeListener(result);
    });
  }
  _nativeListener(result) {
    console.log("_oadListener result = ", result);
    console.log('======= msg = ', result.message);
    const msg = result.message;
    switch (msg) {
      case 'connect':
        ble.connect({ ssid: 'Officewell#1000016', connId: 'FFF1' });

        break;

      case 'moveUp':
        break;

      case 'moveDown':
        break;

      case 'moveStop':
        break;
      default:
    }
    // this.timer = setTimeout(()=>{
    //   nativeiOS.RNSendMessage("ble 哎呀烦死人的ble");
    // },3000);
  }

  componentWillUnmount() {
      nativeiOS.oadManagerRemoveListener();
    // this.timer && clearTimeout(this.timer);
  }


  render() {
    return null;
  }

  callNative() {
    ble.connect({ ssid: 'Officewell#1000016', connId: 'FFF1' });
  }

}

AppRegistry.registerComponent('sdkDemo', () => sdkDemo);
