import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Navigation } from 'lucide-react-native';

import { colors } from '../theme/tokens';

const DEFAULT_FIT_EDGE_PADDING = { top: 88, right: 42, bottom: 230, left: 42 };

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

const EMPTY_STOP_MARKERS: ActiveRideStopMarker[] = [];

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
  fitEdgePadding?: { top: number; right: number; bottom: number; left: number };
  autoFitRoute?: boolean;
  fitRouteOnce?: boolean;
  focusZoom?: number;
  autoFocusDriver?: boolean;
  userLocation?: ActiveRideLatLng | null;
}

const MapContent = forwardRef<ActiveRideMapHandle, ActiveRideMapProps>(function ActiveRideMap(
  {
    originCoords,
    destinationCoords,
    routeCoords,
    driverLocation,
    originLabel = 'Điểm đi',
    destinationLabel = 'Điểm đến',
    pickupMarkers = EMPTY_STOP_MARKERS,
    onUserPan,
    fitEdgePadding = DEFAULT_FIT_EDGE_PADDING,
    autoFitRoute = true,
    fitRouteOnce = false,
    focusZoom = 16,
    autoFocusDriver = true,
    userLocation,
  },
  forwardedRef,
) {
  const mapRef = useRef<MapView>(null);
  const hasInitialDriverFit = useRef(false);
  const hasRouteFit = useRef(false);
  const userInteracted = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const initialRegion = useRef({
    ...(driverLocation || originCoords),
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  }).current;

  useImperativeHandle(forwardedRef, () => ({
    recenter: (coordinate) => {
      userInteracted.current = true;
      const target = coordinate || driverLocation || originCoords;
      mapRef.current?.animateCamera({ center: target }, { duration: 280 });
    },
  }), [driverLocation, focusZoom, originCoords]);

  useEffect(() => {
    if (!mapReady || !layoutReady || !autoFitRoute || !mapRef.current || routeCoords.length < 2) return;
    if (fitRouteOnce && (hasRouteFit.current || userInteracted.current)) return;
    mapRef.current.fitToCoordinates(
      [...routeCoords, ...pickupMarkers.map((marker) => marker.coordinate)],
      { edgePadding: fitEdgePadding, animated: true },
    );
    hasRouteFit.current = true;
    if (!fitRouteOnce) hasInitialDriverFit.current = false;
  }, [autoFitRoute, fitEdgePadding, fitRouteOnce, layoutReady, mapReady, pickupMarkers, routeCoords]);

  useEffect(() => {
    if (!mapReady || !layoutReady || userInteracted.current || !autoFocusDriver || !driverLocation || hasInitialDriverFit.current || !mapRef.current) return;
    if (!autoFitRoute) {
      hasInitialDriverFit.current = true;
      mapRef.current.animateCamera({ center: driverLocation, zoom: focusZoom }, { duration: 280 });
      return;
    }
    if (routeCoords.length < 2) return;
    hasInitialDriverFit.current = true;
    mapRef.current.fitToCoordinates(
      [...routeCoords, driverLocation, ...pickupMarkers.map((marker) => marker.coordinate)],
      { edgePadding: fitEdgePadding, animated: true },
    );
  }, [autoFitRoute, autoFocusDriver, driverLocation, fitEdgePadding, focusZoom, layoutReady, mapReady, pickupMarkers, routeCoords]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
        onLayout={({ nativeEvent }) => setLayoutReady(nativeEvent.layout.width > 0 && nativeEvent.layout.height > 0)}
        showsUserLocation={false}
        showsMyLocationButton={false}
        scrollEnabled
        zoomEnabled
        rotateEnabled
        pitchEnabled
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        onTouchStart={() => {
          userInteracted.current = true;
          onUserPan?.();
        }}
        onPanDrag={() => {
          userInteracted.current = true;
          onUserPan?.();
        }}
        onRegionChangeComplete={(_, details) => {
          if (details.isGesture) {
            userInteracted.current = true;
            onUserPan?.();
          }
        }}
        accessibilityLabel="Bản đồ hành trình đang diễn ra"
      >
        {routeCoords.length > 1 ? (
          <Polyline coordinates={routeCoords} strokeColor={colors.mapRoute} strokeWidth={6} zIndex={5} />
        ) : null}

        <Marker coordinate={originCoords} title={originLabel} pinColor={colors.success} />
        <Marker coordinate={destinationCoords} title={destinationLabel} pinColor={colors.danger} />

        {userLocation ? <Marker coordinate={userLocation} title="Vị trí của bạn" pinColor={colors.primary} /> : null}

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
