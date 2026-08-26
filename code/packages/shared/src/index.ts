export * from './auth.schema';
export * from './profile.schema';
export * from './ride.schema';
export * from './booking.schema';
export * from './notification.schema';
export * from './review.schema';
export * from './payment.schema';
export * from './trip.schema';

// Goong API types — dùng chung cho backend, web, mobile
export type {
  GoongApiVersion,
  GoongVehicleType,
  GoongLatLng,
  GoongRouteLeg,
  GoongRoute,
  GoongDirectionsResult,
  GoongMatrixElement,
  GoongMatrixResult,
  GoongTripWaypoint,
  GoongOptimizedTripResult,
  GoongStaticMapOptions,
  GoongGeolocationRequest,
  GoongGeolocationResult,
  GoongErrorCode,
  GoongApiErrorPayload,
  GoongAutocompletePrediction,
  GoongAutocompleteResponse,
  GoongPlaceDetailResult,
  GoongPlaceDetailResponse,
  PlaceSearchResult,
  PlaceSearchSource,
  PlaceSearchConfidence,
} from './goong';

export * from './socket.events';
