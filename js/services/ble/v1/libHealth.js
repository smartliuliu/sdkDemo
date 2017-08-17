import moment from 'moment';
import actions, { store } from 'redux-app-config';
import getUUID from './getUUID';

const UPDATE_HEALTH_DATA = params => {
  store.dispatch(actions.UPDATE_HEALTH_DATA(params));
};
const UPDATE_LOCK_STATUS = params => {
  store.dispatch(actions.UPDATE_LOCK_STATUS(params));
};
let dataArray = {};

function parseDataPoint(dataPoint) {
  const d = parseInt(dataPoint.substr(0, 2), 16);
  if (!d) {
    return {};
  }

  const t = parseInt(dataPoint.substr(2, 8), 16);
  const state = d === 5 ? 'sit' : 'stand';
  const a = d === 1 ? 'leave' : state;
  return { d, t, a };
}

function parseData(lineData) {
  const data = {};
  const index = parseInt(lineData.substr(4, 2), 16);

  for (let i = 0; i < 3; i += 1) {
    const d = parseDataPoint(lineData.substr(10 * i + 6, 10));
    if (d) {
      data[3 * index + i] = d;
    }
  }
  return data;
}

function onReady() {
  dataArray = {};
  this.bleController
    .write(getUUID(this.connId), getUUID('FFF6'), [
      0x06,
      0x55,
      0xaa,
      0x07,
      0x00,
      0x00,
      0xdd,
    ])
    .then(() => {
      const current = moment().unix();
      return this.bleController
        .read(getUUID(this.connId), getUUID('FFF6'))
        .then(result => parseInt(result.substr(2, 8), 16))
        .then(result => current - result);
    })
    .delay(1000)
    .then(t0 =>
      Object.keys(dataArray).map(key => {
        const action = dataArray[key].a;
        const t = dataArray[key].t + t0;
        const d = moment.unix(t).startOf('day').unix();
        return { action, t, d };
      }),
    )
    .then(data => {
      UPDATE_HEALTH_DATA({ data, peskId: store.getState().deviceData.id });
    });
}

function onReceive(onHeight, data) {
  const index = parseInt(data.substr(4, 2), 16);

  dataArray = {
    ...dataArray,
    ...parseData(data),
  };

  if (index === 65) {
    this.bleController.onValue(
      getUUID(this.connId),
      getUUID('FFF7'),
      onHeight,
      () => {
        this.bleController
          .write(getUUID(this.connId), getUUID('FFF6'), [
            0x06,
            0x55,
            0xaa,
            0x05,
            0x00,
            0x00,
            0xdd,
          ])
          .catch(console.warn)
          .then(() =>
            this.bleController
              .read(getUUID(this.connId), getUUID('FFF6'))
              .then(onHeight),
          );
      },
    );
  }
}

function lockStatusToRedux(lockStatusInHex) {
  let lockStatus = 1;
  let lockTime = null;
  if (lockStatusInHex) {
    lockStatus = parseInt(lockStatusInHex.substr(4, 2), 16);
    lockTime = parseInt(lockStatusInHex.substr(6, 8), 16);
  }

  if (lockStatus === 0) {
    // 未锁状态
    UPDATE_LOCK_STATUS({
      lockStatus: {
        locked: false,
        lockTime: null,
      },
    });
  } else if (lockStatus === 1) {
    // 已锁状态
    UPDATE_LOCK_STATUS({
      lockStatus: {
        locked: true,
        lockTime,
      },
    });
  } else if (lockStatus === 2) {
    // 延时锁
    UPDATE_LOCK_STATUS({
      lockStatus: {
        locked: true,
        lockTime,
      },
    });
  }
}

module.exports = {
  onReady,
  onReceive,
  lockStatusToRedux,
};
