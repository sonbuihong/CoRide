// Bản đồ fullscreen hiển thị route chuyến đi đang active
// Gồm: Polyline đường đi, Marker điểm đi (xanh), điểm đến (đỏ), vị trí driver (realtime)
// Marker pickup points cho các hành khách cần đón (cam = chưa đón, xanh lá đậm = đang đón)

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface PickupMarker {
  coordinate: LatLng;
  label: string;
  /** Khách đang được navigate đến (highlight) */
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
  /** Marker vị trí đón của từng hành khách — chỉ hiện khi ride ONGOING */
  pickupMarkers?: PickupMarker[];
}

export const ActiveRideMap: React.FC<ActiveRideMapProps> = ({
  originCoords,
  destinationCoords,
  routeCoords,
  driverLocation,
  originLabel = 'Điểm đi',
  destinationLabel = 'Điểm đến',
  pickupMarkers = [],
}) => {
  const mapRef = useRef<MapView>(null);
  // Flag tránh fit lại liên tục mỗi khi driver location thay đổi (mỗi 5s)
  const hasInitialDriverFit = useRef(false);

  // Fit bản đồ khi route data sẵn sàng
  useEffect(() => {
    if (routeCoords.length > 0 && mapRef.current) {
      // Gom tất cả điểm cần fit: route + pickup markers
      const allCoords = [
        ...routeCoords,
        ...pickupMarkers.map((m) => m.coordinate),
      ];

      mapRef.current.fitToCoordinates(allCoords, {
        edgePadding: { top: 80, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
      // Reset flag để fit lại khi nhận driver location lần đầu
      hasInitialDriverFit.current = false;
    }
  }, [routeCoords, pickupMarkers]);

  // Fit lại 1 lần khi nhận driver location lần đầu (marker có thể nằm ngoài viewport)
  useEffect(() => {
    if (driverLocation && routeCoords.length > 0 && !hasInitialDriverFit.current && mapRef.current) {
      hasInitialDriverFit.current = true;
      const allCoords = [
        ...routeCoords,
        driverLocation,
        ...pickupMarkers.map((m) => m.coordinate),
      ];
      mapRef.current.fitToCoordinates(allCoords, {
        edgePadding: { top: 80, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    }
  }, [driverLocation, routeCoords, pickupMarkers]);

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
        showsUserLocation
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

        {/* Marker vị trí đón hành khách */}
        {pickupMarkers.map((marker) => (
          <Marker
            key={marker.bookingId}
            coordinate={marker.coordinate}
            title={marker.label}
            // Khách đang đón: xanh đậm (highlight), khách chờ: cam
            pinColor={marker.isActive ? '#15803D' : '#F97316'}
          />
        ))}
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
