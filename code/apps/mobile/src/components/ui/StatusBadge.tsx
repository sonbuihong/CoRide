import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

export interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getConfig = (s: string) => {
    const uppercaseStatus = s.toUpperCase();
    switch (uppercaseStatus) {
      // Booking & Verification Status PENDING
      case 'PENDING':
        return { text: 'Chờ xác nhận', bg: 'bg-pending/10', color: 'text-pending' };
      
      // Booking & Ride Status
      case 'CONFIRMED':
        return { text: 'Đã xác nhận', bg: 'bg-confirmed/10', color: 'text-confirmed' };
      case 'REJECTED':
        return { text: 'Bị từ chối', bg: 'bg-rejected/10', color: 'text-rejected' };
      case 'CANCELLED':
        return { text: 'Đã hủy', bg: 'bg-cancelled/10', color: 'text-cancelled' };
      
      // Verification Status khusus
      case 'APPROVED':
        return { text: 'Đã phê duyệt', bg: 'bg-confirmed/10', color: 'text-confirmed' };
      case 'NOT_REGISTERED':
        return { text: 'Chưa đăng ký', bg: 'bg-slate-100', color: 'text-text-secondary' };
      case 'INCONSISTENT_DATA':
        return { text: 'Cần kiểm tra lại', bg: 'bg-rejected/10', color: 'text-rejected' };
      
      // Ride Status
      case 'SCHEDULED':
        return { text: 'Sắp khởi hành', bg: 'bg-passenger-soft', color: 'text-passenger' };
      case 'FULL':
        return { text: 'Đã đủ chỗ', bg: 'bg-slate-200', color: 'text-text-secondary' };
      case 'ONGOING':
        return { text: 'Đang diễn ra', bg: 'bg-passenger-soft', color: 'text-passenger' };
      case 'COMPLETED':
        return { text: 'Đã hoàn thành', bg: 'bg-confirmed/10', color: 'text-confirmed' };
        
      default:
        return { text: s, bg: 'bg-slate-100', color: 'text-text-secondary' };
    }
  };

  const config = getConfig(status);

  return (
    <View 
      className={`px-3 py-1 rounded-full ${config.bg} self-start`}
      accessibilityLabel={`Trạng thái: ${config.text}`}
    >
      <AppText variant="caption" weight="bold" className={`${config.color}`}>
        {config.text}
      </AppText>
    </View>
  );
};
