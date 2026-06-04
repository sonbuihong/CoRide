import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Users, ChevronRight } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Ride } from '../services/ride.service';

interface RideCardProps {
  ride: Ride;
}

export const RideCard: React.FC<RideCardProps> = ({ ride }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/ride/${ride.id}`);
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
            <Text className="text-gray-800 font-bold flex-1" numberOfLines={1}>
              {ride.departure}
            </Text>
          </View>
          <View className="w-0.5 h-4 bg-gray-200 ml-0.75 mb-2" />
          <View className="flex-row items-center">
            <MapPin size={12} color="#EF4444" className="mr-2" />
            <Text className="text-gray-800 font-bold flex-1" numberOfLines={1}>
              {ride.destination}
            </Text>
          </View>
        </View>
        <Text className="text-blue-600 font-bold text-lg">
          {ride.price.toLocaleString('vi-VN')}đ
        </Text>
      </View>

      <View className="flex-row justify-between items-center pt-4 border-t border-gray-50">
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <Clock size={14} color="#6B7280" />
            <Text className="ml-1 text-gray-500 text-xs mr-3">
              {format(new Date(ride.departureTime), 'HH:mm, dd MMM', { locale: vi })}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Users size={14} color="#6B7280" />
            <Text className="ml-1 text-gray-500 text-xs">
              Còn {ride.availableSeats} chỗ
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <Text className="text-blue-600 text-xs font-bold mr-1">Chi tiết</Text>
          <ChevronRight size={14} color="#3B82F6" />
        </View>
      </View>
    </TouchableOpacity>
  );
};
