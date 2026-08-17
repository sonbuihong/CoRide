/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { autocompleteAddress, getPlaceDetail } from '@/lib/goong';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// maplibre-gl v4: worker được built-in trong bundle, không cần file riêng.
// Import trực tiếp từ npm là cách đúng và đơn giản nhất với v4.
import maplibregl from 'maplibre-gl';
// ─────────────────────────────────────────────────────────────────────────────
// Danh sách kiểu bản đồ Goong (5 kiểu, dùng 3 kiểu phổ biến nhất)
// ─────────────────────────────────────────────────────────────────────────────
const MAP_STYLES = [
  {
    name: 'Bản đồ',
    url: (key: string) => `https://tiles.goong.io/assets/goong_map_web.json?api_key=${key}`,
  },
  {
    name: 'Nổi bật',
    url: (key: string) => `https://tiles.goong.io/assets/goong_map_highlight.json?api_key=${key}`,
  },
  {
    name: 'Vệ tinh',
    url: (key: string) => `https://tiles.goong.io/assets/goong_satellite.json?api_key=${key}`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Hàm vẽ vòng tròn (polygon xấp xỉ hình tròn, 64 điểm)
// Tham số: center = [lng, lat], radiusInMeters
// Trả về mảng các toạ độ [lng, lat] khép kín
// ─────────────────────────────────────────────────────────────────────────────
function drawCircle(center: [number, number], radiusInMeters: number): [number, number][] {
  const POINTS = 64;
  const coords = { latitude: center[1], longitude: center[0] };
  const km = radiusInMeters / 1000;
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  const result: [number, number][] = [];
  for (let i = 0; i < POINTS; i++) {
    const theta = (i / POINTS) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    result.push([coords.longitude + x, coords.latitude + y]);
  }
  // Khép kín polygon
  result.push(result[0]);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────
interface MarkerConfig {
  // [lng, lat] – Goong/MapLibre dùng lng trước
  position: [number, number];
  color?: string;
  /** 'pin' = Google Maps-style teardrop (điểm đến), 'dot' = chấm tròn pulse (vị trí hiện tại) */
  type?: 'pin' | 'dot';
  /** Canvas layer giữ tọa độ chính xác hơn DOM marker ở mức zoom rất rộng. */
  renderMode?: 'dom' | 'layer';
}

// ─────────────────────────────────────────────────────────────────────────────
// Tạo DOM element cho marker theo loại
// pin: Hình giọt nước đỏ với chấm trắng bên trong (kiểu Google Maps)
// dot: Chấm tròn xanh dương với hiệu ứng pulse (vị trí hiện tại)
// ─────────────────────────────────────────────────────────────────────────────
function createMarkerElement(type: 'pin' | 'dot' = 'pin', color?: string): HTMLDivElement {
  const el = document.createElement('div');
  // MapLibre quản lý transform trên chính root element này. Giữ kích thước và
  // box model ổn định để anchor không đổi khi zoom hoặc thay đổi pitch.
  el.style.boxSizing = 'border-box';
  el.style.pointerEvents = 'none';

  if (type === 'dot') {
    // Vị trí hiện tại: chấm xanh dương + pulse
    const dotColor = color || '#4285F4';
    el.style.cssText = 'position: relative; width: 22px; height: 22px;';
    el.style.boxSizing = 'border-box';
    el.style.pointerEvents = 'none';

    // Vòng pulse bao ngoài
    const pulse = document.createElement('div');
    pulse.style.cssText = `
      position: absolute; inset: -6px; border-radius: 50%;
      background: ${dotColor}; opacity: 0.25;
      animation: marker-pulse 2s ease-out infinite;
    `;
    el.appendChild(pulse);

    // Chấm chính
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: relative; width: 22px; height: 22px; border-radius: 50%;
      background: ${dotColor}; border: 3px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    `;
    el.appendChild(dot);

    // Inject keyframes 1 lần duy nhất
    if (!document.getElementById('marker-pulse-keyframes')) {
      const style = document.createElement('style');
      style.id = 'marker-pulse-keyframes';
      style.textContent = `
        @keyframes marker-pulse {
          0%   { transform: scale(1);   opacity: 0.25; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  } else {
    // Điểm đến: Google Maps-style pin đỏ
    const pinColor = color || '#EA4335';
    el.style.cssText = `
      position: relative; width: 30px; height: 42px;
      box-sizing: border-box; pointer-events: none;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
    `;

    // SVG pin giống Google Maps
    el.innerHTML = `
      <svg viewBox="0 0 30 42" width="30" height="42" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill="${pinColor}"/>
        <circle cx="15" cy="14" r="6" fill="white"/>
      </svg>
    `;
  }

  return el;
}

interface PolylineConfig {
  positions: Array<[number, number]>; // [lng, lat]
  color?: string;
  width?: number;
  opacity?: number;
  dashArray?: number[];
  outlineColor?: string;
  outlineWidth?: number;
  outlineOpacity?: number;
}

interface RouteInfo {
  distance: string;
  duration: string;
}

interface GoongMapProps {
  // center: [lat, lng] (format cũ để không break các trang đang dùng)
  // Bên trong component sẽ convert sang [lng, lat] cho MapLibre
  center?: [number, number];
  zoom?: number;
  markers?: MarkerConfig[];
  polylines?: PolylineConfig[];
  routeInfo?: RouteInfo;
  height?: string;
  className?: string;
  /** Bán kính vòng tròn xung quanh marker đầu tiên (mét), 0 = tắt */
  circleRadius?: number;
  /** Hiển thị thanh tìm kiếm + chọn kiểu bản đồ hay không */
  showControls?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component chính
// ─────────────────────────────────────────────────────────────────────────────
const GoongMapComponent: React.FC<GoongMapProps> = ({
  center = [21.0285, 105.8542], // [lat, lng] – format cũ của codebase
  zoom = 14,
  markers = [],
  polylines = [],
  routeInfo,
  height = '400px',
  className = '',
  circleRadius = 0,
  showControls = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerInstancesRef = useRef<any[]>([]);
  const popupInstanceRef = useRef<any>(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [currentStyleName, setCurrentStyleName] = useState(MAP_STYLES[0].name);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const MAP_KEY = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY || '';

  // Convert center [lat, lng] → [lng, lat] cho MapLibre
  const centerLngLat: [number, number] = [center[1], center[0]];

  // ── Khởi tạo bản đồ khi component mount ────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Flag để tránh setState sau khi component unmount
    let mounted = true;

    let mapInstance: any;
    try {
      mapInstance = new maplibregl.Map({
        container: mapContainerRef.current,
        style: `${MAP_STYLES[0].url(MAP_KEY)}`,
        zoom,
        center: centerLngLat,
      });
    } catch (err) {
      console.error('[GoongMap] Lỗi khởi tạo Map:', err);
      if (mounted) setIsMapReady(true);
      return;
    }

    // Fallback nếu sự kiện 'load' không bao giờ được gọi
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[GoongMap] Map load event timeout, forcing ready state');
        setIsMapReady(true);
      }
    }, 5000);

    mapInstance.on('error', (e: any) => {
      if (e?.error?.message?.includes('does not exist on source')) return;
      console.error('[GoongMap] Map error:', e?.error?.message || e);
      clearTimeout(fallbackTimeout);
      if (mounted) setIsMapReady(true);
    });

    mapInstance.on('load', () => {
      clearTimeout(fallbackTimeout);
      if (mounted) setIsMapReady(true);
    });

    mapRef.current = mapInstance;

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cập nhật markers + vòng tròn + polyline khi props thay đổi ───────────
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const map = mapRef.current;
    markerInstancesRef.current.forEach((m) => m.remove());
    markerInstancesRef.current = [];

    // Xoá popup cũ
    if (popupInstanceRef.current) {
      popupInstanceRef.current.remove();
      popupInstanceRef.current = null;
    }

    // Xóa layer 'circle-outline' trước nếu nó đang tồn tại
    if (map.getLayer('circle-outline')) map.removeLayer('circle-outline');

    const markerLayerIds = (map.getStyle()?.layers ?? [])
      .map((layer: { id: string }) => layer.id)
      .filter((id: string) => id.startsWith('coordinate-marker-'));
    markerLayerIds.forEach((id: string) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });

    const markerSourceIds = Object.keys(map.getStyle()?.sources ?? {})
      .filter((id) => id.startsWith('coordinate-marker-'));
    markerSourceIds.forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });

    // Mỗi polyline là một source/layer riêng để có thể dùng màu và kiểu nét
    // khác nhau. Dọn toàn bộ layer cũ trước khi vẽ lại.
    const routeLayerIds = (map.getStyle()?.layers ?? [])
      .map((layer: { id: string }) => layer.id)
      .filter((id: string) => id === 'route' || id.startsWith('route-'));
    routeLayerIds.forEach((id: string) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });

    const routeSourceIds = Object.keys(map.getStyle()?.sources ?? {})
      .filter((id) => id === 'route' || id.startsWith('route-'));
    ['circle', ...routeSourceIds].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    const canvasMarkerLayerIds: string[] = [];

    // Vẽ markers
    markers.forEach((m, idx) => {
      if (m.renderMode === 'layer') {
        const markerId = `coordinate-marker-${idx}`;
        const mainLayerId = `${markerId}-main`;
        map.addSource(markerId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: m.position },
          },
        });
        map.addLayer({
          id: mainLayerId,
          type: 'circle',
          source: markerId,
          paint: {
            'circle-radius': m.type === 'pin' ? 10 : 8,
            'circle-color': m.color || '#0071e3',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 3,
            'circle-opacity': 1,
            'circle-pitch-alignment': 'viewport',
            'circle-pitch-scale': 'viewport',
          },
        });
        canvasMarkerLayerIds.push(mainLayerId);

        // Điểm đến có tâm trắng để phân biệt với điểm đón mà không dùng một
        // SVG/HTML có anchor dễ sai lệch khi zoom rộng.
        if (m.type === 'pin') {
          const centerLayerId = `${markerId}-center`;
          map.addLayer({
            id: centerLayerId,
            type: 'circle',
            source: markerId,
            paint: {
              'circle-radius': 3,
              'circle-color': '#ffffff',
              'circle-pitch-alignment': 'viewport',
              'circle-pitch-scale': 'viewport',
            },
          });
          canvasMarkerLayerIds.push(centerLayerId);
        }
        return;
      }

      // m.position đã là [lng, lat] (theo interface)
      const el = createMarkerElement(m.type || 'pin', m.color);
      const anchorOpts = {
        element: el,
        anchor: m.type === 'dot' ? 'center' as const : 'bottom' as const,
        // Không làm tròn vị trí chiếu về pixel nguyên. Sai số nửa pixel gần như
        // không thấy khi zoom gần nhưng có thể tương ứng hàng trăm mét/km khi zoom rộng.
        subpixelPositioning: true,
        pitchAlignment: 'viewport' as const,
        rotationAlignment: 'viewport' as const,
      };
      const marker = new maplibregl.Marker(anchorOpts)
        .setLngLat(m.position)
        .addTo(map);
      markerInstancesRef.current.push(marker);

      // Vẽ vòng tròn quanh marker đầu tiên nếu circleRadius > 0
      if (idx === 0 && circleRadius > 0) {
        const circleGeoJSON = {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [drawCircle(m.position, circleRadius)],
            },
          }],
        };
        map.addSource('circle', { type: 'geojson', data: circleGeoJSON });
        map.addLayer({
          id: 'circle',
          type: 'fill',
          source: 'circle',
          paint: { 'fill-color': m.color || '#0071e3', 'fill-opacity': 0.18 },
        });
        // Đường viền vòng tròn
        if (map.getLayer('circle-outline')) map.removeLayer('circle-outline');
        map.addLayer({
          id: 'circle-outline',
          type: 'line',
          source: 'circle',
          paint: { 'line-color': m.color || '#0071e3', 'line-width': 2, 'line-opacity': 0.6 },
        });
      }
    });

    // Vẽ từng polyline route bằng layer độc lập.
    if (polylines.length > 0) {
      const drawablePolylines = polylines.filter((polyline) => polyline.positions.length >= 2);
      const allCoords = [
        ...drawablePolylines.flatMap((polyline) => polyline.positions),
        ...markers.map((marker) => marker.position),
      ];

      drawablePolylines.forEach((polyline, index) => {
        const routeId = `route-${index}`;
        map.addSource(routeId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: polyline.positions },
          },
        });

        if (polyline.outlineWidth && polyline.outlineWidth > (polyline.width ?? 5)) {
          map.addLayer({
            id: `${routeId}-outline`,
            type: 'line',
            source: routeId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': polyline.outlineColor || '#ffffff',
              'line-width': polyline.outlineWidth,
              'line-opacity': polyline.outlineOpacity ?? 0.9,
            },
          });
        }

        map.addLayer({
          id: routeId,
          type: 'line',
          source: routeId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': polyline.color || '#0071e3',
            'line-width': polyline.width ?? 5,
            'line-opacity': polyline.opacity ?? 0.9,
            ...(polyline.dashArray ? { 'line-dasharray': polyline.dashArray } : {}),
          },
        });
      });

      // Popup thông tin ở giữa route
      const primaryRoute = drawablePolylines[0]?.positions ?? [];
      if (routeInfo && primaryRoute.length > 1) {
        const midPoint = primaryRoute[Math.floor(primaryRoute.length / 2)];
        popupInstanceRef.current = new maplibregl.Popup({ closeOnClick: false, closeButton: false })
          .setLngLat(midPoint as [number, number])
          .setHTML(`
            <div class="px-2 py-1 text-center font-sans">
              <div class="font-bold text-[13px] text-[#0071e3]">${routeInfo.duration}</div>
              <div class="text-[11px] text-gray-500">${routeInfo.distance}</div>
            </div>
          `)
          .addTo(map);
      }

      // Zoom fit toàn bộ route
      if (allCoords.length > 0) {
        const bounds = allCoords.reduce(
          (b: any, coord: any) => b.extend(coord as [number, number]),
          new maplibregl.LngLatBounds(allCoords[0] as [number, number], allCoords[0] as [number, number])
        );
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }
    }

    // Route được thêm sau marker, vì vậy đưa marker canvas lên trên cùng sau
    // khi hoàn tất để icon luôn nhìn thấy nhưng tâm vẫn neo đúng tọa độ.
    canvasMarkerLayerIds.forEach((layerId) => {
      if (map.getLayer(layerId)) map.moveLayer(layerId);
    });
  }, [isMapReady, markers, polylines, routeInfo, circleRadius]);

  // ── Đóng dropdown tìm kiếm khi click ra ngoài ────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Autocomplete: debounce 400ms để tiết kiệm phí API ───────────────────
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await autocompleteAddress(val, { limit: 5 });
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch { setSuggestions([]); }
      finally { setIsSearching(false); }
    }, 400);
  };

  // ── Chọn gợi ý → lấy tọa độ qua Place Detail → thêm marker + flyTo ──────
  const handleSelectSuggestion = useCallback(async (suggestion: any) => {
    setSearchQuery(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    const map = mapRef.current;
    if (!map) return;

    try {
      const detail = await getPlaceDetail(suggestion.place_id);
      if (detail?.geometry?.location) {
        const { lat, lng } = detail.geometry.location;
        const lngLat: [number, number] = [lng, lat];

        // Thêm marker tại vị trí tìm kiếm (dùng pin style)
        const el = createMarkerElement('pin', '#EA4335');
        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'bottom',
          subpixelPositioning: true,
          pitchAlignment: 'viewport',
          rotationAlignment: 'viewport',
        }).setLngLat(lngLat).addTo(map);
        markerInstancesRef.current.push(marker);

        // Cập nhật vòng tròn xung quanh điểm tìm kiếm
        if (circleRadius > 0) {
          if (map.getLayer('circle')) map.removeLayer('circle');
          if (map.getLayer('circle-outline')) map.removeLayer('circle-outline');
          if (map.getSource('circle')) map.removeSource('circle');

          const circleGeoJSON = {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [drawCircle(lngLat, circleRadius)] },
            }],
          };
          map.addSource('circle', { type: 'geojson', data: circleGeoJSON });
          map.addLayer({ id: 'circle', type: 'fill', source: 'circle', paint: { 'fill-color': '#ff6b35', 'fill-opacity': 0.18 } });
          map.addLayer({ id: 'circle-outline', type: 'line', source: 'circle', paint: { 'line-color': '#ff6b35', 'line-width': 2, 'line-opacity': 0.6 } });
        }

        // Bay đến điểm mới
        map.flyTo({ center: lngLat, zoom: zoom });
      }
    } catch (err) {
      console.error('[GoongMap] Lỗi lấy chi tiết địa điểm:', err);
    }
  }, [circleRadius, zoom]);

  // ── Chọn kiểu bản đồ ─────────────────────────────────────────────────────
  const handleChangeStyle = (style: typeof MAP_STYLES[0]) => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(style.url(MAP_KEY));
    setCurrentStyleName(style.name);
    setShowStyleMenu(false);
    // Sau khi đổi style, cần vẽ lại route/layer khi map load xong
    mapRef.current.once('style.load', () => setIsMapReady((prev) => !prev));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={cn('relative w-full overflow-hidden', className)} style={{ height }}>
      {/* Loading skeleton khi chưa load xong lib */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f5f5f7] dark:bg-[#1d1d1f] z-10 rounded-inherit">
          <Loader2 className="w-5 h-5 animate-spin text-[#0071e3]" />
        </div>
      )}

      {/* Container bản đồ */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Controls: Tìm kiếm + Chọn kiểu bản đồ */}
      {showControls && isMapReady && (
        <div className="absolute top-3 left-3 right-3 z-[100] flex gap-2">
          {/* Ô tìm kiếm */}
          <div ref={searchContainerRef} className="relative flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInput}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Tìm kiếm địa điểm..."
                className="w-full h-[40px] rounded-[10px] bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-md border border-[rgba(0,0,0,0.1)] px-3 pr-8 text-[14px] text-[#1d1d1f] dark:text-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {isSearching
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0071e3]" />
                  : <span className="text-[rgba(0,0,0,0.4)]" style={{ fontSize: 14 }}>&#8981;</span>
                }
              </div>
            </div>

            {/* Dropdown gợi ý */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute top-full mt-1.5 w-full bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-md border border-[rgba(0,0,0,0.08)] rounded-[10px] shadow-xl overflow-hidden max-h-[240px] overflow-y-auto">
                {suggestions.map((s) => (
                  <li
                    key={s.place_id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(s)}
                    className="px-3 py-2.5 text-[13px] text-[#1d1d1f] dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[rgba(255,255,255,0.06)] cursor-pointer border-b border-[rgba(0,0,0,0.04)] last:border-0 leading-snug"
                  >
                    <div className="font-medium">{s.structured_formatting?.main_text || s.description}</div>
                    {s.structured_formatting?.secondary_text && (
                      <div className="text-[11px] text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.4)] mt-0.5">
                        {s.structured_formatting.secondary_text}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Chọn kiểu bản đồ */}
          <div className="relative">
            <button
              onClick={() => setShowStyleMenu((v) => !v)}
              className="h-[40px] px-3 rounded-[10px] bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-md border border-[rgba(0,0,0,0.1)] text-[13px] font-medium text-[#1d1d1f] dark:text-white shadow-md hover:bg-white dark:hover:bg-[#2a2a2a] transition-colors whitespace-nowrap"
            >
              {currentStyleName}
            </button>
            {showStyleMenu && (
              <ul className="absolute top-full right-0 mt-1.5 bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-md border border-[rgba(0,0,0,0.08)] rounded-[10px] shadow-xl overflow-hidden min-w-[120px]">
                {MAP_STYLES.map((style) => (
                  <li
                    key={style.name}
                    onClick={() => handleChangeStyle(style)}
                    className={cn(
                      'px-4 py-2.5 text-[13px] cursor-pointer transition-colors border-b border-[rgba(0,0,0,0.04)] last:border-0',
                      style.name === currentStyleName
                        ? 'bg-[#0071e3] text-white font-semibold'
                        : 'text-[#1d1d1f] dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[rgba(255,255,255,0.06)]'
                    )}
                  >
                    {style.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoongMapComponent;
