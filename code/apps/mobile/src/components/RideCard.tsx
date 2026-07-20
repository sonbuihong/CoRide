import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Users, ChevronRight, ShieldCheck, User } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Ride } from '../services/ride.service';
import { AppText } from './ui/AppText';

interface RideCardProps {
  ride: Ride;
}

export const RideCard: React.FC<RideCardProps> = ({ ride }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/ride/${ride.id}` as any);
  };

  const formattedTime = format(new Date(ride.departureTime), 'HH:mm');
  const formattedDate = format(new Date(ride.departureTime), 'dd/MM', { locale: vi });
  const routeDescription = `Chuyến đi từ ${ride.departure} đến ${ride.destination}, xuất phát lúc ${formattedTime} ngày ${formattedDate}, giá ${ride.price.toLocaleString('vi-VN')} đồng, còn ${ride.availableSeats} chỗ.`;

  return (
    <TouchableOpacity 
      onPress={handlePress}
      className="bg-surface p-5 rounded-[20px] mb-4 shadow-sm border border-border/40"
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={routeDescription}
      accessibilityHint="Nhấn để xem chi tiết chuyến đi này"
    >
      {/* Hàng Header: Giờ đi & Giá tiền */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Clock size={16} color="#64748B" className="mr-2" />
          <AppText variant="body" weight="bold" className="text-text-primary">
            {formattedTime}
          </AppText>
          <AppText variant="bodySmall" className="text-text-secondary ml-2 font-medium">
            {formattedDate}
          </AppText>
        </View>
        <AppText variant="h3" weight="bold" className="text-passenger">
          {ride.price.toLocaleString('vi-VN')}đ
        </AppText>
      </View>

      {/* Lộ trình Timeline dọc */}
      <View className="flex-row mb-4">
        <View className="items-center mr-3 mt-1.5">
          <View className="w-2.5 h-2.5 rounded-full border border-passenger bg-surface z-10" />
          <View className="w-[1px] h-9 bg-slate-200" />
          <View className="w-2.5 h-2.5 rounded-full border border-status-danger bg-surface z-10" />
        </View>
        <View className="flex-1">
          <AppText variant="bodySmall" weight="semibold" className="text-text-primary mb-4" numberOfLines={1}>
            {ride.departure}
          </AppText>
          <AppText variant="bodySmall" weight="semibold" className="text-text-primary" numberOfLines={1}>
            {ride.destination}
          </AppText>
        </View>
      </View>

      {/* Dữ liệu phụ: Số ghế trống */}
      <View className="flex-row items-center mb-4">
        <View className="flex-row items-center bg-slate-100 px-2.5 py-1 rounded-lg">
          <Users size={14} color="#64748B" />
          <AppText variant="caption" className="text-text-secondary ml-1 font-semibold">
            Còn {ride.availableSeats} chỗ trống
          </AppText>
        </View>
      </View>

      <View className="h-[1px] bg-slate-100 mb-4" />

      {/* Thông tin tài xế và badge uy tín */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {ride.driver?.avatar ? (
            <Image 
              source={{ uri: ride.driver.avatar }} 
              className="w-10 h-10 rounded-full mr-3 bg-slate-100" 
            />
          ) : (
            <View className="w-10 h-10 rounded-full mr-3 bg-passenger-soft items-center justify-center border border-passenger/10">
              <User size={18} color="#3B82F6" />
            </View>
          )}
          <View>
            <AppText variant="bodySmall" weight="bold" className="text-text-primary">
              {ride.driver?.firstName} {ride.driver?.lastName}
            </AppText>
            <View className="flex-row items-center mt-0.5">
              <AppText variant="caption" className="text-driver font-bold mr-1.5">
                ★ {ride.driver?.rating?.toFixed(1) || '5.0'}
              </AppText>
              <ShieldCheck size={12} color="#16A34A" />
              <AppText variant="caption" className="text-confirmed ml-0.5 font-semibold">
                Đã xác minh
              </AppText>
            </View>
          </View>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );
};
