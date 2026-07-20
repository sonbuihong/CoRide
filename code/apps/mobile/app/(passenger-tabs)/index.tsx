import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, TextInput } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Search, PlusCircle, ArrowUpDown, MapPin, Calendar, Users, CarFront } from 'lucide-react-native';

import { rideService } from '../../src/services/ride.service';
import { socketService } from '../../src/services/socket.service';
import { useAuth } from '../../src/hooks/useAuth';
import { RideCard } from '../../src/components/RideCard';
import { RideMap } from '../../src/components/RideMap';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';

export default function PassengerHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State quản lý việc nhập liệu tìm kiếm
  const [pickup, setPickup] = useState('Hà Đông, Hà Nội');
  const [destination, setDestination] = useState('Cầu Giấy, Hà Nội');
  const [seats, setSeats] = useState(1);
  
  // State truyền vào React Query để trigger fetch động
  const [searchFilter, setSearchFilter] = useState({
    origin: '',
    destination: '',
    seats: 1
  });
  
  const { data: rides, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['rides', searchFilter.origin, searchFilter.destination, searchFilter.seats],
    queryFn: () => rideService.getRides({
      origin: searchFilter.origin || undefined,
      destination: searchFilter.destination || undefined,
      seats: searchFilter.seats || undefined,
    }),
  });

  useEffect(() => {
    let isActive = true;

    const handleRideEvent = () => {
      if (isActive) refetch();
    };

    const handleRideDeleted = (data: { id: string }) => {
      if (!isActive) return;
      queryClient.setQueryData(['rides', searchFilter.origin, searchFilter.destination, searchFilter.seats], (oldRides: any) => {
        if (!oldRides) return oldRides;
        return oldRides.filter((ride: any) => ride.id !== data.id);
      });
    };

    const handleRideStatus = (data: { rideId: string; status: string }) => {
      if (!isActive) return;
      if (data.status === 'CANCELLED' || data.status === 'COMPLETED') {
        queryClient.setQueryData(['rides', searchFilter.origin, searchFilter.destination, searchFilter.seats], (oldRides: any) => {
          if (!oldRides) return oldRides;
          return oldRides.filter((ride: any) => ride.id !== data.rideId);
        });
      } else {
        refetch();
      }
    };

    const setupSocket = async () => {
      await socketService.connect();
      if (!isActive) return;

      socketService.on('ride:created', handleRideEvent);
      socketService.on('ride:updated', handleRideEvent);
      socketService.on('ride:deleted', handleRideDeleted);
      socketService.on('ride:status', handleRideStatus);
    };

    setupSocket();

    return () => {
      isActive = false;
      socketService.off('ride:created');
      socketService.off('ride:updated');
      socketService.off('ride:deleted');
      socketService.off('ride:status');
    };
  }, [refetch, queryClient, searchFilter]);

  // Hàm hoán đổi điểm đón và điểm đến
  const handleSwapLocations = () => {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
  };

  // Hàm kích hoạt tìm kiếm
  const handleSearch = () => {
    setSearchFilter({
      origin: pickup,
      destination: destination,
      seats: seats
    });
  };

  const displayAvatar = user?.avatarUrl || user?.avatar;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header cá nhân hóa */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-background">
        <View className="flex-row items-center">
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} className="w-12 h-12 rounded-full mr-3 bg-slate-100" />
          ) : (
            <View className="w-12 h-12 rounded-full mr-3 bg-passenger-soft items-center justify-center border border-passenger/10">
              <AppText variant="h2" weight="bold" className="text-passenger">
                {user?.firstName?.charAt(0) || 'U'}
              </AppText>
            </View>
          )}
          <View>
            <AppText variant="caption" className="text-text-secondary">Chào buổi sáng,</AppText>
            <AppText variant="body" weight="bold" className="text-text-primary">
              {user?.firstName} {user?.lastName}
            </AppText>
          </View>
        </View>
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center shadow-sm active:bg-slate-50"
          accessibilityRole="button"
          accessibilityLabel="Xem thông báo"
        >
          <Bell size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />
        }
      >
        {/* Bản đồ làm nền / Khung nhìn bản đồ */}
        <View className="px-6 mb-6">
          <RideMap />
        </View>

        {/* Hộp tìm kiếm chuyến đi (SearchRideCard) */}
        <View className="px-6 mb-6">
          <View className="bg-surface p-5 rounded-3xl shadow-sm border border-border/40">
            <View className="flex-row relative">
              {/* Cột mốc Timeline bên trái */}
              <View className="items-center mr-4 mt-3">
                <View className="w-3.5 h-3.5 rounded-full border-[3px] border-passenger bg-surface z-10" />
                <View className="w-0.5 h-16 bg-slate-200 my-1" />
                <View className="w-3.5 h-3.5 rounded-full border-[3px] border-status-danger bg-surface z-10" />
              </View>
              
              {/* Form nhập liệu Điểm đi / Điểm đến */}
              <View className="flex-1 justify-between py-1">
                <View className="pb-2 border-b border-slate-100 mb-2">
                  <AppText variant="caption" weight="medium" className="text-text-secondary">Điểm đón</AppText>
                  <TextInput
                    className="text-text-primary text-base font-semibold h-9 p-0"
                    value={pickup}
                    onChangeText={setPickup}
                    placeholder="Nhập vị trí đón khách"
                    placeholderTextColor="#94A3B8"
                    accessibilityLabel="Điểm đón"
                  />
                </View>
                <View className="pt-2">
                  <AppText variant="caption" weight="medium" className="text-text-secondary">Điểm đến</AppText>
                  <TextInput
                    className="text-text-primary text-base font-semibold h-9 p-0"
                    value={destination}
                    onChangeText={setDestination}
                    placeholder="Bạn muốn đi đâu?"
                    placeholderTextColor="#94A3B8"
                    accessibilityLabel="Điểm đến"
                  />
                </View>
              </View>
              
              {/* Nút đổi chiều nổi ở bên phải */}
              <View className="absolute right-0 top-[30%] z-20">
                <TouchableOpacity 
                  onPress={handleSwapLocations}
                  className="w-10 h-10 rounded-full bg-surface border border-border shadow-md items-center justify-center active:bg-slate-50"
                  accessibilityRole="button"
                  accessibilityLabel="Đổi chiều điểm đi và điểm đến"
                >
                  <ArrowUpDown size={18} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Selector phụ: Ngày đi & Số ghế */}
            <View className="flex-row mt-6 mb-5 space-x-3">
              <View className="flex-1 flex-row items-center justify-center bg-slate-50 py-3 rounded-xl border border-border/40 mr-2">
                <Calendar size={18} color="#64748B" className="mr-2" />
                <AppText variant="bodySmall" weight="semibold" className="text-text-primary">Hôm nay</AppText>
              </View>
              <TouchableOpacity 
                onPress={() => setSeats(prev => (prev % 4) + 1)}
                className="flex-1 flex-row items-center justify-center bg-slate-50 py-3 rounded-xl border border-border/40 ml-2"
                accessibilityRole="button"
                accessibilityLabel={`Số ghế đặt: ${seats} ghế`}
              >
                <Users size={18} color="#64748B" className="mr-2" />
                <AppText variant="bodySmall" weight="semibold" className="text-text-primary">{seats} ghế</AppText>
              </TouchableOpacity>
            </View>

            <AppButton 
              title="Tìm chuyến đi" 
              variant="passenger"
              onPress={handleSearch} 
              className="w-full" 
            />
          </View>
        </View>

        {/* Hành động nhanh (Quick Actions) */}
        <View className="px-6 mb-8 flex-row justify-between">
          <TouchableOpacity 
            className="flex-1 bg-passenger-soft p-4 rounded-2xl border border-passenger/10 mr-2"
            activeOpacity={0.7}
            onPress={handleSearch}
          >
            <Search size={24} color="#3B82F6" className="mb-2" />
            <AppText variant="body" weight="bold" className="text-text-primary">Tìm chuyến</AppText>
            <AppText variant="caption" className="text-text-secondary mt-1">Hàng ngàn chuyến đi mỗi ngày</AppText>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 bg-surface p-4 rounded-2xl border border-border/40 ml-2 shadow-sm"
            activeOpacity={0.7}
            onPress={() => router.push('/ride/create' as any)}
          >
            <PlusCircle size={24} color="#3B82F6" className="mb-2" />
            <AppText variant="body" weight="bold" className="text-text-primary">Đăng chuyến</AppText>
            <AppText variant="caption" className="text-text-secondary mt-1">Tiết kiệm chi phí đi lại</AppText>
          </TouchableOpacity>
        </View>

        {/* Chuyến đi đề xuất (Recommended Rides) */}
        <View className="px-6 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <AppText variant="h2" weight="bold" className="text-text-primary">
              {searchFilter.origin || searchFilter.destination ? 'Kết quả tìm kiếm' : 'Đề xuất cho bạn'}
            </AppText>
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
            <View className="py-12 items-center bg-surface rounded-3xl border border-border/40 shadow-sm">
              <CarFront size={48} color="#94A3B8" className="mb-4" />
              <AppText variant="body" weight="bold" className="text-text-primary">Chưa có chuyến đi phù hợp</AppText>
              <AppText variant="bodySmall" className="text-text-secondary mt-1">Thử tìm kiếm với lộ trình khác nhé</AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
