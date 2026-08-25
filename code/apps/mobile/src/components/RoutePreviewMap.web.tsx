import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { GoongRoute } from "@repo/shared";

import { decodePolyline } from "../services/direction.service";
import { colors, radius } from "../theme/tokens";
import { GoongMapCanvas } from "./GoongMapCanvas.web";

interface Coordinates { latitude: number; longitude: number }
interface RoutePreviewMapProps {
  origin: Coordinates;
  destination: Coordinates;
  encodedPolyline?: string;
  vehicle?: "bike" | "car";
  routeIndex?: number;
  routes?: GoongRoute[];
  stops?: (Coordinates & { id?: string; name?: string })[];
  fill?: boolean;
}

export function RoutePreviewMap({ origin, destination, encodedPolyline, routeIndex = 0, routes = [], fill = false }: RoutePreviewMapProps) {
  const routeLines = useMemo(
    () => routes.length
      ? routes.map((route) => decodePolyline(route.overview_polyline.points))
      : encodedPolyline ? [decodePolyline(encodedPolyline)] : [],
    [encodedPolyline, routes],
  );
  return (
    <View accessibilityLabel="Bản đồ các phương án lộ trình" style={[styles.container, fill && styles.fill]}>
      <GoongMapCanvas center={origin} destination={destination} origin={origin} routeLines={routeLines} selectedRouteIndex={routeIndex} zoom={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surfaceMuted, borderRadius: radius.card, height: 224, overflow: "hidden", width: "100%" },
  fill: { borderRadius: 0, flex: 1, height: undefined, minHeight: 420 },
});
