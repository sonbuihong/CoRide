import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001/api';
const configuredSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://10.0.2.2:5001';

const getDevelopmentHost = (): string | null => {
  if (!__DEV__ || Platform.OS === 'web') return null;

  const hostUri = Constants.expoConfig?.hostUri
    ?? (Constants as typeof Constants & { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (!host || !/^(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})$/.test(host)) {
    return null;
  }

  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    return '10.0.2.2';
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
