// Bản đồ fullscreen hiển thị route chuyến đi đang active
// Gồm: Polyline đường đi, Marker điểm đi (xanh), điểm đến (đỏ), vị trí driver (realtime)

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface ActiveRideMapProps {
  originCoords: LatLng;
  destinationCoords: LatLng;
  routeCoords: LatLng[];
  driverLocation?: LatLng | null;
  originLabel?: string;
  destinationLabel?: string;
}

export const ActiveRideMap: React.FC<ActiveRideMapProps> = ({
  originCoords,
  destinationCoords,
  routeCoords,
  driverLocation,
  originLabel = 'Điểm đi',
  destinationLabel = 'Điểm đến',
}) => {
  const mapRef = useRef<MapView>(null);
  // Flag tránh fit lại liên tục mỗi khi driver location thay đổi (mỗi 5s)
  const hasInitialDriverFit = useRef(false);

  // Fit bản đồ khi route data sẵn sàng
  useEffect(() => {
    if (routeCoords.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: { top: 80, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
      // Reset flag để fit lại khi nhận driver location lần đầu
      hasInitialDriverFit.current = false;
    }
  }, [routeCoords]);

  // Fit lại 1 lần khi nhận driver location lần đầu (marker có thể nằm ngoài viewport)
  useEffect(() => {
    if (driverLocation && routeCoords.length > 0 && !hasInitialDriverFit.current && mapRef.current) {
      hasInitialDriverFit.current = true;
      mapRef.current.fitToCoordinates([...routeCoords, driverLocation], {
        edgePadding: { top: 80, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    }
  }, [driverLocation, routeCoords]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          ...originCoords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Route polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#3B82F6"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Marker điểm đi — màu xanh */}
        <Marker
          coordinate={originCoords}
          title={originLabel}
          pinColor="#22C55E"
        />

        {/* Marker điểm đến — màu đỏ */}
        <Marker
          coordinate={destinationCoords}
          title={destinationLabel}
          pinColor="#EF4444"
        />

        {/* Marker vị trí driver realtime */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Tài xế"
            pinColor="#3B82F6"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
