import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { rideService } from '../../src/services/ride.service';
import { RideCard } from '../../src/components/RideCard';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react-native';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: rides, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['rides', searchQuery],
    queryFn: () => rideService.getRides({ destination: searchQuery }),
  });

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />
      }
    >
      <View className="p-6 bg-blue-600 pb-12">
        <Text className="text-white text-3xl font-bold">Tìm chuyến đi</Text>
        <Text className="text-blue-100 text-lg mt-1">Cùng nhau đi tới mọi nẻo đường</Text>
      </View>

      <View className="px-4 -mt-6">
        <View className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex-row items-center">
          <Search size={20} color="#9CA3AF" className="mr-3" />
          <TextInput
            className="flex-1 text-gray-800 h-10"
            placeholder="Bạn muốn đi đâu?"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity className="p-2 bg-gray-50 rounded-lg">
            <SlidersHorizontal size={18} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-800">Chuyến đi gần bạn</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text className="text-blue-600 font-medium">Làm mới</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 mt-4">Đang tải danh sách chuyến đi...</Text>
          </View>
        ) : rides && rides.length > 0 ? (
          rides.map((ride: any) => (
            <RideCard key={ride.id} ride={ride} />
          ))
        ) : (
          <View className="py-20 items-center bg-white rounded-2xl border border-dashed border-gray-200">
            <MapPin size={48} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 font-medium">Không tìm thấy chuyến đi nào</Text>
            <Text className="text-gray-400 text-sm mt-1">Hãy thử tìm kiếm với địa điểm khác</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
