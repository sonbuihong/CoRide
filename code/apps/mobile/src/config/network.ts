import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001/api';
const configuredSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://10.0.2.2:5001';

const getDevelopmentHost = (): string | null => {
  if (!__DEV__) return null;

  // Expo Web chạy trên trình duyệt máy dev
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return window.location.hostname;
    }
    return 'localhost';
  }

  // Máy ảo Android (Android Emulator) luôn loopback về máy host qua 10.0.2.2
  if (Platform.OS === 'android' && !Device.isDevice) {
    return '10.0.2.2';
  }

  // Máy ảo iOS (iOS Simulator) dùng localhost
  if (Platform.OS === 'ios' && !Device.isDevice) {
    return 'localhost';
  }

  // Thiết bị thật chạy qua Expo Go: tự động nhận diện IP máy host chạy Metro
  const hostUri = Constants.expoConfig?.hostUri
    ?? (Constants as any).expoGoConfig?.debuggerHost
    ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost
    ?? (Constants as any).manifest?.debuggerHost;

  let host = hostUri?.split(':')[0];

  // Nếu hostUri không có, thử trích xuất từ linkingUri (ví dụ exp://10.38.15.9:8081)
  if (!host && Constants.linkingUri) {
    const match = Constants.linkingUri.match(/^[a-zA-Z]+:\/\/([^:/]+)/);
    if (match?.[1]) {
      host = match[1];
    }
  }

  if (!host || !/^(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})$/.test(host)) {
    return null;
  }

  return host;
};

const developmentHost = getDevelopmentHost();

export const API_URL = developmentHost
  ? `http://${developmentHost}:5001/api`
  : configuredApiUrl;

export const SOCKET_URL = developmentHost
  ? `http://${developmentHost}:5001`
  : configuredSocketUrl;

console.log('[CoRide Network Config]', {
  platform: Platform.OS,
  isDevice: Device.isDevice,
  developmentHost,
  API_URL,
  SOCKET_URL,
});
