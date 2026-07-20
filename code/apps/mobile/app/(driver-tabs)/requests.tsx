import React from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Navigation, Clock, ChevronRight, Car } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useActiveRide } from '../../src/hooks/useActiveRide';
import { bookingService } from '../../src/services/booking.service';
import { AppText } from '../../src/components/ui/AppText';
import { StatusBadge } from '../../src/components/ui/StatusBadge';

export default function MyRidesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeBooking, isLoading: isActiveLoading } = useActiveRide();

  // Lấy lịch sử booking (của passenger hoặc driver)
  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingService.getMyBookings(),
  });

  const bookings = bookingsData?.bookings || bookingsData || [];
  const isLoading = isActiveLoading || isBookingsLoading;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View 
      className="flex-1 bg-background" 
      style={{ paddingTop: insets.top }}
    >
      {/* Header trang */}
      <View className="px-6 py-4 bg-background border-b border-border/30 mb-2">
        <AppText variant="h2" weight="bold" className="text-text-primary">Chuyến đi của tôi</AppText>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />
        }
      >
        {/* Banner chuyến đi đang active */}
        {activeBooking && (
          <TouchableOpacity
            onPress={() => router.push('/ride/active-ride' as any)}
            className={`${
              activeBooking.userRole === 'DRIVER' ? 'bg-driver' : 'bg-passenger'
            } p-5 rounded-3xl mb-6 shadow-md`}
            accessibilityRole="button"
            accessibilityLabel="Bạn có một chuyến đi đang hoạt động, nhấn để theo dõi"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Navigation size={20} color="white" />
                <AppText variant="body" weight="bold" className="text-white ml-2">
                  Chuyến đi đang diễn ra
                </AppText>
              </View>
              <ChevronRight size={20} color="white" />
            </View>

            {/* Thông tin chuyến active */}
            <View className="bg-white/10 rounded-2xl p-3 border border-white/5">
              <View className="flex-row items-center mb-2">
                <View className="w-2.5 h-2.5 bg-green-400 rounded-full mr-2" />
                <AppText variant="bodySmall" weight="semibold" className="text-white flex-1" numberOfLines={1}>
                  Từ: {activeBooking.ride?.origin || 'Điểm đi'}
                </AppText>
              </View>
              <View className="flex-row items-center">
                <View className="w-2.5 h-2.5 bg-red-400 rounded-full mr-2" />
                <AppText variant="bodySmall" weight="semibold" className="text-white flex-1" numberOfLines={1}>
                  Đến: {activeBooking.ride?.destination || 'Điểm đến'}
                </AppText>
              </View>
            </View>

            <AppText variant="caption" className="text-white/80 mt-3 font-medium">
              Vai trò: {activeBooking.userRole === 'DRIVER' ? 'Tài xế' : 'Hành khách'} • Nhấn để xem bản đồ
            </AppText>
          </TouchableOpacity>
        )}

        {/* Tiêu đề lịch sử */}
        <AppText variant="body" weight="bold" className="text-text-primary mb-4 ml-1">
          Lịch sử chuyến đi
        </AppText>

        {/* Danh sách bookings */}
        {!bookings || bookings.length === 0 ? (
          <View className="py-16 items-center bg-surface rounded-3xl border border-border/40 px-6 shadow-sm">
            <Car size={56} color="#94A3B8" className="mb-4" />
            <AppText variant="bodySmall" weight="bold" className="text-text-primary mb-1">
              Bạn chưa có chuyến đi nào
            </AppText>
            <AppText variant="caption" className="text-text-secondary text-center">
              Tìm và đặt chuyến đi hoặc đăng chuyến đi để bắt đầu hành trình.
            </AppText>
          </View>
        ) : (
          bookings.map((item: any) => {
            const departureTime = item.ride?.departureTime;
            const formattedTime = departureTime 
              ? format(new Date(departureTime), 'HH:mm, dd/MM/yyyy', { locale: vi })
              : 'N/A';
            const price = item.totalPrice !== undefined
              ? `${item.totalPrice.toLocaleString('vi-VN')}đ`
              : '';

            return (
              <TouchableOpacity
                key={item.id}
                className="bg-surface p-5 rounded-3xl mb-4 shadow-sm border border-border/40 active:bg-slate-50"
                onPress={() => router.push(`/booking/${item.id}` as any)}
                accessibilityRole="button"
                accessibilityLabel={`Chuyến đi đến ${item.ride?.destination}. Trạng thái ${item.status}`}
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 mr-3">
                    <AppText variant="body" weight="bold" className="text-text-primary mb-1.5" numberOfLines={1}>
                      Đến: {item.ride?.destination || 'Không rõ'}
                    </AppText>
                    <View className="flex-row items-center">
                      <MapPin size={12} color="#64748B" className="mr-1" />
                      <AppText variant="caption" className="text-text-secondary" numberOfLines={1}>
                        Từ: {item.ride?.origin || 'Không rõ'}
                      </AppText>
                    </View>
                  </View>

                  <StatusBadge status={item.status} />
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-slate-50">
                  <View className="flex-row items-center">
                    <Clock size={13} color="#64748B" className="mr-1.5" />
                    <AppText variant="caption" className="text-text-secondary">
                      {formattedTime}
                    </AppText>
                  </View>
                  {price ? (
                    <AppText variant="bodySmall" weight="bold" className="text-passenger">
                      {price}
                    </AppText>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
