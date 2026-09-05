import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Clock3, LocateFixed, MapPin, Navigation } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';

import {
  ActiveRideMap,
  type ActiveRideLatLng,
  type ActiveRideMapHandle,
} from '../../components/ActiveRideMap';
import { AppText } from '../../components/ui/AppText';
import { usePassengerTrackDriver } from '../../hooks/useDriverLocation';
import { getRealtimeRefetchInterval, useSocketConnection } from '../../hooks/useSocketConnection';
import { decodePolyline, getDirections } from '../../services/direction.service';
import { rideService } from '../../services/ride.service';
import { colors, radius, spacing } from '../../theme/tokens';

interface LiveBookingMapProps {
  booking: {
    rideId: string;
    isPickedUp?: boolean;
    driverArrivedAt?: string | null;
    passengerLat?: number | null;
    passengerLng?: number | null;
    pickupAddress?: string | null;
    dropoffLat?: number | null;
    dropoffLng?: number | null;
    dropoffAddress?: string | null;
    ride: {
      origin: string;
      destination: string;
      originLat?: number | null;
      originLng?: number | null;
      destinationLat?: number | null;
      destinationLng?: number | null;
      routePolyline?: string | null;
      vehicle?: { type?: string } | null;
    };
  };
}

const BOOKING_ROUTE_PADDING = { top: 44, right: 32, bottom: 132, left: 32 };

function toCoordinate(latitude?: number | null, longitude?: number | null): ActiveRideLatLng | null {
  if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
}

export function LiveBookingMap({ booking }: LiveBookingMapProps) {
  const connected = useSocketConnection();
  const mapRef = useRef<ActiveRideMapHandle>(null);
  const driverLocationRef = useRef<ActiveRideLatLng | null>(null);
  const lastRouteRefreshAtRef = useRef(0);
  const [routeCoords, setRouteCoords] = useState<ActiveRideLatLng[]>([]);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<ActiveRideLatLng | null>(null);
  const locationRequest = useRef(0);

  useEffect(() => () => { locationRequest.current += 1; }, []);

  const recenterOnUser = async () => {
    if (locating) return;
    const request = ++locationRequest.current;
    setLocating(true);
    setLocationError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Cho phép truy cập vị trí để đưa bản đồ về chỗ bạn.');
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (request !== locationRequest.current) return;
      const coordinate = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setUserLocation(coordinate);
      mapRef.current?.recenter(coordinate);
    } catch (error) {
      if (request === locationRequest.current) {
        setLocationError(error instanceof Error && error.message.startsWith('Cho phép')
          ? error.message : 'Chưa lấy được vị trí. Hãy bật GPS và thử lại.');
      }
    } finally {
      if (request === locationRequest.current) setLocating(false);
    }
  };

  const socketLocation = usePassengerTrackDriver(booking.rideId);
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
  [booking.passengerLat, booking.passengerLng, booking.ride.originLat, booking.ride.originLng]);

  const dropoff = useMemo(() =>
    toCoordinate(
      booking.dropoffLat ?? booking.ride.destinationLat,
      booking.dropoffLng ?? booking.ride.destinationLng,
    ),
  [booking.dropoffLat, booking.dropoffLng, booking.ride.destinationLat, booking.ride.destinationLng]);

  const apiLocation = useMemo(() =>
    toCoordinate(rideQuery.data?.currentDriverLat, rideQuery.data?.currentDriverLng),
  [rideQuery.data?.currentDriverLat, rideQuery.data?.currentDriverLng]);
  const driverLocation = socketLocation ?? apiLocation;
  const target = booking.isPickedUp ? dropoff : pickup;

  useEffect(() => {
    driverLocationRef.current = driverLocation;
  }, [driverLocation]);

  // --------------------------------------------------------------------------
  // Static route: fetch pickup -> dropoff ngay khi co toa do, khong cho GPS tai xe.
  // Day la tuyen duong thuc te cua chuyen di, luon hien thi bat ke trang thai tai xe.
  // --------------------------------------------------------------------------
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
  const vehicleType = booking.ride.vehicle?.type === 'BIKE' ? 'bike' : 'car';

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

  // --------------------------------------------------------------------------
  // Dynamic route: cap nhat theo vi tri thuc te cua tai xe (driver -> target).
  // Dung pickup lam fallback origin khi chua co GPS tai xe.
  // --------------------------------------------------------------------------
  const refreshRoute = useCallback(async (force = false) => {
    if (!target) return;
    if (!force && Date.now() - lastRouteRefreshAtRef.current < 30_000) return;

    // Uu tien vi tri tai xe, fallback sang pickup de ve route tinh dep hon
    const from = driverLocationRef.current ?? pickup;
    if (!from) return;
    lastRouteRefreshAtRef.current = Date.now();
    setRouteLoading(true);
    try {
      const result = await getDirections(from, target, vehicleType);
      if (result && result.polylineCoords.length > 1) {
        setRouteCoords(result.polylineCoords);
        setRouteDistance(result.distance);
        setRouteDuration(result.duration);
      }
      // Khong fallback ve duong thang — staticRoute da dam nhiem vai tro do
    } finally {
      setRouteLoading(false);
    }
  }, [pickup, target, vehicleType]);

  useEffect(() => {
    lastRouteRefreshAtRef.current = 0;
    setRouteCoords([]);
    setRouteDistance(0);
    setRouteDuration(0);
    void refreshRoute(true);
  }, [refreshRoute]);

  useEffect(() => {
    if (driverLocation) void refreshRoute(false);
  }, [driverLocation, refreshRoute]);

  const status = booking.isPickedUp
    ? { title: 'Đang đến điểm trả', detail: 'Theo dõi hành trình của bạn theo thời gian thực' }
    : booking.driverArrivedAt
      ? { title: 'Tài xế đã đến điểm đón', detail: 'Hãy kiểm tra xe và biển số trước khi lên xe' }
      : driverLocation
        ? { title: 'Tài xế đang đến đón bạn', detail: connected ? 'Vị trí đang được cập nhật trực tiếp' : 'Đang dùng vị trí gần nhất' }
        : { title: 'Đang chờ vị trí tài xế', detail: 'Bản đồ sẽ tự cập nhật khi nhận được tín hiệu GPS' };

  const etaMinutes = routeDuration > 0 ? Math.max(1, Math.ceil(routeDuration / 60)) : null;
  const distanceText = routeDistance > 0
    ? routeDistance < 1000
      ? `${Math.round(routeDistance)} m`
      : `${(routeDistance / 1000).toFixed(1)} km`
    : null;

  if (!pickup || !dropoff) {
    return (
      <View style={styles.unavailable} accessibilityRole="summary">
        <View style={styles.unavailableIcon}><MapPin size={22} color={colors.info} /></View>
        <View style={styles.flex}>
          <AppText weight="bold" style={styles.statusTitle}>Chưa thể hiển thị bản đồ</AppText>
          <AppText variant="bodySmall" style={styles.statusDetail}>Chuyến đi chưa có đủ tọa độ điểm đón và điểm trả.</AppText>
        </View>
      </View>
    );
  }

  // Thu tu uu tien visibleRoute:
  // 1. routeCoords — route tu vi tri tai xe → target (chinh xac nhat, cap nhat theo GPS)
  // 2. staticRoute — route pickup → dropoff tu Goong (hien thi ngay khi mount, khong can tai xe)
  // 3. [pickup, dropoff] — last-resort neu Goong chua co ket qua
  const visibleRoute = staticRoute.length > 1
    ? staticRoute
    : routeCoords.length > 1
      ? routeCoords
      : [pickup, dropoff];
  const hasApiRoute = staticRoute.length > 1 || routeCoords.length > 1;

  return (
    <View style={styles.section}>
      <View style={styles.mapFrame}>
        <ActiveRideMap
          ref={mapRef}
          originCoords={pickup}
          destinationCoords={dropoff}
          routeCoords={visibleRoute}
          driverLocation={driverLocation}
          userLocation={userLocation}
          onUserPan={() => {
            locationRequest.current += 1;
            setLocating(false);
          }}
          originLabel={booking.pickupAddress || booking.ride.origin || 'Điểm đón của bạn'}
          destinationLabel={booking.dropoffAddress || booking.ride.destination || 'Điểm trả của bạn'}
          fitEdgePadding={BOOKING_ROUTE_PADDING}
          autoFitRoute={hasApiRoute}
          fitRouteOnce
          focusZoom={16}
          autoFocusDriver={false}
        />

        <View style={styles.liveBadge} pointerEvents="none">
          <View style={[styles.liveDot, !connected && styles.liveDotOffline]} />
          <AppText variant="caption" weight="bold" style={styles.liveBadgeText}>
            {connected ? 'TRỰC TIẾP' : 'ĐANG KẾT NỐI'}
          </AppText>
        </View>

        <Pressable
          onPress={() => { void recenterOnUser(); }}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel="Đưa bản đồ về vị trí của bạn"
          accessibilityHint="Lấy vị trí hiện tại của bạn và giữ nguyên mức thu phóng"
          accessibilityState={{ disabled: locating, busy: locating }}
          style={({ pressed }) => [styles.recenterButton, pressed && styles.pressed]}
        >
          {locating ? <ActivityIndicator color={colors.info} /> : <LocateFixed size={22} color={colors.info} />}
        </Pressable>

        <View style={styles.summaryCard} accessibilityRole="summary">
          {locationError ? <AppText variant="bodySmall" accessibilityRole="alert" style={{ color: colors.danger }}>{locationError}</AppText> : null}
          <View style={styles.summaryTopRow}>
            <View style={styles.statusIcon}>
              <Navigation size={18} color={colors.info} fill={colors.info} />
            </View>
            <View style={styles.flex}>
              <AppText weight="bold" style={styles.statusTitle}>{status.title}</AppText>
              <AppText variant="bodySmall" numberOfLines={2} style={styles.statusDetail}>{status.detail}</AppText>
            </View>
            {routeLoading ? <ActivityIndicator size="small" color={colors.info} /> : null}
          </View>

          {(etaMinutes || distanceText) ? (
            <View style={styles.metricsRow}>
              {etaMinutes ? (
                <View style={styles.metric}>
                  <Clock3 size={15} color={colors.info} />
                  <AppText weight="bold" style={styles.metricValue}>~{etaMinutes} phút</AppText>
                </View>
              ) : null}
              {distanceText ? (
                <View style={styles.metric}>
                  <MapPin size={15} color={colors.mapPickup} />
                  <AppText weight="bold" style={styles.metricValue}>{distanceText} còn lại</AppText>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { backgroundColor: colors.background, paddingBottom: spacing.sm },
  mapFrame: {
    height: 352,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: radius.sheet,
    backgroundColor: colors.border,
  },
  liveBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    position: 'absolute',
    top: spacing.sm,
  },
  liveDot: { backgroundColor: colors.success, borderRadius: 5, height: 8, marginRight: spacing.xs, width: 8 },
  liveDotOffline: { backgroundColor: colors.warning },
  liveBadgeText: { color: colors.textPrimary, letterSpacing: 0.4 },
  recenterButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.sm,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    top: spacing.sm,
    width: 48,
    elevation: 4,
  },
  pressed: { opacity: 0.72 },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.card,
    borderWidth: 1,
    bottom: spacing.sm,
    left: spacing.sm,
    padding: spacing.md,
    position: 'absolute',
    right: spacing.sm,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryTopRow: { alignItems: 'center', flexDirection: 'row' },
  statusIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 40,
  },
  statusTitle: { color: colors.textPrimary, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  statusDetail: { color: colors.textSecondary, marginTop: 2, fontSize: 13, lineHeight: 18 },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginLeft: 48,
    marginTop: spacing.sm,
  },
  metric: {
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    gap: spacing.xs,
  },
  metricValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  unavailable: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    margin: spacing.screen,
    padding: spacing.lg,
  },
  unavailableIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 48,
  },
});
