import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { rideService } from '../../src/services/ride.service';
import { bookingService } from '../../src/services/booking.service';
import { RideMap } from '../../src/components/RideMap';
import { MapPin, Clock, Users, Star, ShieldCheck, MessageCircle } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [seats, setSeats] = useState(1);

  const { data: ride, isLoading } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => rideService.getRideById(id as string),
    enabled: !!id,
  });

  const bookingMutation = useMutation({
    mutationFn: () => bookingService.createBooking(id as string, seats),
    onSuccess: () => {
      Alert.alert('Thành công', 'Yêu cầu đặt chỗ của bạn đã được gửi tới tài xế.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/my-rides') }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thực hiện đặt chỗ');
    }
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-gray-500 text-lg">Không tìm thấy thông tin chuyến đi</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-blue-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <RideMap 
          departureCoords={ride.departureCoords} 
          destinationCoords={ride.destinationCoords} 
        />

        <View className="p-6">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">{ride.destination}</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-gray-500">Từ: </Text>
                <Text className="text-gray-700 font-medium">{ride.departure}</Text>
              </View>
            </View>
            <Text className="text-2xl font-bold text-blue-600">
              {ride.price.toLocaleString('vi-VN')}đ
            </Text>
          </View>

          <View className="flex-row bg-gray-50 p-4 rounded-2xl mb-6 justify-between">
            <View className="items-center flex-1 border-r border-gray-200">
              <Clock size={20} color="#3B82F6" />
              <Text className="text-gray-400 text-xs mt-1">Giờ đi</Text>
              <Text className="text-gray-800 font-bold mt-0.5">
                {format(new Date(ride.departureTime), 'HH:mm')}
              </Text>
            </View>
            <View className="items-center flex-1 border-r border-gray-200">
              <Users size={20} color="#3B82F6" />
              <Text className="text-gray-400 text-xs mt-1">Ghế trống</Text>
              <Text className="text-gray-800 font-bold mt-0.5">{ride.availableSeats}/{ride.totalSeats}</Text>
            </View>
            <View className="items-center flex-1">
              <ShieldCheck size={20} color="#3B82F6" />
              <Text className="text-gray-400 text-xs mt-1">Bảo hiểm</Text>
              <Text className="text-gray-800 font-bold mt-0.5">Có</Text>
            </View>
          </View>

          <Text className="text-lg font-bold text-gray-800 mb-4">Tài xế</Text>
          <View className="flex-row items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-sm mb-6">
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
              {ride.driver.avatar ? (
                <Image source={{ uri: ride.driver.avatar }} className="w-full h-full rounded-full" />
              ) : (
                <Text className="text-blue-600 font-bold">{ride.driver.firstName.charAt(0)}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-bold text-lg">{ride.driver.firstName} {ride.driver.lastName}</Text>
              <View className="flex-row items-center">
                <Star size={14} color="#EAB308" fill="#EAB308" />
                <Text className="ml-1 text-yellow-700 font-bold">{ride.driver.rating || 'N/A'}</Text>
              </View>
            </View>
            <TouchableOpacity className="p-3 bg-blue-50 rounded-full">
              <MessageCircle size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View className="p-6 border-t border-gray-100 bg-white">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-gray-800 font-bold">Số lượng ghế</Text>
            <Text className="text-gray-400 text-xs">Mỗi người tối đa {ride.availableSeats} ghế</Text>
          </View>
          <View className="flex-row items-center bg-gray-100 rounded-xl p-1">
            <TouchableOpacity 
              onPress={() => setSeats(Math.max(1, seats - 1))}
              className="w-10 h-10 items-center justify-center"
            >
              <Text className="text-xl font-bold">-</Text>
            </TouchableOpacity>
            <Text className="px-4 font-bold text-lg">{seats}</Text>
            <TouchableOpacity 
              onPress={() => setSeats(Math.min(ride.availableSeats, seats + 1))}
              className="w-10 h-10 items-center justify-center"
            >
              <Text className="text-xl font-bold">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          className={`p-4 rounded-2xl items-center shadow-md ${bookingMutation.isPending ? 'bg-blue-400' : 'bg-blue-600'}`}
          onPress={() => bookingMutation.mutate()}
          disabled={bookingMutation.isPending || ride.availableSeats === 0}
        >
          <Text className="text-white font-bold text-lg">
            {bookingMutation.isPending ? 'Đang xử lý...' : ride.availableSeats === 0 ? 'Hết chỗ' : 'Đặt ngay'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
