import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import type * as NotificationsType from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { apiClient as api } from '../api/client';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof NotificationsType | null = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (e) {
    console.warn('Failed to load expo-notifications', e);
  }
}

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<NotificationsType.Notification | undefined>(undefined);
  const notificationListener = useRef<NotificationsType.Subscription | null>(null);
  const responseListener = useRef<NotificationsType.Subscription | null>(null);

  useEffect(() => {
    if (isExpoGo || !Notifications) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Gửi token lên server
        api.post('/users/push-token', { token }).catch((err: any) => console.log('Update push token failed:', err));
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Xử lý logic khi người dùng nhấn vào thông báo (ví dụ điều hướng)
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return { expoPushToken, notification };
};

async function registerForPushNotificationsAsync() {
  if (!Notifications) return undefined;
  
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const existingStatus = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus.granted ? 'granted' : 'denied';
    if (!existingStatus.granted) {
      const { granted } = await Notifications.requestPermissionsAsync();
      finalStatus = granted ? 'granted' : 'denied';
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }
    
    // Project ID từ app.json hoặc Expo config (thêm fallback ngẫu nhiên nếu chạy local)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId || 'coride-local-dev-id';
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e: any) {
      if (e.message && e.message.includes('Expo Go')) {
        console.warn('Push Notifications (Android) không hỗ trợ trên Expo Go SDK 53+. Bỏ qua lấy token.');
      } else {
        console.warn('Không thể lấy Expo Push Token:', e.message);
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
