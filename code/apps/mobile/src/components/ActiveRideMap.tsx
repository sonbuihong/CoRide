import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Navigation } from 'lucide-react-native';

import { colors } from '../theme/tokens';

export interface ActiveRideLatLng {
  latitude: number;
  longitude: number;
}

export interface ActiveRideStopMarker {
  coordinate: ActiveRideLatLng;
  label: string;
  isActive: boolean;
  bookingId: string;
  kind?: 'PICKUP' | 'DROPOFF';
}

export interface ActiveRideMapHandle {
  recenter: (coordinate?: ActiveRideLatLng | null) => void;
}

interface ActiveRideMapProps {
  originCoords: ActiveRideLatLng;
  destinationCoords: ActiveRideLatLng;
  routeCoords: ActiveRideLatLng[];
  driverLocation?: ActiveRideLatLng | null;
  originLabel?: string;
  destinationLabel?: string;
  pickupMarkers?: ActiveRideStopMarker[];
  onUserPan?: () => void;
}

const MapContent = forwardRef<ActiveRideMapHandle, ActiveRideMapProps>(function ActiveRideMap(
  {
    originCoords,
    destinationCoords,
    routeCoords,
    driverLocation,
    originLabel = 'Điểm đi',
    destinationLabel = 'Điểm đến',
    pickupMarkers = [],
    onUserPan,
  },
  forwardedRef,
) {
  const mapRef = useRef<MapView>(null);
  const hasInitialDriverFit = useRef(false);

  useImperativeHandle(forwardedRef, () => ({
    recenter: (coordinate) => {
      const target = coordinate || driverLocation || originCoords;
      mapRef.current?.animateCamera({ center: target, zoom: 16 }, { duration: 280 });
    },
  }), [driverLocation, originCoords]);

  useEffect(() => {
    if (!mapRef.current || routeCoords.length < 2) return;
    mapRef.current.fitToCoordinates(
      [...routeCoords, ...pickupMarkers.map((marker) => marker.coordinate)],
      { edgePadding: { top: 88, right: 42, bottom: 230, left: 42 }, animated: true },
    );
    hasInitialDriverFit.current = false;
  }, [pickupMarkers, routeCoords]);

  useEffect(() => {
    if (!driverLocation || routeCoords.length < 2 || hasInitialDriverFit.current || !mapRef.current) return;
    hasInitialDriverFit.current = true;
    mapRef.current.fitToCoordinates(
      [...routeCoords, driverLocation, ...pickupMarkers.map((marker) => marker.coordinate)],
      { edgePadding: { top: 88, right: 42, bottom: 230, left: 42 }, animated: true },
    );
  }, [driverLocation, pickupMarkers, routeCoords]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ ...originCoords, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        onPanDrag={onUserPan}
        accessibilityLabel="Bản đồ hành trình đang diễn ra"
      >
        {routeCoords.length > 1 ? (
          <Polyline coordinates={routeCoords} strokeColor={colors.mapRoute} strokeWidth={5} />
        ) : null}

        <Marker coordinate={originCoords} title={originLabel} pinColor={colors.success} />
        <Marker coordinate={destinationCoords} title={destinationLabel} pinColor={colors.danger} />

        {driverLocation ? (
          <Marker coordinate={driverLocation} title="Vị trí tài xế" anchor={{ x: 0.5, y: 0.5 }} flat>
            <View style={styles.driverMarker}>
              <Navigation size={18} color={colors.surface} fill={colors.surface} style={{ transform: [{ rotate: '-45deg' }] }} />
            </View>
          </Marker>
        ) : null}

        {pickupMarkers.map((marker) => (
          <Marker
            key={`${marker.kind || 'PICKUP'}-${marker.bookingId}`}
            coordinate={marker.coordinate}
            title={marker.label}
            pinColor={marker.kind === 'DROPOFF' ? colors.danger : marker.isActive ? colors.success : colors.mapPickup}
          />
        ))}
      </MapView>
    </View>
  );
});

export const ActiveRideMap = memo(MapContent);

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  driverMarker: {
    alignItems: 'center', backgroundColor: colors.info, borderColor: colors.surface,
    borderRadius: 18, borderWidth: 3, height: 36, justifyContent: 'center',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22,
    shadowRadius: 5, transform: [{ rotate: '45deg' }], width: 36,
  },
});
