import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { MapPin } from "lucide-react-native";

import { colors } from "../theme/tokens";
import { GoongMapCanvas } from "./GoongMapCanvas.web";
interface MapCoordinates {
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
  const [moving, setMoving] = useState(false);
  const pinLift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pinLift, { toValue: moving ? -8 : 0, duration: moving ? 120 : 180, useNativeDriver: true }).start();
  }, [moving, pinLift]);
  const handleMovingChange = (next: boolean) => {
    setMoving(next);
    onMovingChange?.(next);
  };
  return (
    <View
      style={styles.container}
      accessibilityLabel="Bản đồ xác nhận điểm bắt đầu"
      accessibilityHint="Kéo hoặc thu phóng bản đồ để đặt vị trí dưới ghim ở giữa màn hình"
    >
      <GoongMapCanvas center={origin} cameraTarget={cameraTarget} onCenterChange={onCenterChange} onMovingChange={handleMovingChange} zoom={16} />
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
  container: { flex: 1, minHeight: 420, overflow: "hidden" },
  pinWrap: { alignItems: "center", left: "50%", position: "absolute", top: "50%", width: 48 },
  pinBadge: { alignItems: "center", backgroundColor: colors.driverAccent, borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  pinTip: { borderLeftColor: "transparent", borderLeftWidth: 7, borderRightColor: "transparent", borderRightWidth: 7, borderTopColor: colors.driverAccent, borderTopWidth: 10, height: 0, marginTop: -2, width: 0 },
});
