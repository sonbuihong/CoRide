import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import {
  ActiveRideMap,
  type ActiveRideLatLng,
  type ActiveRideMapHandle,
} from '../../components/ActiveRideMap';
import { DraggableBottomSheet } from '../../components/ui/DraggableBottomSheet';
import { FloatingMyLocation } from '../../components/ui/FloatingMyLocation';
import { usePassengerTrackDriver } from '../../hooks/useDriverLocation';
import { getRealtimeRefetchInterval, useSocketConnection } from '../../hooks/useSocketConnection';
import { decodePolyline, getDirections } from '../../services/direction.service';
import { rideService } from '../../services/ride.service';
import { colors, radius, spacing } from '../../theme/tokens';
import { nativeShadows } from '../../theme/shadows';

import {
  derivePassengerJourneyState,
  PassengerBookingStatus,
} from './PassengerBookingStatus';
import { PassengerDriverSummary } from './PassengerDriverSummary';
import { PassengerBookingDetails } from './PassengerBookingDetails';

export interface PassengerActiveBookingProps {
  booking: {
    id: string;
    rideId: string;
    seats: number;
    totalPrice?: number | null;
    paymentStatus?: string | null;
    status: string;
    isPickedUp?: boolean;
    isDroppedOff?: boolean;
    driverArrivedAt?: string | null;
    pickedUpAt?: string | null;
    droppedOffAt?: string | null;
    createdAt?: string | null;
    passengerLat?: number | null;
    passengerLng?: number | null;
    pickupAddress?: string | null;
    dropoffLat?: number | null;
    dropoffLng?: number | null;
    dropoffAddress?: string | null;
    ride: {
      id: string;
      status: string;
      origin: string;
      destination: string;
      originLat?: number | null;
      originLng?: number | null;
      destinationLat?: number | null;
      destinationLng?: number | null;
      routePolyline?: string | null;
      distance?: number | null;
      distanceKm?: number | null;
      duration?: number | null;
      durationMinutes?: number | null;
      driverId: string;
      driver: {
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        avatarUrl?: string | null;
        avatar?: string | null;
        rating?: number | null;
        phone?: string | null;
      };
      vehicle?: {
        type?: string | null;
        model?: string | null;
        color?: string | null;
        licensePlate?: string | null;
      } | null;
    };
  };
  onBack?: () => void;
  onPayNow?: () => void;
  isPaying?: boolean;
  onConfirmPayment?: () => void;
  onOpenQrPayment?: () => void;
  isConfirmingPayment?: boolean;
  isCreatingPayment?: boolean;
  onCancelBooking?: () => void;
  isCancellingBooking?: boolean;
}

const MAP_EDGE_PADDING = { top: 96, right: 32, bottom: 260, left: 32 };

function toCoordinate(latitude?: number | null, longitude?: number | null): ActiveRideLatLng | null {
  if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
}

export function PassengerActiveBookingExperience({
  booking,
  onBack,
  onPayNow,
  isPaying = false,
  onConfirmPayment,
  onOpenQrPayment,
  isConfirmingPayment = false,
  isCreatingPayment = false,
  onCancelBooking,
  isCancellingBooking = false,
}: PassengerActiveBookingProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const connected = useSocketConnection();

  const mapRef = useRef<ActiveRideMapHandle>(null);
  const driverLocationRef = useRef<ActiveRideLatLng | null>(null);
  const lastRouteRefreshAtRef = useRef(0);
  const sheetPosition = useSharedValue(0);

  const [isMapCentered, setIsMapCentered] = useState(true);
  const [routeCoords, setRouteCoords] = useState<ActiveRideLatLng[]>([]);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(0);
  const [userLocation, setUserLocation] = useState<ActiveRideLatLng | null>(null);

  // Derive sub-state of journey
  const journeyState = useMemo(
    () => derivePassengerJourneyState(booking),
    [booking]
  );

  // Realtime Driver GPS via Socket
  const socketLocation = usePassengerTrackDriver(booking.rideId);

  // Fallback API query for driver coordinates
  const rideQuery = useQuery({
    queryKey: ['ride-live-location', booking.rideId],
    queryFn: () => rideService.getRideById(booking.rideId),
    refetchInterval: getRealtimeRefetchInterval(connected),
  });

  const pickup = useMemo(() =>
    toCoordinate(
      booking.passengerLat ?? booking.ride.originLat,
      booking.passengerLng ?? booking.ride.originLng,
    ),
    [booking.passengerLat, booking.passengerLng, booking.ride.originLat, booking.ride.originLng]
  );

  const dropoff = useMemo(() =>
    toCoordinate(
      booking.dropoffLat ?? booking.ride.destinationLat,
      booking.dropoffLng ?? booking.ride.destinationLng,
    ),
    [booking.dropoffLat, booking.dropoffLng, booking.ride.destinationLat, booking.ride.destinationLng]
  );

  const apiLocation = useMemo(() =>
    toCoordinate(rideQuery.data?.currentDriverLat, rideQuery.data?.currentDriverLng),
    [rideQuery.data?.currentDriverLat, rideQuery.data?.currentDriverLng]
  );

  const driverLocation = socketLocation ?? apiLocation;

  useEffect(() => {
    driverLocationRef.current = driverLocation;
  }, [driverLocation]);

  // Target of vehicle: if picked up -> head to dropoff; else head to pickup
  const target = booking.isPickedUp ? dropoff : pickup;
  const vehicleType = booking.ride.vehicle?.type === 'BIKE' ? 'bike' : 'car';

  // Decode stored route from backend
  const storedRoute = useMemo(() => {
    if (!booking.ride.routePolyline) return [];
    try {
      return decodePolyline(booking.ride.routePolyline).filter((point) =>
        Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
      );
    } catch {
      return [];
    }
  }, [booking.ride.routePolyline]);

  const [staticRoute, setStaticRoute] = useState<ActiveRideLatLng[]>(storedRoute);

  // Fetch static route pickup -> dropoff once
  useEffect(() => {
    if (!pickup || !dropoff) return;
    let cancelled = false;
    if (storedRoute.length > 1) setStaticRoute(storedRoute);

    void getDirections(pickup, dropoff, vehicleType).then((result) => {
      if (!cancelled && result && result.polylineCoords.length > 1) {
        setStaticRoute(result.polylineCoords);
      }
    });

    return () => { cancelled = true; };
  }, [dropoff, pickup, storedRoute, vehicleType]);

  // Dynamic route: driver -> target (refreshed throttled at 30s)
  const refreshRoute = useCallback(async (force = false) => {
    if (!target) return;
    if (!force && Date.now() - lastRouteRefreshAtRef.current < 30_000) return;

    const from = driverLocationRef.current ?? pickup;
    if (!from) return;
    lastRouteRefreshAtRef.current = Date.now();

    try {
      const result = await getDirections(from, target, vehicleType);
      if (result && result.polylineCoords.length > 1) {
        setRouteCoords(result.polylineCoords);
        setRouteDistance(result.distance);
        setRouteDuration(result.duration);
      }
    } catch (err) {
      console.warn('[PassengerActiveExperience] Route refresh error:', err);
    }
  }, [pickup, target, vehicleType]);

  useEffect(() => {
    lastRouteRefreshAtRef.current = 0;
    setRouteCoords([]);
    setRouteDistance(0);
    setRouteDuration(0);
    void refreshRoute(true);
  }, [refreshRoute, booking.isPickedUp]);

  useEffect(() => {
    if (driverLocation) void refreshRoute(false);
  }, [driverLocation, refreshRoute]);

  const etaMinutes = routeDuration > 0 ? Math.max(1, Math.ceil(routeDuration / 60)) : null;
  const distanceText = routeDistance > 0
    ? routeDistance < 1000
      ? `${Math.round(routeDistance)} m`
      : `${(routeDistance / 1000).toFixed(1)} km`
    : null;

  const fallbackOrigin: ActiveRideLatLng = pickup || { latitude: 21.0285, longitude: 105.8542 };
  const fallbackDestination: ActiveRideLatLng = dropoff || { latitude: 21.0368, longitude: 105.8342 };
  const visibleRoute = staticRoute.length > 1
    ? staticRoute
    : routeCoords.length > 1
      ? routeCoords
      : [fallbackOrigin, fallbackDestination];

  return (
    <View style={styles.container}>
      {/* ── Layer 1: Background Map ── */}
      <View style={StyleSheet.absoluteFill}>
        <ActiveRideMap
          ref={mapRef}
          originCoords={fallbackOrigin}
          destinationCoords={fallbackDestination}
          routeCoords={visibleRoute}
          driverLocation={driverLocation}
          userLocation={userLocation}
          onUserPan={() => setIsMapCentered(false)}
          originLabel={booking.pickupAddress || booking.ride.origin || 'Điểm đón'}
          destinationLabel={booking.dropoffAddress || booking.ride.destination || 'Điểm trả'}
          fitEdgePadding={MAP_EDGE_PADDING}
          autoFitRoute={true}
          fitRouteOnce={true}
          focusZoom={16}
          autoFocusDriver={false}
        />
      </View>

      {/* ── Floating Header: Back Button ── */}
      <View
        style={[
          styles.floatingHeader,
          { top: insets.top + spacing.xs },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => (onBack ? onBack() : router.back())}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Floating My Location Button ── */}
      <FloatingMyLocation
        animatedPosition={sheetPosition}
        isCentered={isMapCentered}
        onRecenter={(location) => {
          const coords = { latitude: location.latitude, longitude: location.longitude };
          setUserLocation(coords);
          mapRef.current?.recenter(coords);
          setIsMapCentered(true);
        }}
      />

      {/* ── Layer 2: Draggable Bottom Sheet (Exactly 3 Snap Points) ── */}
      <DraggableBottomSheet
        animatedPosition={sheetPosition}
        snapPoints={[0.34, 0.64, 0.94]}
        initialSnapIndex={0}
      >
        {/* Snap 1 Content: Status, Next Target, Compact Driver Card */}
        <PassengerBookingStatus
          journeyState={journeyState}
          connected={connected}
          etaMinutes={etaMinutes}
          distanceText={distanceText}
          dropoffAddress={booking.dropoffAddress || booking.ride.destination}
          pickupAddress={booking.pickupAddress || booking.ride.origin}
        />

        <PassengerDriverSummary
          rideId={booking.rideId}
          driver={booking.ride.driver}
          vehicle={booking.ride.vehicle}
        />

        {/* Snap 2 & 3 Expanded Content */}
        <PassengerBookingDetails
          booking={booking}
          journeyState={journeyState}
          onPayNow={onPayNow || onOpenQrPayment}
          isPaying={isPaying || isCreatingPayment}
          onCancelBooking={onCancelBooking}
          isCancellingBooking={isCancellingBooking}
        />
      </DraggableBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  floatingHeader: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...nativeShadows.floating,
  },
});
