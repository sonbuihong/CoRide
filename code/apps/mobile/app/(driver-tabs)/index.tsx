import React, { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CarFront, FileText, Landmark, Star } from 'lucide-react-native';

import { rideService } from '../../src/services/ride.service';
import { socketService } from '../../src/services/socket.service';
import { useAuth } from '../../src/hooks/useAuth';
import { RideCard } from '../../src/components/RideCard';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';
import { useDriverAvailability } from '../../src/hooks/useDriverAvailability';

export default function DriverHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isOnline, isChanging, goOnline, goOffline } = useDriverAvailability();
  
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

  // Giả lập/lấy thu nhập thực tế từ ví tài xế
  const driverEarnings = (user as any)?.wallet?.driverEarnings || 0;

  return (
    <View className="flex-1 bg-background">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0284C7" />
        }
      >
        <View className="px-6 py-2">
          <AppText variant="h1" weight="bold" className="text-text-primary mb-1">
            Sẵn sàng cho hành trình mới?
          </AppText>
          <AppText variant="bodySmall" className="text-text-secondary">
            Bật trực tuyến để nhận chuyến hoặc đăng trước một hành trình đi chung.
          </AppText>
        </View>

        {/* Panel Thu nhập và Chỉ số Vận hành (Earnings Board) */}
        <View className="px-6 mt-4 mb-6">
          <View className={`mb-4 rounded-2xl border p-4 ${isOnline ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
            <AppText weight="bold" className="text-text-primary">{isOnline ? 'Đang sẵn sàng nhận cuốc' : 'Bạn đang ngoại tuyến'}</AppText>
            <AppText variant="caption" className="mb-3 mt-1 text-text-secondary">Bật trực tuyến để hệ thống có thể gửi yêu cầu gọi xe nhanh gần bạn.</AppText>
            <AppButton
              title={isOnline ? 'Ngừng nhận cuốc' : 'Bắt đầu nhận cuốc'}
              variant={isOnline ? 'outline' : 'driver'}
              isLoading={isChanging}
              onPress={isOnline ? goOffline : goOnline}
            />
          </View>
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
