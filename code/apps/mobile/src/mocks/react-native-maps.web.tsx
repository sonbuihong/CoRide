import React, { useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GoongMapCanvas, type PickupPoint } from '../components/GoongMapCanvas.web';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

export class AnimatedRegion {
  latitude: any;
  longitude: any;
  latitudeDelta: any;
  longitudeDelta: any;
  constructor(opts?: any) {
    this.latitude = opts?.latitude ?? 0;
    this.longitude = opts?.longitude ?? 0;
    this.latitudeDelta = opts?.latitudeDelta ?? 0;
    this.longitudeDelta = opts?.longitudeDelta ?? 0;
  }
  setValue() {}
  setOffset() {}
  flattenOffset() {}
  addListener() { return ''; }
  removeListener() {}
  stopAnimation() {}
  resetAnimation() {}
  timing() { return { start: () => {} }; }
  spring() { return { start: () => {} }; }
}

type MapMarkerProps = {
  coordinate?: LatLng;
  title?: string;
  pinColor?: string;
};

type MapPolylineProps = {
  coordinates?: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  zIndex?: number;
};

export const Marker = (_props: MapMarkerProps) => null;
export const Polyline = (_props: MapPolylineProps) => null;
export const Callout = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const Circle = () => null;
export const Polygon = () => null;
export const Overlay = () => null;

const isCoordinate = (value: unknown): value is LatLng => {
  const coordinate = value as LatLng | undefined;
  return Boolean(coordinate && Number.isFinite(coordinate.latitude) && Number.isFinite(coordinate.longitude));
};

const MapView = React.forwardRef<any, any>((props, ref) => {
  const [cameraTarget, setCameraTarget] = useState<LatLng>();
  const { markers, routeLines } = useMemo(() => {
    const nextMarkers: MapMarkerProps[] = [];
    const nextRouteLines: LatLng[][] = [];

    const visit = (children: React.ReactNode) => {
      React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;
        if (child.type === Marker) {
          const marker = child.props as MapMarkerProps;
          if (isCoordinate(marker.coordinate)) nextMarkers.push(marker);
          return;
        }
        if (child.type === Polyline) {
          const line = (child.props as MapPolylineProps).coordinates?.filter(isCoordinate) ?? [];
          if (line.length > 1) nextRouteLines.push(line);
          return;
        }
        if (child.type === React.Fragment) visit((child.props as { children?: React.ReactNode }).children);
      });
    };

    visit(props.children);
    return { markers: nextMarkers, routeLines: nextRouteLines };
  }, [props.children]);

  const originMarker = markers.find((marker) => /điểm (đi|đầu)|xuất phát/i.test(marker.title ?? '')) ?? markers[0];
  const destinationMarker = markers.find((marker) => /điểm (đến|cuối)|đích/i.test(marker.title ?? '')) ?? markers[1];
  const pickupPoints = useMemo<PickupPoint[]>(() => markers
    .filter((marker) => marker !== originMarker && marker !== destinationMarker && marker.coordinate)
    .map((marker) => ({
      coordinate: marker.coordinate!,
      label: marker.title,
      kind: /xuống|dropoff|đến/i.test(marker.title ?? '') ? 'DROPOFF' : 'PICKUP',
    })), [destinationMarker, markers, originMarker]);

  const initialCenter = useMemo<LatLng>(() => {
    if (isCoordinate(originMarker?.coordinate)) return originMarker.coordinate;
    if (isCoordinate(props.initialRegion)) {
      return { latitude: props.initialRegion.latitude, longitude: props.initialRegion.longitude };
    }
    return { latitude: 21.0285, longitude: 105.8542 };
  }, [originMarker, props.initialRegion]);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region?: Region) => {
      if (isCoordinate(region)) setCameraTarget({ latitude: region.latitude, longitude: region.longitude });
    },
    animateCamera: (camera?: { center?: LatLng }) => {
      if (isCoordinate(camera?.center)) setCameraTarget(camera.center);
    },
    fitToCoordinates: (coordinates?: LatLng[]) => {
      const valid = coordinates?.filter(isCoordinate) ?? [];
      if (valid.length === 1) setCameraTarget(valid[0]);
    },
    fitToSuppliedMarkers: () => {},
    fitToElements: () => {},
    setCamera: (camera?: { center?: LatLng }) => {
      if (isCoordinate(camera?.center)) setCameraTarget(camera.center);
    },
    getCamera: async () => ({}),
  }), []);

  useEffect(() => {
    const timer = window.setTimeout(() => props.onMapReady?.(), 0);
    return () => window.clearTimeout(timer);
  }, [props.onMapReady]);

  return (
    <View style={[styles.container, props.style]}>
      <GoongMapCanvas
        center={initialCenter}
        origin={originMarker?.coordinate}
        destination={destinationMarker?.coordinate}
        pickupPoints={pickupPoints}
        routeLines={routeLines}
        selectedRouteIndex={Math.max(0, routeLines.length - 1)}
        cameraTarget={cameraTarget}
        zoom={13}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    position: 'relative',
  },
});

export default MapView;
