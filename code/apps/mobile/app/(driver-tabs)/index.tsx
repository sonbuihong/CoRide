import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, PlusCircle, CarFront, FileText, Landmark, ShieldCheck, Star } from 'lucide-react-native';

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
    queryFn: () => rideService.getMyRides(),
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
  // Giả lập/lấy thu nhập thực tế từ ví tài xế
  const driverEarnings = (user as any)?.wallet?.driverEarnings || 0;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header cá nhân hóa chế độ Tài xế */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-background">
        <View className="flex-row items-center">
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} className="w-12 h-12 rounded-full mr-3 bg-slate-100" />
          ) : (
            <View className="w-12 h-12 rounded-full mr-3 bg-driver/10 items-center justify-center border border-driver/20">
              <AppText variant="h2" weight="bold" className="text-driver">
                {user?.firstName?.charAt(0) || 'D'}
              </AppText>
            </View>
          )}
          <View>
            <AppText variant="caption" className="text-text-secondary">Chế độ Tài xế,</AppText>
            <AppText variant="body" weight="bold" className="text-text-primary">
              {user?.firstName} {user?.lastName}
            </AppText>
          </View>
        </View>
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-surface border border-border/30 items-center justify-center shadow-sm active:bg-slate-50"
          accessibilityRole="button"
          accessibilityLabel="Xem thông báo tài xế"
        >
          <Bell size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0284C7" />
        }
      >
        <View className="px-6 py-2">
          <AppText variant="h1" weight="bold" className="text-text-primary mb-1">
            Bảng điều khiển tài xế
          </AppText>
          <AppText variant="bodySmall" className="text-text-secondary">
            Theo dõi doanh thu hành trình và quản lý các yêu cầu đặt chỗ của bạn.
          </AppText>
        </View>

        {/* Panel Thu nhập và Chỉ số Vận hành (Earnings Board) */}
        <View className="px-6 mt-4 mb-6">
          <View className="bg-surface p-5 rounded-3xl border border-border/40 shadow-sm">
            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-100">
              <View>
                <AppText variant="caption" className="text-text-secondary">Tổng thu nhập tích lũy</AppText>
                <AppText variant="display" weight="bold" className="text-driver mt-1">
                  {driverEarnings.toLocaleString('vi-VN')}đ
                </AppText>
              </View>
              <View className="w-12 h-12 bg-driver/10 rounded-full items-center justify-center">
                <Landmark size={24} color="#0284C7" />
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="flex-1 items-center border-r border-slate-100">
                <AppText variant="caption" className="text-text-secondary">Điểm đánh giá</AppText>
                <View className="flex-row items-center mt-1">
                  <Star size={14} color="#F59E0B" fill="#F59E0B" className="mr-1" />
                  <AppText variant="body" weight="bold" className="text-text-primary">
                    {(user as any)?.rating?.toFixed(1) || '5.0'}
                  </AppText>
                </View>
              </View>
              <View className="flex-1 items-center">
                <AppText variant="caption" className="text-text-secondary">Chuyến đi đã đăng</AppText>
                <AppText variant="body" weight="bold" className="text-text-primary mt-1">
                  {rides?.length || 0} chuyến
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Nút hành động nhanh: Đăng chuyến mới */}
        <View className="px-6 mb-6">
          <TouchableOpacity 
            className="bg-driver p-5 rounded-3xl shadow-md flex-row items-center justify-between active:opacity-90"
            activeOpacity={0.85}
            onPress={() => router.push('/(driver-tabs)/publish' as any)}
            accessibilityRole="button"
            accessibilityLabel="Đăng chuyến đi mới để đón hành khách"
          >
            <View>
              <AppText variant="body" weight="bold" className="text-white mb-1">Đăng chuyến đi mới</AppText>
              <AppText variant="bodySmall" className="text-white/80">Chia sẻ số ghế trống để nhận chia sẻ chi phí</AppText>
            </View>
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
              <CarFront size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Yêu cầu đặt chỗ chờ duyệt */}
        <View className="px-6 mb-6">
          <AppText variant="h2" weight="bold" className="text-text-primary mb-3">Yêu cầu chờ duyệt</AppText>
          <View className="bg-surface p-6 rounded-3xl border border-border/40 items-center shadow-sm">
            <FileText size={40} color="#94A3B8" className="mb-3" />
            <AppText variant="bodySmall" weight="bold" className="text-text-primary mb-1">Không có yêu cầu chờ duyệt</AppText>
            <AppText variant="caption" className="text-text-secondary text-center">
              Tất cả các yêu cầu đặt chỗ của bạn đã được giải quyết xong.
            </AppText>
          </View>
        </View>

        {/* Lịch trình chuyến đi sắp tới */}
        <View className="px-6 pb-10">
          <AppText variant="h2" weight="bold" className="text-text-primary mb-3">Chuyến đi của tôi</AppText>

          {isLoading ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="large" color="#0284C7" />
            </View>
          ) : rides && rides.length > 0 ? (
            rides.map((ride: any) => (
              <RideCard key={ride.id} ride={ride} />
            ))
          ) : (
            <View className="py-12 items-center bg-surface rounded-3xl border border-border/40 shadow-sm">
              <CarFront size={48} color="#94A3B8" className="mb-4" />
              <AppText variant="bodySmall" weight="bold" className="text-text-primary">Chưa đăng chuyến đi nào</AppText>
              <AppText variant="caption" className="text-text-secondary mt-1">Bấm nút trên để bắt đầu chia sẻ hành trình đầu tiên.</AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
