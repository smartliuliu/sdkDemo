import { Platform } from 'react-native';

function getUUID(UUID) {
  return Platform.OS === 'android'
    ? `0000${UUID}-0000-1000-8000-00805F9B34FB`
    : UUID;
}

module.exports = getUUID;
