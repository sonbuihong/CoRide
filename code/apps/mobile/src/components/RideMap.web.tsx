import React from 'react';
import { View, Text } from 'react-native';

interface RideMapProps {
  departureCoords?: { latitude: number; longitude: number };
  destinationCoords?: { latitude: number; longitude: number };
}

export const RideMap: React.FC<RideMapProps> = ({ departureCoords, destinationCoords }) => {
  return (
    <View className="h-60 w-full rounded-2xl overflow-hidden bg-gray-200 items-center justify-center">
      <Text className="text-gray-500 font-medium">
        Bản đồ không được hỗ trợ trên trình duyệt Web.
      </Text>
      <Text className="text-gray-400 text-sm mt-1">
        Vui lòng sử dụng ứng dụng di động để xem bản đồ.
      </Text>
    </View>
  );
};
