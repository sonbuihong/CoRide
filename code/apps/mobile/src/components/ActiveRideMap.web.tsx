import React, { forwardRef, memo, useImperativeHandle, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GoongMapCanvas, PickupPoint } from './GoongMapCanvas.web';

export interface ActiveRideLatLng { latitude: number; longitude: number }
export interface ActiveRideMapHandle { recenter: (coordinate?: ActiveRideLatLng | null) => void }
export interface ActiveRideStopMarker {
  coordinate: ActiveRideLatLng;
  label: string;
  isActive: boolean;
  bookingId: string;
  kind?: 'PICKUP' | 'DROPOFF';
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
  { originCoords, destinationCoords, routeCoords = [], driverLocation, pickupMarkers = [], onUserPan,
    autoFitRoute = true, fitRouteOnce = false, fitEdgePadding },
  forwardedRef,
) {
  const [cameraTarget, setCameraTarget] = useState<ActiveRideLatLng>();
  const center = driverLocation || originCoords;
  const routeLines = useMemo(() => routeCoords.length >= 2 ? [routeCoords] : [], [routeCoords]);
  const pickupPoints = useMemo<PickupPoint[]>(() => pickupMarkers.map((marker) => ({
    coordinate: marker.coordinate,
    label: marker.label,
    isActive: marker.isActive,
    kind: marker.kind,
  })), [pickupMarkers]);

  useImperativeHandle(forwardedRef, () => ({
    recenter: (coordinate) => setCameraTarget({ ...(coordinate || driverLocation || originCoords) }),
  }), [driverLocation, originCoords]);

  return (
    <View style={styles.container}>
      <GoongMapCanvas
        center={center}
        origin={originCoords}
        destination={destinationCoords}
        driver={driverLocation}
        pickupPoints={pickupPoints}
        routeLines={routeLines}
        cameraTarget={cameraTarget}
        onCenterChange={onUserPan ? () => onUserPan() : undefined}
        zoom={14}
        autoFitRoute={autoFitRoute}
        fitRouteOnce={fitRouteOnce}
        fitEdgePadding={fitEdgePadding}
      />
    </View>
  );
});

export const ActiveRideMap = memo(MapContent);

const styles = StyleSheet.create({
  container: { backgroundColor: '#E5E7EB', flex: 1, position: 'relative', width: '100%' },
});
