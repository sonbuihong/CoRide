// packages/shared/src/goong.d.ts
// Kiểu dữ liệu chung cho Goong API — dùng xuyên suốt backend, web, mobile
// Ref: https://docs.goong.io/rest/place/autocomplete/

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
