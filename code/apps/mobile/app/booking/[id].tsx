import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../../../src/services/booking.service';
import { paymentService } from '../../../src/services/payment.service';
import { authService } from '../../../src/services/auth.service';
import { Check, X, User, Star, Phone, CreditCard } from 'lucide-react-native';

export default function BookingManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => authService.getCurrentUser(),
  });

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBookingById(id as string),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: 'CONFIRMED' | 'REJECTED') => 
      bookingService.updateBookingStatus(id as string, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      Alert.alert(
        'Thành công', 
        status === 'CONFIRMED' ? 'Đã chấp nhận yêu cầu.' : 'Đã từ chối yêu cầu.',
      );
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  });

  const createPaymentMutation = useMutation({
    mutationFn: () => paymentService.createPayment(id as string),
    onSuccess: (data) => {
      if (data.order_url) {
        Linking.openURL(data.order_url);
      } else {
        Alert.alert('Lỗi', 'Không nhận được URL thanh toán từ hệ thống.');
      }
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán.');
    }
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!booking) return null;

  const isDriver = currentUser?.id === booking.ride.driverId;
  const isPassenger = currentUser?.id === booking.passengerId;
  const displayUser = isDriver ? booking.passenger : booking.ride.driver;
  const title = isDriver ? 'Yêu cầu đặt chỗ' : 'Chi tiết đặt chỗ';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600';
      case 'CONFIRMED': return 'text-green-600';
      case 'CANCELLED': return 'text-red-600';
      case 'REJECTED': return 'text-gray-500';
      default: return 'text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Đang chờ';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'CANCELLED': return 'Đã hủy';
      case 'REJECTED': return 'Đã từ chối';
      default: return status;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-bold text-gray-800 mb-6">{title}</Text>

        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-center mb-6">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4">
              {displayUser.avatarUrl ? (
                <Image source={{ uri: displayUser.avatarUrl }} className="w-full h-full rounded-full" />
              ) : (
                <User size={32} color="#3B82F6" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-800">
                {displayUser.firstName} {displayUser.lastName}
              </Text>
              <View className="flex-row items-center mt-1">
                <Star size={14} color="#EAB308" fill="#EAB308" />
                <Text className="ml-1 text-yellow-700 font-bold">{displayUser.rating || '5.0'}</Text>
                <Text className="ml-2 text-gray-400 text-xs">({displayUser.ratingCount || 0} đánh giá)</Text>
              </View>
            </View>
            <View>
              <Text className={`font-bold ${getStatusColor(booking.status)}`}>
                {getStatusText(booking.status)}
              </Text>
            </View>
          </View>

          <View className="space-y-4">
            <View className="flex-row justify-between py-3 border-b border-gray-50">
              <Text className="text-gray-500">Số ghế yêu cầu</Text>
              <Text className="text-gray-800 font-bold text-lg">{booking.seats} ghế</Text>
            </View>
            <View className="flex-row justify-between py-3 border-b border-gray-50">
              <Text className="text-gray-500">Tổng thanh toán</Text>
              <Text className="text-blue-600 font-bold text-lg">
                {(booking.totalPrice || 0).toLocaleString('vi-VN')}đ
              </Text>
            </View>
            <View className="flex-row justify-between py-3 border-b border-gray-50">
              <Text className="text-gray-500">Trạng thái thanh toán</Text>
              <Text className={`font-bold ${booking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-500'}`}>
                {booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Text>
            </View>
            {displayUser.phone && (
              <View className="flex-row justify-between py-3">
                <Text className="text-gray-500">Số điện thoại</Text>
                <View className="flex-row items-center">
                  <Phone size={14} color="#6B7280" className="mr-1" />
                  <Text className="text-gray-800 font-medium">{displayUser.phone}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <Text className="text-gray-400 text-sm uppercase font-bold mb-4 ml-2">Thông tin chuyến đi</Text>
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-10">
          <Text className="text-gray-800 font-bold">{booking.ride.destination}</Text>
          <Text className="text-gray-500 text-xs mt-1">Từ: {booking.ride.origin}</Text>
        </View>
      </ScrollView>

      {isDriver && booking.status === 'PENDING' && (
        <View className="p-6 bg-white border-t border-gray-100 flex-row space-x-4">
          <TouchableOpacity 
            className="flex-1 bg-gray-100 p-4 rounded-2xl items-center flex-row justify-center"
            onPress={() => updateStatusMutation.mutate('REJECTED')}
            disabled={updateStatusMutation.isPending}
          >
            <X size={20} color="#EF4444" className="mr-2" />
            <Text className="text-red-600 font-bold text-lg">Từ chối</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 bg-blue-600 p-4 rounded-2xl items-center flex-row justify-center"
            onPress={() => updateStatusMutation.mutate('CONFIRMED')}
            disabled={updateStatusMutation.isPending}
          >
            <Check size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">Chấp nhận</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPassenger && booking.status === 'CONFIRMED' && booking.paymentStatus === 'UNPAID' && (
        <View className="p-6 bg-white border-t border-gray-100">
          <TouchableOpacity 
            className="bg-blue-600 p-4 rounded-2xl items-center flex-row justify-center"
            onPress={() => createPaymentMutation.mutate()}
            disabled={createPaymentMutation.isPending}
          >
            <CreditCard size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">Thanh toán bằng ZaloPay</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
