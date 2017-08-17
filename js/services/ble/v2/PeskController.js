import BleController from './BleController';
import getUUID from './getUUID';
import bleStatusManager from '../bleStatusManager';
import nativeiOS from '../../../callnative/nativeiOSManager';

export default class PeskController {
  constructor() {
    this.version = 2;
    this.bleController = new BleController();
    this.connId = '';
    this.serviceId = '';
    this.connectPromise = null;
    this.unit = 'cm';
    this.onHeightCallback = null;
    this.defaultHeights = [0, 0, 0, 0];
    this.cache = {};
    this.interval = setInterval(() => {
      if (this.currentAction) {
        this.currentAction();
      }
    }, 150);
  }

  reset() {
    clearInterval(this.interval);
    return this.bleController.destructor();
  }

  connect({ connId, serviceId }) {
    this.serviceId = getUUID(serviceId);

    if (this.connId === connId) {
      return this.connectPromise;
    }

    this.connId = connId;
    this.connectPromise = this.bleController.connect({
      connId,
      serviceId,
      onConnect: currentDevice => {
        console.log('[Pesk] connected', connId);
        this.retrieveServices(currentDevice).then(peripheralInfo => {
          console.log('========= peripheralInfo = ', peripheralInfo);
          this.peripheralInfo = peripheralInfo;
          bleStatusManager.setRetrieveServicesStatus();
          nativeiOS.RNSendMessage({ status: 'success', data: peripheralInfo });
        });
      },
    });

    return this.connectPromise;
  }

  retrieveServices(currentDevice) {
    console.log('[Pesk]  retrieveServices');
    return this.bleController.retrieveServices(currentDevice);
  }
}
