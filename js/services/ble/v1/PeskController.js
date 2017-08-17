import Promise from 'bluebird';
import BleController from './BleController';
import { onReady, onReceive, lockStatusToRedux } from './libHealth';
import getUUID from './getUUID';

export default class PeskController {
  constructor() {
    this.version = 1;
    this.bleController = new BleController();
    this.connId = '';
    this.connectPromise = null;
    this.unit = 'cm';
    this.onHeightCallback = null;
    this.cache = {};
  }

  _clearInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  reset() {
    return this.bleController.destructor().then(() => {
      this._clearInterval();
    });
  }

  connect({ connId }) {
    if (this.connId === connId) {
      return this.connectPromise;
    }

    this.connId = connId;
    this.connectPromise = this.bleController.connect({
      connId,
      onConnect: () => {
        console.log('[Pesk] connected', connId);
        Promise.delay(1000).then(() => {
          this.getLockStatus().then(lockStatusInHex =>
            lockStatusToRedux(lockStatusInHex),
          );
          this.readHealthData();
          this._clearInterval();
          this.interval = setInterval(() => {
            this.tick();
          }, 600);
        });
      },
    });

    return this.connectPromise;
  }

  setOnHeight(onHeight) {
    this.onHeightCallback = onHeight;
  }

  getHeight() {
    this.cache = {};
    return this.bleController
      .write(getUUID(this.connId), getUUID('FFF6'), [
        0x06,
        0x55,
        0xaa,
        0x05,
        0x00,
        0x00,
        0xdd,
      ])
      .then(() =>
        this.bleController.read(getUUID(this.connId), getUUID('FFF6')),
      )
      .then(this.onHeight.bind(this));
  }

  onHeight(heightInHex) {
    console.log('[Pesk] heightInHex = ', heightInHex);

    if (typeof this.onHeightCallback !== 'function') {
      return;
    }

    const errorCode = heightInHex.substr(6, 1);

    let error = errorCode !== '1' && errorCode !== '0';
    const data = {};

    if (error) {
      error = [errorCode, heightInHex.substr(8, 4)];
      data.error = error;
    } else {
      error = null;
      data.error = error;
      data.height = parseInt(heightInHex.substr(8, 4), 16) / 10;
      data.status = parseInt(heightInHex.substr(7, 1), 16);

      if (data.height < 55) {
        this.unit = 'inch';
        data.height *= 2.54;
      } else {
        this.unit = 'cm';
      }
    }

    if (
      data.height !== this.cache.height ||
      data.status !== this.cache.status ||
      data.error !== this.cache.error
    ) {
      this.cache = data;
      this.onHeightCallback(error, data);
    }
  }

  setHeight(h) {
    // this.vibrateStop();   //android端运行这行会有问题
    let useH = h;
    if (this.unit === 'inch') {
      useH /= 2.54;
    }
    const height = Math.floor(useH * 10);

    const low = height % 256;
    const high = height >> 8;

    return this.bleController
      .write(getUUID(this.connId), getUUID('FFF6'), [
        0x06,
        0x55,
        0xaa,
        0x04,
        high,
        low,
        0xdd,
      ])
      .catch(console.warn);
  }

  moveUp() {
    console.log('[Pesk] move up');
    return this.bleController
      .write(getUUID(this.connId), getUUID('FFF6'), [
        0x06,
        0x55,
        0xaa,
        0x01,
        0x00,
        0x00,
        0xdd,
      ])
      .catch(console.warn);
  }

  moveDown() {
    console.log('[Pesk] move down');
    return this.bleController
      .write(getUUID(this.connId), getUUID('FFF6'), [
        0x06,
        0x55,
        0xaa,
        0x03,
        0x00,
        0x00,
        0xdd,
      ])
      .catch(console.warn);
  }

  moveStop() {
    console.log('[Pesk] move stop');
    return this.bleController
      .write(getUUID(this.connId), getUUID('FFF6'), [
        0x06,
        0x55,
        0xaa,
        0x02,
        0x00,
        0x00,
        0xdd,
      ])
      .catch(console.warn);
  }

  vibrate() {
    console.log('[Pesk] vibrate start');
    return this.bleController
      .write(getUUID(this.connId), getUUID('FFF6'), [
        0x06,
        0x55,
        0xaa,
        0x06,
        0x01,
        0x00,
        0xdd,
      ])
      .catch(console.warn);
  }

  vibrateStop() {
    console.log('[Pesk] vibrate stop');
    return this.bleController
      .write(getUUID(this.connId), getUUID('FFF6'), [
        0x06,
        0x55,
        0xaa,
        0x06,
        0x00,
        0x00,
        0xdd,
      ])
      .catch(console.warn);
  }

  readHealthData() {
    console.log('[Pesk] read data');
    this.bleController.onValue(
      getUUID(this.connId),
      getUUID('FFF4'),
      onReceive.bind(this, this.onHeight.bind(this)),
      onReady.bind(this),
    );
  }

  tick() {
    console.log('[Pesk] tick');
    return this.bleController
      .write(getUUID(this.connId), getUUID('FFF6'), [
        0x06,
        0x55,
        0xaa,
        0x05,
        0x00,
        0x00,
        0xdd,
      ])
      .catch(console.warn);
  }

  getLockStatus() {
    return this.bleController
      .write(getUUID(this.connId), getUUID('FFF3'), [
        0x07,
        0x55,
        0xff,
        0x00,
        0x00,
        0x00,
        0x00,
        0xdd,
      ])
      .then(() =>
        this.bleController.read(getUUID(this.connId), getUUID('FFF3')),
      );
  }

  setLockStatus({ lock, delay }) {
    if (lock) {
      // 设延时锁
      const time00 = delay % 256;
      const time01 = (delay >> 8) % 256;
      const time02 = (delay >> 16) % 256;
      const time03 = (delay >> 24) % 256;
      return this.bleController
        .write(getUUID(this.connId), getUUID('FFF3'), [
          0x07,
          0x55,
          0xaa,
          time03,
          time02,
          time01,
          time00,
          0xdd,
        ])
        .catch(console.warn);
    }
    // 解锁
    return this.bleController
      .write(getUUID(this.connId), getUUID('FFF3'), [
        0x07,
        0x55,
        0xbb,
        0x00,
        0x00,
        0x00,
        0x00,
        0xdd,
      ])
      .catch(console.warn);
  }
}
