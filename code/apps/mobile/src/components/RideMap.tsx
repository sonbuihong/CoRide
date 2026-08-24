import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface RideMapProps {
  departureCoords?: { latitude: number; longitude: number };
  destinationCoords?: { latitude: number; longitude: number };
  containerStyle?: ViewStyle;
  fullScreen?: boolean;
}

export const RideMap: React.FC<RideMapProps> = ({ departureCoords, destinationCoords, containerStyle, fullScreen = false }) => {
  // Tọa độ mặc định (Hà Nội) nếu không có dữ liệu
  const defaultRegion = {
    latitude: 21.0285,
    longitude: 105.8542,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View
      className={fullScreen ? 'flex-1 w-full overflow-hidden bg-slate-200' : 'h-60 w-full rounded-2xl overflow-hidden bg-slate-200'}
      style={containerStyle}
    >
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={departureCoords ? {
          ...departureCoords,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        } : defaultRegion}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        accessibilityLabel="Bản đồ hành trình"
      >
        {departureCoords && (
          <Marker 
            coordinate={departureCoords} 
            title="Điểm đi" 
            pinColor="#0F766E"
          />
        )}
        {destinationCoords && (
          <Marker 
            coordinate={destinationCoords} 
            title="Điểm đến" 
            pinColor="#DC2626"
          />
        )}
      </MapView>
    </View>
  );
};
