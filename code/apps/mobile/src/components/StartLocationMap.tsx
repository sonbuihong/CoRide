import { useCallback, useRef } from "react";
import { StyleSheet, View } from "react-native";
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
}

export function StartLocationMap({
  origin,
  onCenterChange,
}: StartLocationMapProps) {
  // Keep the map uncontrolled after mounting. Recreating the initial region when
  // the selected center changes can make Google Maps snap back to the origin.
  const initialRegion = useRef<Region>({
    ...origin,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  }).current;
  const updateCenter = useCallback(
    (region: Region) =>
      onCenterChange({
        latitude: region.latitude,
        longitude: region.longitude,
      }),
    [onCenterChange],
  );

  return (
    <View
      style={styles.container}
      accessibilityHint="Kéo hoặc thu phóng bản đồ để đặt vị trí dưới ghim ở giữa màn hình"
      accessibilityLabel="Bản đồ xác nhận điểm bắt đầu"
    >
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        onRegionChangeComplete={updateCenter}
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
      <View pointerEvents="none" style={styles.pinWrap}>
        <View style={styles.pinBadge}>
          <MapPin size={27} color={colors.surface} fill={colors.driverAccent} />
        </View>
        <View style={styles.pinTip} />
      </View>
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
    transform: [{ translateX: -24 }, { translateY: -56 }],
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
