import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getConfig = (s: string) => {
    switch (s) {
      // Booking Status
      case 'PENDING':
        return { text: 'Chờ xác nhận', bg: 'bg-status-warning/10', color: 'text-status-warning' };
      case 'CONFIRMED':
        return { text: 'Đã xác nhận', bg: 'bg-status-success/10', color: 'text-status-success' };
      case 'REJECTED':
        return { text: 'Bị từ chối', bg: 'bg-secondary/10', color: 'text-secondary' };
      
      // Ride Status
      case 'SCHEDULED':
        return { text: 'Sắp khởi hành', bg: 'bg-status-info/10', color: 'text-status-info' };
      case 'FULL':
        return { text: 'Đã đủ chỗ', bg: 'bg-status-info/10', color: 'text-status-info' };
      case 'ONGOING':
        return { text: 'Đang diễn ra', bg: 'bg-status-info/10', color: 'text-status-info' };
      
      // Chung
      case 'COMPLETED':
        return { text: 'Đã hoàn thành', bg: 'bg-status-success/10', color: 'text-status-success' };
      case 'CANCELLED':
        return { text: 'Đã hủy', bg: 'bg-status-danger/10', color: 'text-status-danger' };
        
      default:
        return { text: s, bg: 'bg-secondary/10', color: 'text-secondary' };
    }
  };

  const config = getConfig(status);

  return (
    <View className={`px-3 py-1 rounded-full ${config.bg} self-start`}>
      <AppText variant="caption" weight="bold" className={`${config.color}`}>
        {config.text}
      </AppText>
    </View>
  );
};
