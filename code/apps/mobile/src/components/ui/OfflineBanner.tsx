import React, { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { WifiOff, Wifi } from 'lucide-react-native';
import { useAppStore } from '../../stores/useAppStore';
import { AppText } from './AppText';

export const OfflineBanner: React.FC = () => {
  const isOffline = useAppStore(state => state.isOffline);
  const [bannerState, setBannerState] = useState<'hidden' | 'offline' | 'reconnected'>('hidden');
  const wasOffline = useRef(false);

  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
      setBannerState('offline');
    } else {
      if (wasOffline.current) {
        setBannerState('reconnected');
        const timer = setTimeout(() => {
          setBannerState('hidden');
          wasOffline.current = false;
        }, 2500);
        return () => clearTimeout(timer);
      } else {
        setBannerState('hidden');
      }
    }
  }, [isOffline]);

  if (bannerState === 'hidden') return null;

  const config = {
    offline: {
      bg: 'bg-status-danger',
      text: 'Đang ngoại tuyến. Vui lòng kiểm tra kết nối mạng.',
      icon: WifiOff,
    },
    reconnected: {
      bg: 'bg-status-success',
      text: 'Đã kết nối lại mạng.',
      icon: Wifi,
    },
  }[bannerState];

  const Icon = config.icon;

  return (
    <View 
      className={`${config.bg} py-2 px-4 flex-row items-center justify-center`}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Icon size={16} color="white" className="mr-2" />
      <AppText variant="bodySmall" weight="medium" className="text-white">
        {config.text}
      </AppText>
    </View>
  );
};
