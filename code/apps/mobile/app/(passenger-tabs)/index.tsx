import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Search, PlusCircle, ArrowUpDown, MapPin, Calendar, Users, CarFront } from 'lucide-react-native';

import { rideService } from '../../src/services/ride.service';
import { socketService } from '../../src/services/socket.service';
import { useAuth } from '../../src/hooks/useAuth';
import { RideCard } from '../../src/components/RideCard';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';

export default function PassengerHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: rides, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['rides', ''],
    queryFn: () => rideService.getRides({}),
  });

  useEffect(() => {
    let isActive = true;

    const handleRideEvent = () => {
      if (isActive) refetch();
    };

    const handleRideDeleted = (data: { id: string }) => {
      if (!isActive) return;
      queryClient.setQueryData(['rides', ''], (oldRides: any) => {
        if (!oldRides) return oldRides;
        return oldRides.filter((ride: any) => ride.id !== data.id);
      });
    };

    const handleRideStatus = (data: { rideId: string; status: string }) => {
      if (!isActive) return;
      if (data.status === 'CANCELLED' || data.status === 'COMPLETED') {
        queryClient.setQueryData(['rides', ''], (oldRides: any) => {
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
        {/* Hero Section */}
        <View className="px-6 py-4">
          <AppText variant="h1" weight="bold" className="text-text-primary mb-2">
            Bạn muốn đi đâu hôm nay?
          </AppText>
        </View>

        {/* SearchRideCard */}
        <View className="px-6 mb-6">
          <View className="bg-surface p-5 rounded-[24px] shadow-sm border border-border">
            <View className="flex-row relative">
              <View className="items-center mr-4 mt-2">
                <View className="w-4 h-4 rounded-full border-[3px] border-primary bg-surface z-10" />
                <View className="w-0.5 h-12 bg-border my-1" />
                <View className="w-4 h-4 rounded-full border-[3px] border-status-danger bg-surface z-10" />
              </View>
              
              <View className="flex-1 justify-between py-1">
                <TouchableOpacity className="pb-3 border-b border-border mb-3">
                  <AppText variant="body" weight="medium" className="text-text-secondary">Điểm đón</AppText>
                  <AppText variant="h3" weight="bold" className="text-text-primary mt-1">Hà Nội</AppText>
                </TouchableOpacity>
                <TouchableOpacity>
                  <AppText variant="body" weight="medium" className="text-text-secondary">Điểm đến</AppText>
                  <AppText variant="h3" weight="bold" className="text-text-primary mt-1">Hải Phòng</AppText>
                </TouchableOpacity>
              </View>
              
              <View className="absolute right-0 top-[35%]">
                <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-50 border border-border items-center justify-center">
                  <ArrowUpDown size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row mt-5 mb-5 space-x-3">
              <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-gray-50 py-3 rounded-xl border border-border mr-2">
                <Calendar size={18} color="#64748B" className="mr-2" />
                <AppText variant="bodySmall" weight="medium" className="text-text-primary">Hôm nay</AppText>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-gray-50 py-3 rounded-xl border border-border ml-2">
                <Users size={18} color="#64748B" className="mr-2" />
                <AppText variant="bodySmall" weight="medium" className="text-text-primary">1 hành khách</AppText>
              </TouchableOpacity>
            </View>

            <AppButton title="Tìm chuyến đi" onPress={() => {}} className="w-full" />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-8 flex-row justify-between space-x-4">
          <TouchableOpacity 
            className="flex-1 bg-primary-soft p-4 rounded-2xl border border-primary/20 mr-2"
            activeOpacity={0.7}
          >
            <Search size={24} color="#3B82F6" className="mb-2" />
            <AppText variant="body" weight="bold" className="text-text-primary">Tìm chuyến</AppText>
            <AppText variant="caption" className="text-text-secondary mt-1">Hàng ngàn chuyến đi mỗi ngày</AppText>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 bg-surface p-4 rounded-2xl border border-border ml-2 shadow-sm"
            activeOpacity={0.7}
          >
            <PlusCircle size={24} color="#3B82F6" className="mb-2" />
            <AppText variant="body" weight="bold" className="text-text-primary">Đăng chuyến</AppText>
            <AppText variant="caption" className="text-text-secondary mt-1">Tiết kiệm chi phí đi lại</AppText>
          </TouchableOpacity>
        </View>

        {/* Recommended Rides */}
        <View className="px-6 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <AppText variant="h2" weight="bold" className="text-text-primary">Đề xuất cho bạn</AppText>
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
              <AppText variant="body" weight="bold" className="text-text-primary">Chưa có chuyến đi phù hợp</AppText>
              <AppText variant="bodySmall" className="text-text-secondary mt-1">Thử tìm kiếm với điểm đến khác nhé</AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
