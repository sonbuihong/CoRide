// Bottom panel hiển thị thông tin chuyến đi đang active
// Hiển thị: điểm đi/đến, info driver/passenger (tùy role), giá, số ghế, nút gọi
// Driver ONGOING: hiển thị thông tin khách đang đón + danh sách pickup status

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, ScrollView, LayoutAnimation } from 'react-native';
import { MapPin, Phone, Clock, Users, Navigation, Send, User, Wallet } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PickupInfo {
  booking: {
    id: string;
    isPickedUp: boolean;
    pickupAddress?: string | null;
    passenger?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
  };
  distanceKm: number;
}

interface RideInfoPanelProps {
  ride: any;
  booking: any;
  userRole: 'DRIVER' | 'PASSENGER';
  // Thông tin route
  distance?: number; // meters
  duration?: number; // seconds
  // Pickup navigation info — chỉ dùng cho driver khi ONGOING
  currentTargetType?: 'IDLE' | 'PICKUP' | 'DESTINATION';
  currentBooking?: any | null;
  pendingPickups?: PickupInfo[];
  pickedUpBookings?: any[];
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
  currentTargetType,
  currentBooking,
  pendingPickups = [],
  pickedUpBookings = [],
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
    <View className="pt-2">
      {/* Handle kéo lên/xuống */}
      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded(!expanded);
        }}
        className="items-center pt-3 pb-4"
        activeOpacity={0.7}
      >
        <View className="w-12 h-1.5 bg-gray-200 rounded-full" />
      </TouchableOpacity>

      {/* Compact info — luôn hiển thị */}
      <View className="px-5 pb-2">
        {/* Trạng thái + thông tin route */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Send 
              size={20} 
              color={ride.status === 'SCHEDULED' ? '#D97706' : '#2563EB'} 
              style={{ transform: [{ rotate: '45deg' }, { translateY: -2 }, { translateX: -2 }] }} 
            />
            <Text className={`ml-2.5 font-bold text-[17px] ${rideStatusColor()}`}>
              {rideStatusLabel()}
            </Text>
          </View>
          {distance !== undefined && duration !== undefined && (
            <Text className="text-gray-500 font-medium text-[15px]">
              {formatDuration(duration)} • {formatDistance(distance)}
            </Text>
          )}
        </View>

        {/* Thẻ gộp Điểm đi - Điểm đến - Thống kê */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-3" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 }}>
          {/* Điểm đi */}
          <View className="flex-row items-stretch">
            <View className="w-5 items-center mr-3">
              <View className="w-3.5 h-3.5 bg-green-500 rounded-full mt-0.5" />
              <View className="flex-1 w-[2px] border-l-[2px] border-dashed border-gray-300 my-1.5" />
            </View>
            <View className="flex-1 pb-4">
              <Text className="text-[13px] text-gray-500 font-medium mb-1">Điểm đi</Text>
              <Text className="text-gray-800 font-bold text-[15px]" numberOfLines={2}>
                {ride.origin}
              </Text>
            </View>
          </View>

          {/* Điểm đến */}
          <View className="flex-row items-stretch mb-4">
            <View className="w-5 items-center mr-3">
              <View className="w-3.5 h-3.5 bg-red-500 rounded-full mt-0.5" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] text-gray-500 font-medium mb-1">Điểm đến</Text>
              <Text className="text-gray-800 font-bold text-[15px]" numberOfLines={2}>
                {ride.destination}
              </Text>
            </View>
          </View>

          {/* Đường kẻ ngang */}
          <View className="h-[1px] bg-gray-100 w-full mb-4" />

          {/* 3 Cột thống kê */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-2">
                <User size={16} color="#3B82F6" strokeWidth={2.5} />
              </View>
              <Text className="text-[13px] text-gray-700 font-medium">
                {userRole === 'PASSENGER' ? `${booking?.seats || 0}` : `${ride.availableSeats}`} khách
              </Text>
            </View>
            <View className="flex-row items-center flex-1 justify-center">
              <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-2">
                <MapPin size={16} color="#3B82F6" strokeWidth={2.5} />
              </View>
              <Text className="text-[13px] text-gray-700 font-medium">
                {distance ? formatDistance(distance) : '0 km'}
              </Text>
            </View>
            <View className="flex-row items-center flex-1 justify-end">
              <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-2">
                <Wallet size={16} color="#3B82F6" strokeWidth={2.5} />
              </View>
              <Text className="text-[12px] text-gray-700 font-medium leading-[16px]">
                Thanh toán{'\n'}tiền mặt
              </Text>
            </View>
          </View>
        </View>

        {/* Section đón khách — chỉ hiện cho driver khi đang ONGOING và có khách cần đón */}
        {userRole === 'DRIVER' && currentTargetType === 'PICKUP' && currentBooking && (
          <View className="bg-orange-50 p-4 rounded-2xl mb-1 border border-orange-200">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-orange-700 font-bold text-sm">Đang đi đón khách</Text>
              {(pendingPickups.length + pickedUpBookings.length) > 1 && (
                <View className="bg-orange-100 px-2 py-0.5 rounded-full">
                  <Text className="text-orange-700 text-xs font-bold">
                    Khách {pickedUpBookings.length + 1}/{pickedUpBookings.length + pendingPickups.length}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                <Text className="text-orange-600 font-bold text-xs">
                  {currentBooking.passenger?.firstName?.charAt(0) || '?'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-bold text-sm">
                  {currentBooking.passenger?.firstName} {currentBooking.passenger?.lastName}
                </Text>
                {currentBooking.pickupAddress && (
                  <Text className="text-gray-500 text-xs" numberOfLines={1}>
                    {currentBooking.pickupAddress}
                  </Text>
                )}
              </View>
              {currentBooking.passenger?.phone && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${currentBooking.passenger.phone}`)}
                  className="bg-green-50 p-2 rounded-full"
                >
                  <Phone size={16} color="#22C55E" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Badge đã đón hết khách — hiện khi đang đi đến điểm đến */}
        {userRole === 'DRIVER' && currentTargetType === 'DESTINATION' && pickedUpBookings.length > 0 && (
          <View className="bg-green-50 p-3 rounded-2xl mb-1 border border-green-200">
            <Text className="text-green-700 font-medium text-sm text-center">
              Đã đón {pickedUpBookings.length} hành khách - Đang đi đến điểm đến
            </Text>
          </View>
        )}
      </View>

      {/* Expanded info — chi tiết thêm */}
      {expanded && (
        <ScrollView className="px-5 pb-6 max-h-60" showsVerticalScrollIndicator={false}>
          {/* Thông tin đối tác — Di chuyển từ compact sang đây */}
          {partnerInfo && (
            <View className="flex-row items-center justify-between mb-5 bg-blue-50/50 p-3 rounded-2xl border border-blue-50">
              <View className="flex-row items-center flex-1">
                <View className="w-11 h-11 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-blue-600 font-bold text-lg">
                    {partnerInfo.firstName?.charAt(0) || '?'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-bold text-base">
                    {partnerInfo.firstName} {partnerInfo.lastName}
                  </Text>
                  <Text className="text-gray-500 text-sm font-medium">{partnerLabel}</Text>
                </View>
              </View>

              {partnerInfo.phone && (
                <TouchableOpacity
                  onPress={handleCall}
                  className="bg-green-100 p-3 rounded-full"
                >
                  <Phone size={20} color="#16A34A" />
                </TouchableOpacity>
              )}
            </View>
          )}

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

            {/* Danh sách hành khách — cho driver (với trạng thái đón) */}
            {userRole === 'DRIVER' && ride.bookings && ride.bookings.length > 0 && (
              <View className="mt-2">
                <Text className="text-gray-800 font-bold mb-2">Hành khách ({ride.bookings.length})</Text>
                {ride.bookings.map((b: any) => {
                  // Xác định trạng thái đón của khách
                  const isPickedUp = b.isPickedUp === true;
                  const isCompleted = b.status === 'COMPLETED';
                  const statusLabel = isCompleted
                    ? 'Đã trả'
                    : isPickedUp
                      ? 'Đã đón'
                      : b.status === 'CONFIRMED'
                        ? 'Chưa đón'
                        : b.status;
                  const statusColor = isCompleted
                    ? 'text-gray-400'
                    : isPickedUp
                      ? 'text-green-600'
                      : 'text-orange-600';

                  return (
                    <View key={b.id} className="flex-row items-center py-2 border-b border-gray-50">
                      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                        isPickedUp ? 'bg-green-50' : 'bg-blue-50'
                      }`}>
                        <Text className={`font-bold text-xs ${
                          isPickedUp ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {b.passenger?.firstName?.charAt(0) || '?'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 text-sm font-medium">
                          {b.passenger?.firstName} {b.passenger?.lastName}
                        </Text>
                        <Text className={`text-xs ${statusColor}`}>
                          {b.seats} ghế - {statusLabel}
                        </Text>
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
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};
