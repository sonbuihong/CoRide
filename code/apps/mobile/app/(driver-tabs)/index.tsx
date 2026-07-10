import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, PlusCircle, CarFront, FileText } from 'lucide-react-native';

import { rideService } from '../../src/services/ride.service';
import { socketService } from '../../src/services/socket.service';
import { useAuth } from '../../src/hooks/useAuth';
import { RideCard } from '../../src/components/RideCard';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';

export default function DriverHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: rides, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-driver-rides'],
    queryFn: () => rideService.getMyRides(), // TODO: Cần API riêng cho tài xế nếu cần
  });

  useEffect(() => {
    let isActive = true;

    const handleRideEvent = () => {
      if (isActive) refetch();
    };

    const setupSocket = async () => {
      await socketService.connect();
      if (!isActive) return;

      socketService.on('ride:created', handleRideEvent);
      socketService.on('ride:updated', handleRideEvent);
    };

    setupSocket();

    return () => {
      isActive = false;
      socketService.off('ride:created');
      socketService.off('ride:updated');
    };
  }, [refetch, queryClient]);

  const displayAvatar = user?.avatarUrl || user?.avatar;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Custom Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-background">
        <View className="flex-row items-center">
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} className="w-12 h-12 rounded-full mr-3 bg-gray-100" />
          ) : (
            <View className="w-12 h-12 rounded-full mr-3 bg-primary-soft items-center justify-center">
              <AppText variant="h2" weight="bold" className="text-primary">
                {user?.firstName?.charAt(0) || 'U'}
              </AppText>
            </View>
          )}
          <View>
            <AppText variant="caption" className="text-text-secondary">Chào buổi sáng,</AppText>
            <AppText variant="h3" weight="bold" className="text-text-primary">
              {user?.firstName} {user?.lastName}
            </AppText>
          </View>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center">
          <Bell size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />
        }
      >
        <View className="px-6 py-2">
          <AppText variant="h1" weight="bold" className="text-text-primary mb-2">
            Quản lý các chuyến đi của bạn
          </AppText>
        </View>

        {/* Primary Action */}
        <View className="px-6 mb-8 mt-4">
          <TouchableOpacity 
            className="bg-primary p-5 rounded-[24px] shadow-sm flex-row items-center justify-between"
            activeOpacity={0.8}
            onPress={() => router.push('/(driver-tabs)/publish')}
          >
            <View>
              <AppText variant="h3" weight="bold" className="text-surface mb-1">Đăng chuyến mới</AppText>
              <AppText variant="bodySmall" className="text-primary-soft">Chia sẻ ghế trống, tăng thu nhập</AppText>
            </View>
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
              <CarFront size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Pending Requests */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <AppText variant="h2" weight="bold" className="text-text-primary">Yêu cầu chờ duyệt</AppText>
          </View>
          
          <View className="bg-surface p-6 rounded-3xl border border-border items-center shadow-sm">
            <FileText size={40} color="#94A3B8" className="mb-3" />
            <AppText variant="body" weight="medium" className="text-text-primary mb-1">Không có yêu cầu nào</AppText>
            <AppText variant="bodySmall" className="text-text-secondary text-center mb-4">
              Bạn hiện không có yêu cầu đặt chỗ nào cần xác nhận.
            </AppText>
          </View>
        </View>

        {/* Upcoming Driver Rides */}
        <View className="px-6 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <AppText variant="h2" weight="bold" className="text-text-primary">Lịch trình sắp tới</AppText>
          </View>

          {isLoading ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : rides && rides.length > 0 ? (
            rides.map((ride: any) => (
              <RideCard key={ride.id} ride={ride} />
            ))
          ) : (
            <View className="py-12 items-center bg-surface rounded-3xl border border-border shadow-sm">
              <CarFront size={48} color="#94A3B8" className="mb-4" />
              <AppText variant="body" weight="bold" className="text-text-primary">Chưa có chuyến đi nào</AppText>
              <AppText variant="bodySmall" className="text-text-secondary mt-1">Đăng chuyến ngay để bắt đầu hành trình</AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
