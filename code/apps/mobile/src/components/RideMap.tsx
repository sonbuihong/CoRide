import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface RideMapProps {
  departureCoords?: { latitude: number; longitude: number };
  destinationCoords?: { latitude: number; longitude: number };
}

export const RideMap: React.FC<RideMapProps> = ({ departureCoords, destinationCoords }) => {
  // Tọa độ mặc định (Hà Nội) nếu không có dữ liệu
  const defaultRegion = {
    latitude: 21.0285,
    longitude: 105.8542,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View className="h-60 w-full rounded-2xl overflow-hidden bg-gray-200">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={departureCoords ? {
          ...departureCoords,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        } : defaultRegion}
      >
        {departureCoords && (
          <Marker 
            coordinate={departureCoords} 
            title="Điểm đi" 
            pinColor="blue"
          />
        )}
        {destinationCoords && (
          <Marker 
            coordinate={destinationCoords} 
            title="Điểm đến" 
            pinColor="red"
          />
        )}
      </MapView>
    </View>
  );
};
