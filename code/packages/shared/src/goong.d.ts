// packages/shared/src/goong.d.ts
// Kiểu dữ liệu chung cho Goong API — dùng xuyên suốt backend, web, mobile
// Ref: https://docs.goong.io/rest/place/autocomplete/

export type GoongApiVersion = 'v1' | 'v2';
export type GoongVehicleType = 'car' | 'bike' | 'motorcycle' | 'taxi' | 'truck' | 'hd';

export interface GoongLatLng {
  lat: number;
  lng: number;
}

export interface GoongRouteLeg {
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  steps: unknown[];
  start_address?: string;
  end_address?: string;
}

export interface GoongRoute {
  summary?: string;
  legs: GoongRouteLeg[];
  overview_polyline: { points: string };
  waypoint_order?: number[];
}

export interface GoongDirectionsResult {
  routes: GoongRoute[];
  geocoded_waypoints?: Array<{ geocoder_status: string; place_id?: string }>;
}

export interface GoongMatrixElement {
  status: string;
  distance: { value: number; text: string };
  duration: { value: number; text: string };
}

export interface GoongMatrixResult {
  rows: Array<{ elements: GoongMatrixElement[] }>;
}

export interface GoongTripWaypoint {
  distance: number;
  location: [number, number];
  place_id?: string;
  trips_index: number;
  waypoint_index: number;
}

export interface GoongOptimizedTripResult {
  code: string;
  trips: Array<{
    distance: number;
    duration: number;
    geometry: string;
    legs: Array<{ distance: number; duration: number; steps: unknown[]; summary?: string }>;
  }>;
  waypoints: GoongTripWaypoint[];
}

export interface GoongStaticMapOptions {
  origin: string;
  destination: string;
  width?: number;
  height?: number;
  vehicle?: GoongVehicleType;
  type?: 'fastest' | 'shortest';
  color?: string;
}

export interface GoongGeolocationRequest {
  homeMobileCountryCode?: number;
  homeMobileNetworkCode?: number;
  radioType?: 'gsm' | 'cdma' | 'wcdma' | 'lte' | 'nr';
  carrier?: string;
  considerIp?: boolean;
  cellTowers?: Array<Record<string, number>>;
  wifiAccessPoints?: Array<{ macAddress: string; signalStrength?: number; signalToNoiseRatio?: number; age?: number }>;
}

export interface GoongGeolocationResult {
  location: GoongLatLng;
  accuracy: number;
}

export type GoongErrorCode = 'INVALID_REQUEST' | 'NOT_FOUND' | 'RATE_LIMITED' | 'TIMEOUT' | 'UPSTREAM_ERROR' | 'FEATURE_DISABLED';

export interface GoongApiErrorPayload {
  code: GoongErrorCode;
  message: string;
  retryable: boolean;
}

// ─── Autocomplete V1 ───────────────────────────────────────────────────────────

export interface GoongAutocompletePrediction {
  description: string;
  matched_substrings: Array<{ length: number; offset: number }>;
  place_id: string;
  reference: string;
  structured_formatting: {
    main_text: string;
    main_text_matched_substrings?: Array<{ length: number; offset: number }>;
    secondary_text: string;
    secondary_text_matched_substrings?: Array<{ length: number; offset: number }>;
  };
  terms: Array<{ offset: number; value: string }>;
  has_children: boolean;
  display_type?: string;
  score?: number;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
  // Chỉ có khi more_compound=true
  compound?: {
    commune: string;
    district?: string;
    province: string;
  };
  types?: string[];
  distance_meters?: number;
  deprecated_description?: string;
}

export interface GoongAutocompleteResponse {
  predictions: GoongAutocompletePrediction[];
  executed_time: number;
  executed_time_all: number;
  status: string;
}

// ─── Place Detail ──────────────────────────────────────────────────────────────

export interface GoongPlaceDetailResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
}

export interface GoongPlaceDetailResponse {
  result: GoongPlaceDetailResult;
  status: string;
}
