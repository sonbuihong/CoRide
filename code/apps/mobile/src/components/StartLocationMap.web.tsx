import { StyleSheet, View } from "react-native";
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
}

export function StartLocationMap({
  origin,
  onCenterChange,
}: StartLocationMapProps) {
  return (
    <View
      style={styles.container}
      accessibilityLabel="Bản đồ xác nhận điểm bắt đầu"
      accessibilityHint="Kéo hoặc thu phóng bản đồ để đặt vị trí dưới ghim ở giữa màn hình"
    >
      <GoongMapCanvas center={origin} onCenterChange={onCenterChange} zoom={16} />
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
  container: { flex: 1, minHeight: 420, overflow: "hidden" },
  pinWrap: { alignItems: "center", left: "50%", position: "absolute", top: "50%", transform: [{ translateX: -24 }, { translateY: -56 }], width: 48 },
  pinBadge: { alignItems: "center", backgroundColor: colors.driverAccent, borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  pinTip: { borderLeftColor: "transparent", borderLeftWidth: 7, borderRightColor: "transparent", borderRightWidth: 7, borderTopColor: colors.driverAccent, borderTopWidth: 10, height: 0, marginTop: -2, width: 0 },
});
