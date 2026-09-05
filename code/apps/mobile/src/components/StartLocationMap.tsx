import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import MapView, { type Region, PROVIDER_GOOGLE } from "react-native-maps";
import { MapPin } from "lucide-react-native";

import { colors } from "../theme/tokens";

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

interface StartLocationMapProps {
  origin: MapCoordinates;
  onCenterChange: (coordinates: MapCoordinates) => void;
  cameraTarget?: MapCoordinates;
  onMovingChange?: (moving: boolean) => void;
}

export function StartLocationMap({
  origin,
  onCenterChange,
  cameraTarget,
  onMovingChange,
}: StartLocationMapProps) {
  const mapRef = useRef<MapView>(null);
  const programmaticMove = useRef(false);
  const movingRef = useRef(false);
  const pinLift = useRef(new Animated.Value(0)).current;
  const [moving, setMoving] = useState(false);
  // Keep the map uncontrolled after mounting. Recreating the initial region when
  // the selected center changes can make Google Maps snap back to the origin.
  const initialRegion = useRef<Region>({
    ...origin,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  }).current;
  const updateCenter = useCallback(
    (region: Region) => {
      if (programmaticMove.current) {
        programmaticMove.current = false;
        return;
      }
      onCenterChange({
        latitude: region.latitude,
        longitude: region.longitude,
      });
    },
    [onCenterChange],
  );

  const updateMoving = useCallback((next: boolean) => {
    if (movingRef.current === next) return;
    movingRef.current = next;
    setMoving(next);
    onMovingChange?.(next);
  }, [onMovingChange]);

  useEffect(() => {
    Animated.timing(pinLift, {
      toValue: moving ? -8 : 0,
      duration: moving ? 120 : 180,
      useNativeDriver: true,
    }).start();
  }, [moving, pinLift]);

  useEffect(() => {
    if (!cameraTarget) return;
    programmaticMove.current = true;
    updateMoving(true);
    mapRef.current?.animateToRegion({
      ...cameraTarget,
      latitudeDelta: 0.006,
      longitudeDelta: 0.006,
    }, 200);
  }, [cameraTarget, updateMoving]);

  return (
    <View
      style={styles.container}
      accessibilityHint="Kéo hoặc thu phóng bản đồ để đặt vị trí dưới ghim ở giữa màn hình"
      accessibilityLabel="Bản đồ xác nhận điểm bắt đầu"
    >
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChange={() => updateMoving(true)}
        onRegionChangeComplete={(region) => {
          updateMoving(false);
          updateCenter(region);
        }}
        followsUserLocation={false}
        moveOnMarkerPress={false}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsMyLocationButton={false}
        showsUserLocation
      />
      <Animated.View pointerEvents="none" style={[styles.pinWrap, { transform: [{ translateX: -24 }, { translateY: -56 }, { translateY: pinLift }] }]}>
        <View style={styles.pinBadge}>
          <MapPin size={27} color={colors.surface} fill={colors.driverAccent} />
        </View>
        <View style={styles.pinTip} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.border,
    flex: 1,
    minHeight: 420,
    overflow: "hidden",
    width: "100%",
  },
  pinWrap: {
    alignItems: "center",
    left: "50%",
    position: "absolute",
    top: "50%",
    width: 48,
  },
  pinBadge: {
    alignItems: "center",
    backgroundColor: colors.driverAccent,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  pinTip: {
    borderLeftColor: "transparent",
    borderLeftWidth: 7,
    borderRightColor: "transparent",
    borderRightWidth: 7,
    borderTopColor: colors.driverAccent,
    borderTopWidth: 10,
    height: 0,
    marginTop: -2,
    width: 0,
  },
});
