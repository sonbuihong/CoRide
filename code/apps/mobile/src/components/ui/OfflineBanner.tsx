import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useAppStore } from '../../stores/useAppStore';
import { AppText } from './AppText';

export const OfflineBanner: React.FC = () => {
  const isOffline = useAppStore(state => state.isOffline);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [isOffline]);

  if (!show) return null;

  return (
    <View className="bg-status-danger py-2 px-4 flex-row items-center justify-center">
      <WifiOff size={16} color="white" className="mr-2" />
      <AppText variant="bodySmall" weight="medium" className="text-white">
        Đang ngoại tuyến. Vui lòng kiểm tra kết nối mạng.
      </AppText>
    </View>
  );
};
