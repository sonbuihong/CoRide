import React, { useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

const MapView = React.forwardRef<any, any>((props, ref) => {
  useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
    animateCamera: () => {},
    fitToCoordinates: () => {},
    fitToSuppliedMarkers: () => {},
    fitToElements: () => {},
    setCamera: () => {},
    getCamera: async () => ({}),
  }));

  return (
    <View style={[styles.container, props.style]}>
      {props.children}
    </View>
  );
});

export const Marker = (props: any) => <View {...props} pointerEvents="none" />;
export const Polyline = (props: any) => <View {...props} pointerEvents="none" />;
export const Callout = (props: any) => <View {...props} />;
export const Circle = (props: any) => <View {...props} pointerEvents="none" />;
export const Polygon = (props: any) => <View {...props} pointerEvents="none" />;
export const Overlay = (props: any) => <View {...props} pointerEvents="none" />;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
});

export default MapView;
