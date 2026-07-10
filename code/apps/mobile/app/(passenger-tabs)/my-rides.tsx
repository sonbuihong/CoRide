// Tab "Chuyến đi" — hiển thị chuyến active hoặc lịch sử
// Nếu có active booking → Banner nổi bật dẫn đến active-ride screen
// Nếu không → Danh sách booking + ride đã tạo

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, Clock, ChevronRight, Car } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useActiveRide } from '../../src/hooks/useActiveRide';
import { bookingService } from '../../src/services/booking.service';

export default function MyRidesScreen() {
  const router = useRouter();
  const { activeBooking, isLoading: isActiveLoading } = useActiveRide();

  // Lấy lịch sử booking (passenger)
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Đang chờ';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'CANCELLED': return 'Đã hủy';
      case 'REJECTED': return 'Đã từ chối';
      default: return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-50 text-yellow-700';
      case 'CONFIRMED': return 'bg-green-50 text-green-700';
      case 'CANCELLED': return 'bg-red-50 text-red-600';
      case 'REJECTED': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />
        }
      >
        {/* Banner chuyến đi đang active */}
        {activeBooking && (
          <TouchableOpacity
            onPress={() => router.push('/ride/active-ride')}
            className="bg-blue-600 p-5 rounded-2xl mb-6 shadow-md"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Navigation size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Chuyến đi đang hoạt động
                </Text>
              </View>
              <ChevronRight size={20} color="white" />
            </View>

            {/* Info chuyến active */}
            <View className="bg-white/10 rounded-xl p-3">
              <View className="flex-row items-center mb-2">
                <View className="w-2.5 h-2.5 bg-green-400 rounded-full mr-2" />
                <Text className="text-white/90 text-sm flex-1" numberOfLines={1}>
                  {activeBooking.ride?.origin || 'Điểm đi'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-2.5 h-2.5 bg-red-400 rounded-full mr-2" />
                <Text className="text-white/90 text-sm flex-1" numberOfLines={1}>
                  {activeBooking.ride?.destination || 'Điểm đến'}
                </Text>
              </View>
            </View>

            <Text className="text-white/70 text-xs mt-3">
              Vai trò: {activeBooking.userRole === 'DRIVER' ? 'Tài xế' : 'Hành khách'}
              {' - '}Nhấn để xem bản đồ
            </Text>
          </TouchableOpacity>
        )}

        {/* Tiêu đề lịch sử */}
        <Text className="text-xl font-bold text-gray-800 mb-4">
          Lịch sử chuyến đi
        </Text>

        {/* Danh sách bookings */}
        {!bookings || bookings.length === 0 ? (
          <View className="py-16 items-center bg-white rounded-3xl border border-dashed border-gray-200 px-6">
            <Car size={56} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 font-medium text-center">
              Bạn chưa có chuyến đi nào
            </Text>
            <Text className="text-gray-400 text-sm mt-1 text-center">
              Tìm và đặt chuyến đi từ trang chủ
            </Text>
          </View>
        ) : (
          bookings.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100"
              onPress={() => router.push(`/booking/${item.id}`)}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-3">
                  <Text className="text-gray-800 font-bold" numberOfLines={1}>
                    {item.ride?.destination || 'Không rõ'}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <MapPin size={12} color="#9CA3AF" />
                    <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
                      Từ: {item.ride?.origin || 'Không rõ'}
                    </Text>
                  </View>
                </View>

                <View className={`px-2.5 py-1 rounded-lg ${getStatusStyle(item.status).split(' ')[0]}`}>
                  <Text className={`text-xs font-bold ${getStatusStyle(item.status).split(' ')[1]}`}>
                    {getStatusText(item.status)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Clock size={13} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs ml-1">
                  {item.ride?.departureTime
                    ? format(new Date(item.ride.departureTime), 'HH:mm, dd/MM/yyyy', { locale: vi })
                    : 'N/A'
                  }
                </Text>
                {item.totalPrice !== undefined && (
                  <>
                    <Text className="text-gray-300 mx-2">-</Text>
                    <Text className="text-blue-600 text-xs font-bold">
                      {item.totalPrice.toLocaleString('vi-VN')}đ
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
