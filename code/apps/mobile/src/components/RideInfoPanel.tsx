// Bottom panel hiển thị thông tin chuyến đi đang active
// Hiển thị: điểm đi/đến, info driver/passenger (tùy role), giá, số ghế, nút gọi

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { MapPin, Phone, Clock, Users, ChevronUp, ChevronDown, Navigation } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface RideInfoPanelProps {
  ride: any;
  booking: any;
  userRole: 'DRIVER' | 'PASSENGER';
  // Thông tin route
  distance?: number; // meters
  duration?: number; // seconds
}

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins} phút`;
  }
  return `${minutes} phút`;
};

export const RideInfoPanel: React.FC<RideInfoPanelProps> = ({
  ride,
  booking,
  userRole,
  distance,
  duration,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Xác định thông tin người đối tác (driver xem passenger, passenger xem driver)
  const partnerInfo = userRole === 'PASSENGER'
    ? ride.driver
    : booking?.passenger || (ride.bookings?.[0]?.passenger);

  const partnerLabel = userRole === 'PASSENGER' ? 'Tài xế' : 'Hành khách';

  const handleCall = () => {
    if (partnerInfo?.phone) {
      Linking.openURL(`tel:${partnerInfo.phone}`);
    }
  };

  const rideStatusLabel = () => {
    switch (ride.status) {
      case 'SCHEDULED': return 'Đang chờ khởi hành';
      case 'ONGOING': return 'Đang di chuyển';
      case 'COMPLETED': return 'Đã hoàn thành';
      default: return ride.status;
    }
  };

  const rideStatusColor = () => {
    switch (ride.status) {
      case 'SCHEDULED': return 'text-yellow-600';
      case 'ONGOING': return 'text-blue-600';
      case 'COMPLETED': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <View className="bg-white rounded-t-3xl shadow-lg border-t border-gray-100">
      {/* Handle kéo lên/xuống */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="items-center pt-3 pb-2"
      >
        <View className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
        {expanded ? (
          <ChevronDown size={18} color="#9CA3AF" />
        ) : (
          <ChevronUp size={18} color="#9CA3AF" />
        )}
      </TouchableOpacity>

      {/* Compact info — luôn hiển thị */}
      <View className="px-5 pb-4">
        {/* Trạng thái + thông tin route */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Navigation size={16} color="#3B82F6" />
            <Text className={`ml-2 font-bold ${rideStatusColor()}`}>
              {rideStatusLabel()}
            </Text>
          </View>
          {distance !== undefined && duration !== undefined && (
            <View className="flex-row items-center">
              <Text className="text-gray-500 text-sm">
                {formatDistance(distance)} - {formatDuration(duration)}
              </Text>
            </View>
          )}
        </View>

        {/* Điểm đi → Điểm đến */}
        <View className="bg-gray-50 p-4 rounded-2xl mb-3">
          <View className="flex-row items-start mb-3">
            <View className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3" />
            <View className="flex-1">
              <Text className="text-xs text-gray-400">Điểm đi</Text>
              <Text className="text-gray-800 font-medium" numberOfLines={2}>
                {ride.origin}
              </Text>
            </View>
          </View>

          {/* Đường nối dọc */}
          <View className="ml-1.5 border-l border-dashed border-gray-300 h-3 mb-3" />

          <View className="flex-row items-start">
            <View className="w-3 h-3 bg-red-500 rounded-full mt-1 mr-3" />
            <View className="flex-1">
              <Text className="text-xs text-gray-400">Điểm đến</Text>
              <Text className="text-gray-800 font-medium" numberOfLines={2}>
                {ride.destination}
              </Text>
            </View>
          </View>
        </View>

        {/* Thông tin đối tác — compact */}
        {partnerInfo && (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">
                  {partnerInfo.firstName?.charAt(0) || '?'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-bold">
                  {partnerInfo.firstName} {partnerInfo.lastName}
                </Text>
                <Text className="text-gray-400 text-xs">{partnerLabel}</Text>
              </View>
            </View>

            {partnerInfo.phone && (
              <TouchableOpacity
                onPress={handleCall}
                className="bg-green-50 p-3 rounded-full"
              >
                <Phone size={20} color="#22C55E" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Expanded info — chi tiết thêm */}
      {expanded && (
        <ScrollView className="px-5 pb-6 max-h-60">
          <View className="border-t border-gray-100 pt-4">
            {/* Thời gian */}
            <View className="flex-row items-center mb-3">
              <Clock size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-500 text-sm">Giờ khởi hành:</Text>
              <Text className="ml-2 text-gray-800 font-medium text-sm">
                {ride.departureTime
                  ? format(new Date(ride.departureTime), 'HH:mm, dd/MM/yyyy', { locale: vi })
                  : 'Chưa xác định'}
              </Text>
            </View>

            {/* Số ghế */}
            <View className="flex-row items-center mb-3">
              <Users size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-500 text-sm">
                {userRole === 'PASSENGER' ? 'Ghế đã đặt:' : 'Ghế trống:'}
              </Text>
              <Text className="ml-2 text-gray-800 font-medium text-sm">
                {userRole === 'PASSENGER'
                  ? `${booking?.seats || 0} ghế`
                  : `${ride.availableSeats} ghế`
                }
              </Text>
            </View>

            {/* Giá */}
            {booking?.totalPrice && (
              <View className="flex-row items-center mb-3">
                <MapPin size={16} color="#6B7280" />
                <Text className="ml-2 text-gray-500 text-sm">Tổng tiền:</Text>
                <Text className="ml-2 text-blue-600 font-bold text-sm">
                  {booking.totalPrice.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}

            {/* Giá mỗi ghế — cho driver */}
            {userRole === 'DRIVER' && ride.pricePerSeat && (
              <View className="flex-row items-center mb-3">
                <MapPin size={16} color="#6B7280" />
                <Text className="ml-2 text-gray-500 text-sm">Giá/ghế:</Text>
                <Text className="ml-2 text-blue-600 font-bold text-sm">
                  {ride.pricePerSeat.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}

            {/* Danh sách hành khách — cho driver */}
            {userRole === 'DRIVER' && ride.bookings && ride.bookings.length > 0 && (
              <View className="mt-2">
                <Text className="text-gray-800 font-bold mb-2">Hành khách ({ride.bookings.length})</Text>
                {ride.bookings.map((b: any) => (
                  <View key={b.id} className="flex-row items-center py-2 border-b border-gray-50">
                    <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                      <Text className="text-blue-600 font-bold text-xs">
                        {b.passenger?.firstName?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 text-sm font-medium">
                        {b.passenger?.firstName} {b.passenger?.lastName}
                      </Text>
                      <Text className="text-gray-400 text-xs">{b.seats} ghế</Text>
                    </View>
                    {b.passenger?.phone && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${b.passenger.phone}`)}
                        className="p-2"
                      >
                        <Phone size={16} color="#22C55E" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};
