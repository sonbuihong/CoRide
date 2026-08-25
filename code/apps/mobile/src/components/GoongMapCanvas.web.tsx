import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { RefreshCw } from "lucide-react-native";

import { GOONG_CONFIG } from "../../constants/Config";
import { colors, spacing } from "../theme/tokens";
import { AppText } from "./ui/AppText";

interface Coordinates { latitude: number; longitude: number }
interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: { type: "Point" | "LineString"; coordinates: number[] | number[][] };
  }[];
}
interface MapSource { setData: (data: GeoJsonFeatureCollection) => void }
interface GoongMapInstance {
  addLayer: (layer: Record<string, unknown>) => void;
  addSource: (id: string, source: Record<string, unknown>) => void;
  fitBounds: (bounds: [[number, number], [number, number]], options: Record<string, unknown>) => void;
  getCenter: () => { lat: number; lng: number };
  getSource: (id: string) => MapSource | undefined;
  jumpTo: (options: Record<string, unknown>) => void;
  on: (event: string, listener: () => void) => void;
  remove: () => void;
  touchZoomRotate?: { disableRotation: () => void };
}
interface GoongNamespace {
  accessToken: string;
  Map: new (options: Record<string, unknown>) => GoongMapInstance;
}
declare global { interface Window { goongjs?: GoongNamespace } }

const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js";
const CSS_URL = "https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css";
const EMPTY_ROUTE_LINES: Coordinates[][] = [];
let loader: Promise<GoongNamespace> | undefined;

function loadGoongJs() {
  if (window.goongjs) return Promise.resolve(window.goongjs);
  if (loader) return loader;
  loader = new Promise<GoongNamespace>((resolve, reject) => {
    if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      document.head.appendChild(link);
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => window.goongjs ? resolve(window.goongjs) : reject(new Error("Goong JS unavailable")), { once: true });
    script.addEventListener("error", () => { loader = undefined; reject(new Error("Unable to load Goong JS")); }, { once: true });
    if (!existing) {
      script.src = SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return loader;
}

interface GoongMapCanvasProps {
  center: Coordinates;
  origin?: Coordinates;
  destination?: Coordinates;
  routeLines?: Coordinates[][];
  selectedRouteIndex?: number;
  onCenterChange?: (coordinates: Coordinates) => void;
  zoom?: number;
}

export function GoongMapCanvas({ center, origin, destination, routeLines = EMPTY_ROUTE_LINES, selectedRouteIndex = 0, onCenterChange, zoom = 16 }: GoongMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoongMapInstance | null>(null);
  const centerChangeRef = useRef(onCenterChange);
  const initialCenter = useRef(center).current;
  const initialZoom = useRef(zoom).current;
  const [ready, setReady] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  centerChangeRef.current = onCenterChange;

  useEffect(() => {
    let disposed = false;
    setFailed(false);
    void loadGoongJs().then((goongjs) => {
      if (disposed || !containerRef.current || mapRef.current) return;
      goongjs.accessToken = GOONG_CONFIG.MAPTILES_KEY;
      const map = new goongjs.Map({ accessToken: GOONG_CONFIG.MAPTILES_KEY, center: [initialCenter.longitude, initialCenter.latitude], container: containerRef.current, dragRotate: false, pitchWithRotate: false, style: "https://tiles.goong.io/assets/goong_map_web.json", zoom: initialZoom });
      mapRef.current = map;
      map.touchZoomRotate?.disableRotation();
      map.on("load", () => { if (!disposed) setReady((value) => value + 1); });
      map.on("moveend", () => {
        const next = map.getCenter();
        centerChangeRef.current?.({ latitude: next.lat, longitude: next.lng });
      });
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; };
  }, [attempt, initialCenter.latitude, initialCenter.longitude, initialZoom]);

  const pointData = useMemo<GeoJsonFeatureCollection>(() => ({
    type: "FeatureCollection",
    features: [
      ...(origin ? [{ type: "Feature" as const, properties: { role: "origin" }, geometry: { type: "Point" as const, coordinates: [origin.longitude, origin.latitude] } }] : []),
      ...(destination ? [{ type: "Feature" as const, properties: { role: "destination" }, geometry: { type: "Point" as const, coordinates: [destination.longitude, destination.latitude] } }] : []),
    ],
  }), [destination, origin]);
  const routeData = useMemo<GeoJsonFeatureCollection>(() => ({
    type: "FeatureCollection",
    features: routeLines.map((line, index) => ({ line, index }))
      .sort((a, b) => Number(a.index === selectedRouteIndex) - Number(b.index === selectedRouteIndex))
      .map(({ line, index }) => ({ type: "Feature" as const, properties: { selected: index === selectedRouteIndex }, geometry: { type: "LineString" as const, coordinates: line.map((point) => [point.longitude, point.latitude]) } })),
  }), [routeLines, selectedRouteIndex]);

  const syncMapData = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.getSource("coride-points")) {
      map.addSource("coride-points", { type: "geojson", data: pointData });
      map.addLayer({ id: "coride-points", type: "circle", source: "coride-points", paint: { "circle-color": ["match", ["get", "role"], "destination", colors.mapDestination, colors.mapPickup], "circle-radius": 7, "circle-stroke-color": colors.surface, "circle-stroke-width": 3 } });
    } else map.getSource("coride-points")?.setData(pointData);
    if (!map.getSource("coride-routes")) {
      map.addSource("coride-routes", { type: "geojson", data: routeData });
      map.addLayer({ id: "coride-routes", type: "line", source: "coride-routes", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": ["case", ["==", ["get", "selected"], true], colors.mapRoute, "rgba(0,113,227,0.28)"], "line-opacity": ["case", ["==", ["get", "selected"], true], 1, 0.78], "line-width": ["case", ["==", ["get", "selected"], true], 7, 4] } });
    } else map.getSource("coride-routes")?.setData(routeData);
  }, [pointData, routeData]);

  useEffect(() => {
    if (!ready) return;
    syncMapData();
    const map = mapRef.current;
    if (!map) return;
    if (!routeLines.length) { map.jumpTo({ center: [center.longitude, center.latitude], zoom }); return; }
    const points = routeLines.flat();
    const lngs = points.map((point) => point.longitude);
    const lats = points.map((point) => point.latitude);
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: { top: 56, right: 36, bottom: 220, left: 36 }, duration: 300 });
  }, [center.latitude, center.longitude, ready, routeLines, syncMapData, zoom]);

  return (
    <View style={styles.root}>
      <div ref={containerRef} style={webMapStyle} />
      {failed && <View accessibilityRole="alert" style={styles.fallback}>
        <AppText weight="semibold">Không tải được bản đồ Goong</AppText>
        <AppText variant="bodySmall" style={styles.fallbackCopy}>Kiểm tra kết nối rồi thử lại.</AppText>
        <Pressable accessibilityRole="button" onPress={() => setAttempt((value) => value + 1)} style={styles.retry}>
          <RefreshCw size={17} color={colors.primary} />
          <AppText variant="bodySmall" weight="semibold" style={styles.retryText}>Thử lại</AppText>
        </Pressable>
      </View>}
    </View>
  );
}

const webMapStyle = { height: "100%", width: "100%" };
const styles = StyleSheet.create({
  root: { backgroundColor: colors.surfaceMuted, flex: 1, minHeight: 320, width: "100%" },
  fallback: { alignItems: "center", backgroundColor: colors.surface, bottom: spacing.lg, left: spacing.lg, padding: spacing.md, position: "absolute", right: spacing.lg },
  fallbackCopy: { color: colors.textSecondary, marginTop: spacing.xs },
  retry: { alignItems: "center", flexDirection: "row", gap: spacing.xs, minHeight: 48, paddingHorizontal: spacing.sm },
  retryText: { color: colors.primary },
});
