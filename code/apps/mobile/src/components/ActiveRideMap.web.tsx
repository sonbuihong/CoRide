import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface PickupMarker {
  coordinate: LatLng;
  label: string;
  isActive: boolean;
  bookingId: string;
}

interface ActiveRideMapProps {
  originCoords: LatLng;
  destinationCoords: LatLng;
  routeCoords: LatLng[];
  driverLocation?: LatLng | null;
  originLabel?: string;
  destinationLabel?: string;
  pickupMarkers?: PickupMarker[];
}

export const ActiveRideMap: React.FC<ActiveRideMapProps> = () => {
  return (
    <View style={styles.container}>
      <Text className="text-gray-500 font-medium text-center px-4">
        Bản đồ thời gian thực không được hỗ trợ trên trình duyệt Web.
      </Text>
      <Text className="text-gray-400 text-sm mt-1 text-center px-4">
        Vui lòng sử dụng ứng dụng di động để theo dõi chuyến đi.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
