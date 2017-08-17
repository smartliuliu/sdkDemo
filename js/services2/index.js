import Promise from 'bluebird';
import BleManager from 'react-native-ble-manager';

console.log('============== BleManager.start()');
BleManager.start({ showAlert: false })
  .then(() => {
    console.log('============== BleManager.start4()');
  })
  .catch(() => {
    console.log('============== BleManager.start5()');
  });
console.log('============== BleManager.start2()  ', BleManager);
BleManager.checkState();
console.log('============== BleManager.start3()');
