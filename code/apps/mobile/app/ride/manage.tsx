import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { rideService } from '../../src/services/ride.service';
import { useRouter } from 'expo-router';
import { Car, Clock, Users, Plus, ChevronRight, AlertCircle } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function ManageRidesScreen() {
  const router = useRouter();
  const { data: myRides, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-rides'],
    queryFn: () => rideService.getMyRides(),
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const statusPresentation: Record<string, { label: string; className: string }> = {
    SCHEDULED: { label: 'Sắp khởi hành', className: 'bg-blue-100 text-blue-700' },
    FULL: { label: 'Đã đủ chỗ', className: 'bg-amber-100 text-amber-700' },
    ONGOING: { label: 'Đang chạy', className: 'bg-green-100 text-green-700' },
    COMPLETED: { label: 'Đã hoàn thành', className: 'bg-slate-100 text-slate-600' },
    CANCELLED: { label: 'Đã hủy', className: 'bg-red-100 text-red-700' },
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />
        }
      >
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">Chuyến đi của tôi</Text>
          <TouchableOpacity 
            onPress={() => router.push('/ride/create')}
            className="bg-blue-600 p-2 rounded-full"
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        {!myRides || myRides.length === 0 ? (
          <View className="py-20 items-center bg-white rounded-3xl border border-dashed border-gray-200 px-6">
            <Car size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 font-medium text-center">Bạn chưa đăng chuyến đi nào</Text>
            <TouchableOpacity 
              onPress={() => router.push('/ride/create')}
              className="mt-6 bg-blue-600 px-8 py-3 rounded-xl"
            >
              <Text className="text-white font-bold">Đăng chuyến ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          myRides.map((ride: any) => {
            const status = statusPresentation[ride.status] ?? { label: ride.status, className: 'bg-gray-100 text-gray-600' };
            const bookedSeats = Math.max(0, (ride.totalSeats ?? ride.offeredSeats ?? 0) - (ride.availableSeats ?? 0));
            return (
            <TouchableOpacity 
              key={ride.id}
              className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100"
              onPress={() => router.push(`/ride/${ride.id}`)}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-gray-800 font-bold text-lg" numberOfLines={1}>{ride.destination}</Text>
                  <Text className="text-gray-500 text-sm">Từ: {ride.departure}</Text>
                </View>
                <View className={`px-2 py-1 rounded-md ${status.className.split(' ')[0]}`}>
                  <Text className={`text-xs font-bold ${status.className.split(' ')[1]}`}>
                    {status.label}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center space-x-4 mt-2">
                <View className="flex-row items-center mr-4">
                  <Clock size={14} color="#6B7280" />
                  <Text className="ml-1 text-gray-500 text-xs">
                    {format(new Date(ride.departureTime), 'HH:mm, dd/MM', { locale: vi })}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Users size={14} color="#6B7280" />
                  <Text className="ml-1 text-gray-500 text-xs">
                    {bookedSeats}/{ride.totalSeats} ghế
                  </Text>
                </View>
              </View>

              {ride.pendingBookings > 0 && (
                <View className="mt-4 bg-orange-50 p-3 rounded-xl flex-row items-center">
                  <AlertCircle size={16} color="#F97316" />
                  <Text className="ml-2 text-orange-700 font-medium text-xs">
                    Có {ride.pendingBookings} yêu cầu đang chờ duyệt
                  </Text>
                  <View className="flex-1" />
                  <ChevronRight size={16} color="#F97316" />
                </View>
              )}
            </TouchableOpacity>
          );
          })
        )}
      </ScrollView>
    </View>
  );
}
