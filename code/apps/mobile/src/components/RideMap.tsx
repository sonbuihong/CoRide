import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { decodePolyline, getDirections } from '../services/direction.service';

interface RideMapProps {
  departureCoords?: { latitude: number; longitude: number };
  destinationCoords?: { latitude: number; longitude: number };
  encodedPolyline?: string | null;
  containerStyle?: ViewStyle;
  fullScreen?: boolean;
}

export const RideMap: React.FC<RideMapProps> = ({ departureCoords, destinationCoords, encodedPolyline, containerStyle, fullScreen = false }) => {
  const [fetchedRoute, setFetchedRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const storedRoute = useMemo(
    () => encodedPolyline ? decodePolyline(encodedPolyline) : [],
    [encodedPolyline],
  );
  const departureLat = departureCoords?.latitude;
  const departureLng = departureCoords?.longitude;
  const destinationLat = destinationCoords?.latitude;
  const destinationLng = destinationCoords?.longitude;
  useEffect(() => {
    if (storedRoute.length > 1) return;
    if (departureLat == null || departureLng == null || destinationLat == null || destinationLng == null) return;
    let active = true;
    getDirections(
      { latitude: departureLat, longitude: departureLng },
      { latitude: destinationLat, longitude: destinationLng },
    ).then((result) => {
      // Keep the last successful route when Goong is temporarily unavailable.
      if (active && result?.polylineCoords?.length) setFetchedRoute(result.polylineCoords);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [departureLat, departureLng, destinationLat, destinationLng, storedRoute.length]);
  const route = storedRoute.length > 1 ? storedRoute : fetchedRoute;
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
        {route.length > 1 && <Polyline coordinates={route} strokeColor="#0071E3" strokeWidth={5} />}
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
