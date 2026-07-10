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
    router.push(`/ride/${ride.id}`);
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      className="bg-surface p-5 rounded-3xl mb-4 shadow-sm border border-border"
      activeOpacity={0.7}
    >
      {/* Header row */}
      <View className="flex-row justify-between items-center mb-5">
        <View className="flex-row items-center">
          <Clock size={16} color="#0F172A" className="mr-2" />
          <AppText variant="h3" weight="bold" className="text-text-primary">
            {format(new Date(ride.departureTime), 'HH:mm')}
          </AppText>
          <AppText variant="bodySmall" className="text-text-secondary ml-2">
            {format(new Date(ride.departureTime), 'dd/MM', { locale: vi })}
          </AppText>
        </View>
        <AppText variant="h3" weight="bold" className="text-primary">
          {ride.price.toLocaleString('vi-VN')}đ
        </AppText>
      </View>

      {/* Route Timeline */}
      <View className="flex-row mb-5">
        <View className="items-center mr-3 mt-1">
          <View className="w-3 h-3 rounded-full border-2 border-primary bg-surface z-10" />
          <View className="w-0.5 h-8 bg-border -my-1" />
          <View className="w-3 h-3 rounded-full border-2 border-status-danger bg-surface z-10" />
        </View>
        <View className="flex-1">
          <AppText variant="body" weight="medium" className="text-text-primary mb-5" numberOfLines={1}>
            {ride.departure}
          </AppText>
          <AppText variant="body" weight="medium" className="text-text-primary" numberOfLines={1}>
            {ride.destination}
          </AppText>
        </View>
      </View>

      {/* Metadata */}
      <View className="flex-row items-center mb-4">
        <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-md">
          <Users size={14} color="#64748B" />
          <AppText variant="caption" className="text-text-secondary ml-1 font-medium">
            Còn {ride.availableSeats} chỗ
          </AppText>
        </View>
      </View>

      <View className="h-[1px] bg-border mb-4" />

      {/* Driver row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {ride.driver?.avatar ? (
            <Image 
              source={{ uri: ride.driver.avatar }} 
              className="w-10 h-10 rounded-full mr-3 bg-gray-100" 
            />
          ) : (
            <View className="w-10 h-10 rounded-full mr-3 bg-primary-soft items-center justify-center">
              <User size={20} color="#3B82F6" />
            </View>
          )}
          <View>
            <AppText variant="body" weight="medium" className="text-text-primary">
              {ride.driver?.firstName} {ride.driver?.lastName}
            </AppText>
            <View className="flex-row items-center">
              <AppText variant="caption" className="text-status-warning font-medium mr-2">
                ★ {ride.driver?.rating?.toFixed(1) || '5.0'}
              </AppText>
              <ShieldCheck size={12} color="#10B981" />
            </View>
          </View>
        </View>
        <ChevronRight size={20} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );
};
