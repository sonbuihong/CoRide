import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import type { GoongRoute } from "@repo/shared";

import { decodePolyline } from "../services/direction.service";
import { colors, radius } from "../theme/tokens";

interface Coordinates {
  latitude: number;
  longitude: number;
}

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

export function RoutePreviewMap({
  origin,
  destination,
  encodedPolyline,
  routes = [],
  routeIndex = 0,
  stops = [],
  fill = false,
}: RoutePreviewMapProps) {
  const mapRef = useRef<MapView>(null);
  const route = useMemo(
    () =>
      encodedPolyline ? decodePolyline(encodedPolyline) : [origin, destination],
    [destination, encodedPolyline, origin],
  );
  const routeLines = useMemo(
    () => routes.map((item) => decodePolyline(item.overview_polyline.points)),
    [routes],
  );
  const fitRoute = useCallback(() => {
    mapRef.current?.fitToCoordinates(
      route.length > 1 ? route : [origin, destination],
      {
        animated: false,
        edgePadding: { top: 44, right: 36, bottom: 44, left: 36 },
      },
    );
  }, [destination, origin, route]);

  useEffect(() => {
    const frame = requestAnimationFrame(fitRoute);
    return () => cancelAnimationFrame(frame);
  }, [fitRoute]);

  return (
    <View
      style={[styles.container, fill && styles.fill]}
      accessibilityLabel="Bản đồ xem trước tuyến đường"
    >
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ ...origin, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
        onMapReady={fitRoute}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {routeLines.length > 0
          ? routeLines.map((line, index) => (
              <Polyline
                key={`${routes[index].overview_polyline.points.slice(0, 18)}-${index}`}
                coordinates={line}
                strokeColor={
                  index === routeIndex ? colors.mapRoute : "rgba(0,113,227,0.25)"
                }
                strokeWidth={index === routeIndex ? 7 : 4}
                zIndex={index === routeIndex ? 2 : 1}
              />
            ))
          : route.length > 1 && (
              <Polyline
                coordinates={route}
                strokeColor={colors.mapRoute}
                strokeWidth={5}
              />
            )}
        <Marker
          coordinate={origin}
          title="Điểm đi"
          pinColor={colors.mapPickup}
        />
        {stops.map((stop, index) => (
          <Marker
            key={stop.id ?? `${stop.latitude}-${stop.longitude}`}
            coordinate={stop}
            title={stop.name || `Điểm dừng ${index + 1}`}
            pinColor={colors.primary}
          />
        ))}
        <Marker
          coordinate={destination}
          title="Điểm đến"
          pinColor={colors.mapDestination}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.border,
    borderRadius: radius.card,
    height: 224,
    overflow: "hidden",
    width: "100%",
  },
  fill: { borderRadius: 0, flex: 1, height: undefined, minHeight: 420 },
});
