import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Headphones, MapPinned, Navigation, Share2, ShieldAlert } from 'lucide-react-native';
import { SocketEvents } from '@repo/shared';

import { ActiveRideMap, type ActiveRideMapHandle } from '../../src/components/ActiveRideMap';
import { DraggableBottomSheet } from '../../src/components/ui/DraggableBottomSheet';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { useDriverTracking } from '../../src/hooks/useDriverLocation';
import { getRealtimeRefetchInterval, useSocketConnection } from '../../src/hooks/useSocketConnection';
import { bookingService, type DriverBookingSummary } from '../../src/services/booking.service';
import { getDirections, getDirectionsThroughStops } from '../../src/services/direction.service';
import { rideService } from '../../src/services/ride.service';
import { socketService } from '../../src/services/socket.service';
import { colors, radius, spacing } from '../../src/theme/tokens';
import { showInfoDialog } from '../../src/utils/dialog';
import {
  type ActiveRideViewModel,
  type Coordinates,
  getConfirmedPassengers,
  getCurrentBooking,
  getDriverTripPhase,
  getNextStop,
  getTripStops,
} from '../../src/features/trip-flow/trip-flow';
import {
  TripBottomSheetContent,
  TripPrimaryAction,
} from '../../src/features/trip-flow/TripBottomSheet';
import { TripCompletionSheet } from '../../src/features/trip-flow/TripCompletionSheet';
import { TripFloatingControls } from '../../src/features/trip-flow/TripFloatingControls';

const SNAP_POINTS = [0.32, 0.6, 0.96] as const;

export default function ActiveRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: viewportHeight } = useWindowDimensions();
  const queryClient = useQueryClient();
  const connected = useSocketConnection();
  const mapRef = useRef<ActiveRideMapHandle>(null);
  const driverLocationRef = useRef<Coordinates | null>(null);
  const lastRouteRefreshAtRef = useRef(0);

  const [snapIndex, setSnapIndex] = useState(0);
  const [routeCoords, setRouteCoords] = useState<Coordinates[]>([]);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(0);
  const [showRecenter, setShowRecenter] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [dropoffArrived, setDropoffArrived] = useState(false);

  const activeQuery = useQuery({
    queryKey: ['active-booking', 'driver'],
    queryFn: () => bookingService.getActiveBooking('driver'),
    refetchInterval: getRealtimeRefetchInterval(connected),
  });

  const ride = (activeQuery.data?.ride ?? null) as ActiveRideViewModel | null;
  const rideId = ride?.id ?? null;
  const { currentLocation: driverLocation, permissionGranted } = useDriverTracking(rideId);
  const phase = getDriverTripPhase(ride);
  const currentBooking = getCurrentBooking(ride);
  const passengers = useMemo(() => getConfirmedPassengers(ride), [ride]);
  const pendingDropoffs = passengers.filter((booking) => !booking.isDroppedOff).length;

  useEffect(() => { driverLocationRef.current = driverLocation; }, [driverLocation]);
  useEffect(() => { setDropoffArrived(false); }, [currentBooking?.id, phase]);

  useEffect(() => {
    if (!rideId) return;
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['active-booking'] });
      void queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
    };
    socketService.emit(SocketEvents.RIDE_JOIN_ROOM, rideId);
    [
      SocketEvents.RIDE_STATUS_UPDATED,
      SocketEvents.BOOKING_DRIVER_ARRIVED,
      SocketEvents.BOOKING_PICKED_UP,
      SocketEvents.BOOKING_COMPLETED,
      SocketEvents.BOOKING_CONFIRMED,
      SocketEvents.BOOKING_CANCELLED,
      SocketEvents.RIDE_UPDATED,
    ].forEach((event) => socketService.on(event, refresh));

    return () => {
      socketService.emit(SocketEvents.RIDE_LEAVE_ROOM, rideId);
      [
        SocketEvents.RIDE_STATUS_UPDATED,
        SocketEvents.BOOKING_DRIVER_ARRIVED,
        SocketEvents.BOOKING_PICKED_UP,
        SocketEvents.BOOKING_COMPLETED,
        SocketEvents.BOOKING_CONFIRMED,
        SocketEvents.BOOKING_CANCELLED,
        SocketEvents.RIDE_UPDATED,
      ].forEach((event) => socketService.off(event, refresh));
    };
  }, [queryClient, rideId]);

  const originCoords = useMemo<Coordinates | null>(() =>
    ride?.originLat != null && ride.originLng != null
      ? { latitude: ride.originLat, longitude: ride.originLng }
      : null,
  [ride?.originLat, ride?.originLng]);
  const destinationCoords = useMemo<Coordinates | null>(() =>
    ride?.destinationLat != null && ride.destinationLng != null
      ? { latitude: ride.destinationLat, longitude: ride.destinationLng }
      : null,
  [ride?.destinationLat, ride?.destinationLng]);

  const nextStop = useMemo(() => ride ? getNextStop(ride) : null, [ride]);
  const nextStopCoordinate = nextStop?.coordinate ?? destinationCoords;

  const fetchRoute = useCallback(async () => {
    if (!originCoords || !destinationCoords) return;
    lastRouteRefreshAtRef.current = Date.now();
    const from = driverLocationRef.current || originCoords;
    const to = nextStopCoordinate || destinationCoords;
    try {
      const remainingStops = ride
        ? getTripStops(ride).filter((stop) => stop.state !== 'DONE' && stop.coordinate).map((stop) => stop.coordinate!)
        : [to];
      const itinerary = [from, ...remainingStops].filter((point, index, list) =>
        index === 0 || point.latitude !== list[index - 1].latitude || point.longitude !== list[index - 1].longitude,
      );
      const [currentLeg, fullRoute] = await Promise.all([
        getDirections(from, to),
        getDirectionsThroughStops(itinerary),
      ]);
      if (fullRoute) setRouteCoords(fullRoute.polylineCoords);
      else if (currentLeg) setRouteCoords(currentLeg.polylineCoords);
      if (currentLeg) {
        setRouteDistance(currentLeg.distance);
        setRouteDuration(currentLeg.duration);
      }
    } catch {
      setRouteCoords([from, to]);
    }
  }, [destinationCoords, nextStopCoordinate, originCoords, ride]);

  useEffect(() => { void fetchRoute(); }, [fetchRoute]);
  useEffect(() => {
    if (!driverLocation) return;
    if (routeCoords.length === 0 || Date.now() - lastRouteRefreshAtRef.current >= 30_000) {
      void fetchRoute();
    }
  }, [driverLocation, fetchRoute, routeCoords.length]);

  const stopMarkers = useMemo(() => {
    if (!ride) return [];
    return getTripStops(ride)
      .filter((stop) => stop.booking && stop.coordinate && stop.state !== 'DONE')
      .map((stop) => ({
        bookingId: stop.booking!.id,
        coordinate: stop.coordinate!,
        isActive: stop.state === 'CURRENT',
        kind: stop.kind === 'DROPOFF' ? 'DROPOFF' as const : 'PICKUP' as const,
        label: stop.title,
      }));
  }, [ride]);

  const invalidateTrip = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['active-booking'] }),
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['my-driver-rides'] }),
    ]);
  }, [queryClient]);

  const lifecycleMutation = useMutation({
    mutationFn: async () => {
      if (!ride) return;
      if (phase === 'READY_TO_START') return rideService.updateRideStatus(ride.id, 'ONGOING');
      if (!currentBooking) return;
      if (phase === 'ARRIVING_PICKUP') return bookingService.markDriverArrived(currentBooking.id);
      if (phase === 'WAITING_PASSENGER') return bookingService.confirmPickup(currentBooking.id);
      if (phase === 'EN_ROUTE_DROPOFF') return bookingService.dropoffPassenger(currentBooking.id);
    },
    onSuccess: async () => { await invalidateTrip(); },
    onError: (error: any) => showInfoDialog('Không thể cập nhật chuyến', error?.response?.data?.message || 'Vui lòng thử lại.'),
  });

  const completeMutation = useMutation({
    mutationFn: () => rideService.updateRideStatus(ride!.id, 'COMPLETED'),
    onSuccess: async () => {
      setCompletionVisible(false);
      await invalidateTrip();
      const total = passengers.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
      router.replace({ pathname: '/ride/completed', params: {
        rideId: ride!.id,
        distanceKm: String(ride!.distance || routeDistance / 1000 || 0),
        durationMinutes: String(ride!.duration || routeDuration / 60 || 0),
        passengers: String(passengers.length),
        total: String(total),
      }} as never);
    },
    onError: (error: any) => showInfoDialog('Không thể hoàn thành chuyến', error?.response?.data?.message || 'Vui lòng thử lại.'),
  });

  const handlePrimaryAction = useCallback(() => {
    if (phase === 'READY_TO_COMPLETE') {
      setCompletionVisible(true);
      return;
    }
    if (phase === 'EN_ROUTE_DROPOFF' && !dropoffArrived) {
      setDropoffArrived(true);
      return;
    }
    lifecycleMutation.mutate();
  }, [dropoffArrived, lifecycleMutation, phase]);

  const openNavigation = useCallback(() => {
    if (!nextStop) return;
    const destination = nextStop.coordinate
      ? `${nextStop.coordinate.latitude},${nextStop.coordinate.longitude}`
      : nextStop.address;
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    void Linking.openURL(url);
  }, [nextStop]);

  const openPassenger = useCallback((booking: DriverBookingSummary) => {
    router.push({ pathname: '/ride/passenger/[bookingId]', params: { bookingId: booking.id, rideId: ride!.id } } as never);
  }, [ride, router]);
  const openChat = useCallback((booking: DriverBookingSummary) => {
    router.push({ pathname: '/chat/[rideId]', params: {
      rideId: ride!.id,
      otherUserId: booking.passenger.id,
      otherUserName: [booking.passenger.firstName, booking.passenger.lastName].filter(Boolean).join(' '),
    }} as never);
  }, [ride, router]);

  if (activeQuery.isLoading) {
    return (
      <View style={styles.centeredPage}>
        <SkeletonLoader height="58%" borderRadius={0} />
        <View style={styles.loadingSheet}>
          <SkeletonLoader width={44} height={5} borderRadius={3} />
          <SkeletonLoader width="48%" height={22} className="mt-5" />
          <SkeletonLoader height={94} className="mt-4" borderRadius={18} />
        </View>
      </View>
    );
  }

  if (activeQuery.isError) {
    return (
      <View style={styles.emptyPage}>
        <ErrorState
          message="Không thể tải chuyến đang diễn ra. Dữ liệu cục bộ vẫn được giữ; hãy kiểm tra kết nối rồi thử lại."
          onRetry={() => void activeQuery.refetch()}
        />
      </View>
    );
  }

  if (!ride || !originCoords || !destinationCoords) {
    return (
      <View style={styles.emptyPage}>
        <MapPinned size={42} color={colors.textMuted} />
        <AppText variant="h2" weight="bold" style={styles.emptyTitle}>Không có chuyến đang diễn ra</AppText>
        <AppText style={styles.emptyCopy}>Khi bắt đầu một chuyến, lộ trình và hành khách sẽ xuất hiện tại đây.</AppText>
        <AppButton variant="driver" title="Về trang chủ" onPress={() => router.replace('/(driver-tabs)' as never)} style={styles.emptyButton} />
      </View>
    );
  }

  const recenterBottom = Math.round(viewportHeight * SNAP_POINTS[snapIndex]) + spacing.md;
  const reportPassenger = currentBooking || passengers[0];

  return (
    <View style={styles.desktopCanvas}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.phoneViewport}>
        <ActiveRideMap
          ref={mapRef}
          originCoords={originCoords}
          destinationCoords={destinationCoords}
          routeCoords={routeCoords}
          driverLocation={driverLocation}
          originLabel={ride.origin}
          destinationLabel={ride.destination}
          pickupMarkers={stopMarkers}
          onUserPan={() => setShowRecenter(true)}
        />

        <TripFloatingControls
          topInset={insets.top}
          connected={connected}
          showRecenter={showRecenter && snapIndex < 2}
          recenterBottom={recenterBottom}
          onBack={() => router.replace('/(driver-tabs)' as never)}
          onMenu={() => setMenuVisible(true)}
          onRecenter={() => {
            mapRef.current?.recenter(driverLocation);
            setShowRecenter(false);
          }}
        />

        {!permissionGranted && rideId ? (
          <View style={[styles.gpsBanner, { top: insets.top + 64 }]}>
            <AppText variant="bodySmall" weight="semibold" style={styles.gpsText}>Không thể xác định vị trí.</AppText>
            <Pressable onPress={() => void fetchRoute()} accessibilityRole="button"><AppText variant="bodySmall" weight="bold" style={styles.retryText}>Thử lại</AppText></Pressable>
          </View>
        ) : null}

        <DraggableBottomSheet
          snapPoints={[...SNAP_POINTS]}
          initialSnapIndex={0}
          onSnapChange={(index) => setSnapIndex(index)}
          footer={
            <View style={styles.sheetFooterRow}>
              {snapIndex === 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mở ứng dụng điều hướng"
                  onPress={openNavigation}
                  style={({ pressed }) => [styles.footerNavigate, pressed && styles.pressed]}
                >
                  <Navigation size={22} color={colors.info} />
                </Pressable>
              ) : null}
              <View style={styles.primaryActionWrap}>
                <TripPrimaryAction
                  phase={phase}
                  booking={currentBooking}
                  dropoffArrived={dropoffArrived}
                  isBusy={lifecycleMutation.isPending || completeMutation.isPending}
                  onPress={handlePrimaryAction}
                />
              </View>
            </View>
          }
        >
          <TripBottomSheetContent
            ride={ride}
            phase={phase}
            snapIndex={snapIndex}
            distance={routeDistance}
            duration={routeDuration}
            isBusy={lifecycleMutation.isPending}
            dropoffArrived={dropoffArrived}
            onPrimaryAction={handlePrimaryAction}
            onNavigate={openNavigation}
            onOpenRoute={() => router.push({ pathname: '/ride/route-detail', params: { rideId: ride.id } } as never)}
            onPassengerPress={openPassenger}
            onChat={openChat}
          />
        </DraggableBottomSheet>

        <TripCompletionSheet
          visible={completionVisible}
          pendingPassengerCount={pendingDropoffs}
          isLoading={completeMutation.isPending}
          onClose={() => setCompletionVisible(false)}
          onConfirm={() => completeMutation.mutate()}
        />

        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <Pressable style={styles.menuScrim} onPress={() => setMenuVisible(false)}>
            <View style={[styles.supportMenu, { marginTop: insets.top + 62 }]}>
              <AppText variant="title" weight="bold" style={styles.supportTitle}>Hỗ trợ chuyến đi</AppText>
              <SupportAction icon={<ShieldAlert size={20} color={colors.danger} />} label="Báo cáo sự cố" onPress={() => {
                setMenuVisible(false);
                if (!reportPassenger) return showInfoDialog('Chưa có hành khách', 'Chỉ có thể gửi báo cáo khi chuyến đã có hành khách.');
                router.push({ pathname: '/report-modal', params: { reportedId: reportPassenger.passenger.id, rideId: ride.id, context: 'driver-trip' } } as never);
              }} />
              <SupportAction icon={<Headphones size={20} color={colors.info} />} label="Liên hệ hỗ trợ" onPress={() => void Linking.openURL('mailto:support@coride.vn')} />
              <SupportAction icon={<Share2 size={20} color={colors.success} />} label="Chia sẻ chuyến đi" onPress={() => showInfoDialog('Chia sẻ chuyến đi', 'Tính năng chia sẻ liên kết an toàn đang được hoàn thiện.')} />
            </View>
          </Pressable>
        </Modal>
      </View>
    </View>
  );
}

function SupportAction({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.supportAction, pressed && styles.pressed]}>
      <View style={styles.supportIcon}>{icon}</View>
      <AppText weight="semibold" style={styles.supportLabel}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  desktopCanvas: { alignItems: 'center', backgroundColor: colors.driverSurface, flex: 1 },
  phoneViewport: { backgroundColor: colors.background, flex: 1, maxWidth: 480, overflow: 'hidden', width: '100%' },
  centeredPage: { alignSelf: 'center', backgroundColor: colors.background, flex: 1, maxWidth: 480, width: '100%' },
  loadingSheet: { alignItems: 'center', backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, flex: 1, padding: spacing.screen },
  emptyPage: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', maxWidth: 480, padding: spacing.screen, width: '100%' },
  emptyTitle: { marginTop: spacing.lg, textAlign: 'center' },
  emptyCopy: { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  emptyButton: { marginTop: spacing.xl, minWidth: 220 },
  gpsBanner: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.warningSoft, borderRadius: radius.full, flexDirection: 'row', gap: spacing.md, minHeight: 40, paddingHorizontal: spacing.md, position: 'absolute', zIndex: 25 },
  gpsText: { color: colors.warning },
  retryText: { color: colors.info },
  sheetFooterRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  footerNavigate: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: colors.info, borderRadius: radius.input, borderWidth: 1, height: 52, justifyContent: 'center', width: 52 },
  primaryActionWrap: { flex: 1 },
  menuScrim: { alignItems: 'flex-end', backgroundColor: 'rgba(15,23,42,0.18)', flex: 1, paddingHorizontal: spacing.md },
  supportMenu: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.sm, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 16, width: 250 },
  supportTitle: { paddingHorizontal: spacing.sm, paddingVertical: spacing.md },
  supportAction: { alignItems: 'center', borderRadius: radius.input, flexDirection: 'row', minHeight: 52, paddingHorizontal: spacing.sm },
  supportIcon: { alignItems: 'center', justifyContent: 'center', width: 38 },
  supportLabel: { flex: 1, marginLeft: spacing.xs },
  pressed: { backgroundColor: colors.surfaceSecondary, opacity: 0.78 },
});
