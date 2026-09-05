import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { GOONG_CONFIG } from '../../constants/Config';
import { colors } from '../theme/tokens';
import type {
  ActiveRideLatLng,
  ActiveRideMapHandle,
  ActiveRideMapProps,
} from './ActiveRideMap';

const DEFAULT_FIT_EDGE_PADDING = { top: 88, right: 42, bottom: 230, left: 42 };

type MapBootstrapConfig = {
  apiKey: string;
  origin: ActiveRideLatLng;
  destination: ActiveRideLatLng;
  originLabel: string;
  destinationLabel: string;
  padding: { top: number; right: number; bottom: number; left: number };
  focusZoom: number;
};

const toInlineJson = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

function buildGoongMapHtml(config: MapBootstrapConfig) {
  const configJson = toInlineJson(config);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <script src="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #e8efec; }
    .maplibregl-canvas { outline: none; }
    .maplibregl-ctrl-attrib, .maplibregl-ctrl-logo { display: none !important; }
    .marker { display: grid; place-items: center; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(15, 23, 42, .28); }
    .marker-point { width: 28px; height: 28px; border-radius: 50%; }
    .marker-point::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #fff; }
    .marker-origin { background: #10b981; }
    .marker-destination { background: #ef4444; }
    .marker-pickup { width: 24px; height: 24px; border-radius: 50%; background: #0f766e; }
    .marker-pickup.active { background: #10b981; }
    .marker-pickup.dropoff { background: #ef4444; }
    .marker-driver { width: 38px; height: 38px; border-radius: 50%; background: #0071e3; box-shadow: 0 3px 10px rgba(0, 113, 227, .38); }
    .marker-driver::after { content: ''; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 14px solid #fff; transform: translateY(-2px); }
    .marker-user { width: 20px; height: 20px; border-radius: 50%; background: #0071e3; box-shadow: 0 2px 8px rgba(0, 113, 227, .35); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const config = ${configJson};
    let map;
    let mapReady = false;
    let driverMarker = null;
    let userMarker = null;
    let pickupMarkers = [];
    let hasFittedRoute = false;
    let hasFocusedDriver = false;

    const notify = (message) => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    };

    const markerElement = (className, label) => {
      const element = document.createElement('div');
      element.className = 'marker ' + className;
      element.setAttribute('aria-label', label || 'Điểm trên bản đồ');
      element.title = label || '';
      return element;
    };

    const addFixedMarker = (coordinate, className, label) => {
      return new maplibregl.Marker({ element: markerElement(className, label), anchor: 'center' })
        .setLngLat([coordinate.longitude, coordinate.latitude])
        .addTo(map);
    };

    const setRouteData = (coordinates) => {
      const source = map && map.getSource('route');
      if (!source) return;
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: (coordinates || []).map((point) => [point.longitude, point.latitude]),
        },
      });
    };

    window.updatePickupMarkers = (markers) => {
      if (!mapReady) return;
      pickupMarkers.forEach((marker) => marker.remove());
      pickupMarkers = (markers || []).map((item) => {
        const kindClass = item.kind === 'DROPOFF' ? ' dropoff' : item.isActive ? ' active' : '';
        return addFixedMarker(item.coordinate, 'marker-pickup' + kindClass, item.label);
      });
    };

    window.updateRouteCoordinates = (coordinates, shouldFit, fitOnce) => {
      if (!mapReady) return;
      setRouteData(coordinates);
      if (!shouldFit || !coordinates || coordinates.length < 2 || (fitOnce && hasFittedRoute)) return;

      const points = coordinates.map((point) => [point.longitude, point.latitude]);
      const bounds = points.slice(1).reduce(
        (current, point) => current.extend(point),
        new maplibregl.LngLatBounds(points[0], points[0]),
      );
      map.fitBounds(bounds, { padding: config.padding, duration: 700, maxZoom: 16 });
      hasFittedRoute = true;
    };

    window.updateDriverLocation = (coordinate, shouldFocus) => {
      if (!mapReady || !coordinate) return;
      if (!driverMarker) {
        driverMarker = addFixedMarker(coordinate, 'marker-driver', 'Vị trí tài xế');
      } else {
        driverMarker.setLngLat([coordinate.longitude, coordinate.latitude]);
      }
      if (shouldFocus && !hasFocusedDriver) {
        map.easeTo({ center: [coordinate.longitude, coordinate.latitude], zoom: config.focusZoom, duration: 500 });
        hasFocusedDriver = true;
      }
    };

    window.updateUserLocation = (coordinate) => {
      if (!mapReady || !coordinate) return;
      if (!userMarker) {
        userMarker = addFixedMarker(coordinate, 'marker-user', 'Vị trí của bạn');
      } else {
        userMarker.setLngLat([coordinate.longitude, coordinate.latitude]);
      }
    };

    window.recenterMap = (coordinate) => {
      if (!mapReady || !coordinate) return;
      map.easeTo({ center: [coordinate.longitude, coordinate.latitude], zoom: config.focusZoom, duration: 450 });
    };

    try {
      map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.goong.io/assets/goong_map_web.json?api_key=' + encodeURIComponent(config.apiKey),
        center: [config.origin.longitude, config.origin.latitude],
        zoom: 15,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });

      map.on('dragstart', (event) => event.originalEvent && notify({ type: 'USER_INTERACTION' }));
      map.on('zoomstart', (event) => event.originalEvent && notify({ type: 'USER_INTERACTION' }));
      map.on('error', (event) => notify({ type: 'MAP_ERROR', message: event.error && event.error.message }));
      map.on('load', () => {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
        });
        map.addLayer({
          id: 'route-outline',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#fff', 'line-width': 9, 'line-opacity': .92 },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#0071e3', 'line-width': 6 },
        });
        addFixedMarker(config.origin, 'marker-point marker-origin', config.originLabel);
        addFixedMarker(config.destination, 'marker-point marker-destination', config.destinationLabel);
        mapReady = true;
        notify({ type: 'MAP_READY' });
      });
    } catch (error) {
      notify({ type: 'MAP_ERROR', message: error instanceof Error ? error.message : String(error) });
    }
  </script>
</body>
</html>`;
}

const NativeWebView: any = WebView;

const injectCall = (ref: React.RefObject<any>, name: string, ...args: unknown[]) => {
  ref.current?.injectJavaScript(`window.${name}(${args.map(toInlineJson).join(',')}); true;`);
};

export const GoongNativeMap = memo(forwardRef<ActiveRideMapHandle, ActiveRideMapProps>(function GoongNativeMap(
  {
    originCoords,
    destinationCoords,
    routeCoords,
    driverLocation,
    originLabel = 'Điểm đi',
    destinationLabel = 'Điểm đến',
    pickupMarkers = [],
    onUserPan,
    fitEdgePadding = DEFAULT_FIT_EDGE_PADDING,
    autoFitRoute = true,
    fitRouteOnce = false,
    focusZoom = 16,
    autoFocusDriver = true,
    userLocation,
  },
  forwardedRef,
) {
  const webViewRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const originLatitude = originCoords.latitude;
  const originLongitude = originCoords.longitude;
  const destinationLatitude = destinationCoords.latitude;
  const destinationLongitude = destinationCoords.longitude;
  const paddingTop = fitEdgePadding.top;
  const paddingRight = fitEdgePadding.right;
  const paddingBottom = fitEdgePadding.bottom;
  const paddingLeft = fitEdgePadding.left;

  const htmlContent = useMemo(() => buildGoongMapHtml({
    apiKey: GOONG_CONFIG.MAPTILES_KEY,
    origin: { latitude: originLatitude, longitude: originLongitude },
    destination: { latitude: destinationLatitude, longitude: destinationLongitude },
    originLabel,
    destinationLabel,
    padding: { top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft },
    focusZoom,
  }), [
    destinationLatitude,
    destinationLongitude,
    destinationLabel,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    focusZoom,
    originLatitude,
    originLongitude,
    originLabel,
  ]);

  useImperativeHandle(forwardedRef, () => ({
    recenter: (coordinate) => {
      const target = coordinate || driverLocation || userLocation || originCoords;
      injectCall(webViewRef, 'recenterMap', target);
    },
  }), [driverLocation, originCoords, userLocation]);

  const syncMapState = useCallback(() => {
    injectCall(webViewRef, 'updateRouteCoordinates', routeCoords, autoFitRoute, fitRouteOnce);
    injectCall(webViewRef, 'updatePickupMarkers', pickupMarkers);
    if (driverLocation) {
      injectCall(webViewRef, 'updateDriverLocation', driverLocation, autoFocusDriver && !autoFitRoute);
    }
    if (userLocation) injectCall(webViewRef, 'updateUserLocation', userLocation);
  }, [autoFitRoute, autoFocusDriver, driverLocation, fitRouteOnce, pickupMarkers, routeCoords, userLocation]);

  useEffect(() => {
    if (mapReady) syncMapState();
  }, [mapReady, syncMapState]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string; message?: string };
      if (message.type === 'MAP_READY') {
        setMapError(null);
        setMapReady(true);
      } else if (message.type === 'USER_INTERACTION') {
        onUserPan?.();
      } else if (message.type === 'MAP_ERROR') {
        setMapError(message.message || 'Không tải được lớp bản đồ Goong');
      }
    } catch {
      // Bỏ qua message không thuộc giao thức của bản đồ.
    }
  }, [onUserPan]);

  return (
    <View style={styles.container} accessibilityLabel="Bản đồ hành trình đang diễn ra">
      <NativeWebView
        ref={webViewRef}
        originWhitelist={['https://*', 'about:blank']}
        source={{ html: htmlContent, baseUrl: 'https://tiles.goong.io' }}
        style={styles.webView}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        domStorageEnabled
        androidLayerType="hardware"
        onLoadStart={() => {
          setMapReady(false);
          setMapError(null);
        }}
        onMessage={handleMessage}
        onError={(event: any) => setMapError(event.nativeEvent.description || 'Không tải được bản đồ Goong')}
        onHttpError={(event: any) => setMapError(`Không tải được bản đồ Goong (${event.nativeEvent.statusCode})`)}
      />

      {!mapReady && !mapError ? (
        <View pointerEvents="none" style={styles.statusOverlay}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.statusText}>Đang tải bản đồ…</Text>
        </View>
      ) : null}

      {mapError ? (
        <View pointerEvents="none" style={styles.statusOverlay}>
          <Text style={styles.errorTitle}>Không tải được bản đồ Goong</Text>
          <Text style={styles.statusText}>{mapError}</Text>
        </View>
      ) : null}
    </View>
  );
}));

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e8efec',
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  webView: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'transparent',
  },
  statusOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    alignItems: 'center',
    backgroundColor: '#e8efec',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
