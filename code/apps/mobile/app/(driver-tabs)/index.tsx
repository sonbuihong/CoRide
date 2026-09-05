/*
THESIS: Driver Home is a two-second operational scan, refusing a generic dashboard of equal-weight cards.
OWN-WORLD: Bright paper-white ground, CoRide emerald actions, navy headings, softly lifted 14–18px surfaces, one consistent outline icon family.
STORY: The driver sees availability, publishes a route, handles matching requests, confirms the next trip, then checks today and opens a tool.
FIRST VIEWPORT: Branded utility header, split greeting/road illustration hero, then a full-width emerald publish action before operational cards.
FORM: Reference-led mobile operating sheet; user-provided comp overrides roll seed 764d30c6.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday } from 'date-fns';
import { useRouter } from 'expo-router';
import {
  ArrowRight, CarFront, CircleAlert, Navigation, RefreshCw, Route, Users, X,
} from 'lucide-react-native';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SocketEvents } from '@repo/shared';

import type { DriverBookingSummary } from '../../src/services/booking.service';
import type { Ride } from '../../src/services/ride.service';
import type { DriverHomeActiveItem } from '../../src/utils/driver-home';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import {
  BookingRequestList, DriverHero, QuickToolsGrid,
  TodayOverviewStats, UpcomingTripCard, UpcomingTripEmpty,
} from '../../src/components/driver-home/DriverHomeSections';
import { useAuth } from '../../src/hooks/useAuth';
import { getRealtimeRefetchInterval, useSocketConnection } from '../../src/hooks/useSocketConnection';
import { bookingService } from '../../src/services/booking.service';
import { rideService } from '../../src/services/ride.service';
import { rideDraftService, type RideDraft } from '../../src/services/ride-draft.service';
import { socketService } from '../../src/services/socket.service';
import { useAppStore } from '../../src/stores/useAppStore';
import { tripService } from '../../src/services/trip.service';
import { colors, layout, radius, spacing } from '../../src/theme/tokens';
import {
  selectDriverHomeActiveItem, selectMatchingRequests, selectNextScheduledRide,
} from '../../src/utils/driver-home';

const QUERY_KEYS = [
  ['my-driver-rides'], ['driver-bookings'], ['active-booking'], ['active-driver-trip'],
] as const;

const RIDE_EVENTS = [
  SocketEvents.RIDE_CREATED, SocketEvents.RIDE_UPDATED, SocketEvents.RIDE_DELETED,
  SocketEvents.RIDE_STATUS_UPDATED, SocketEvents.RIDE_SEATS_UPDATED,
] as const;

const BOOKING_EVENTS = [
  SocketEvents.BOOKING_NEW_REQUEST, SocketEvents.BOOKING_CONFIRMED,
  SocketEvents.BOOKING_REJECTED, SocketEvents.BOOKING_PICKED_UP,
  SocketEvents.BOOKING_COMPLETED, SocketEvents.BOOKING_CANCELLED,
] as const;

const TRIP_EVENTS = [
  SocketEvents.TRIP_UPDATED,
] as const;

const EMPTY_RIDES: Ride[] = [];
const EMPTY_BOOKINGS: DriverBookingSummary[] = [];

function ActiveTripCard({ item, onPress }: { item: DriverHomeActiveItem; onPress: () => void }) {
  return (
    <View style={styles.activeCard}>
      <View style={styles.activeTopRow}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <AppText variant="caption" weight="semibold" className="text-white" style={styles.liveBadgeText}>{item.statusLabel}</AppText>
        </View>
        <Navigation size={22} color={colors.surface} strokeWidth={2} />
      </View>
      <AppText accessibilityRole="header" className="text-white" style={styles.activeTitle}>Chuyến đang hoạt động</AppText>
      {item.passengerLabel ? (
        <View style={styles.passengerLine}>
          <Users size={16} color="rgba(255,255,255,0.72)" />
          <AppText variant="bodySmall" className="text-white/75" style={styles.activeSecondary}>{item.passengerLabel}</AppText>
        </View>
      ) : null}
      <View style={styles.activeRoute}>
        <View style={styles.routeRail}>
          <View style={styles.originDot} /><View style={styles.routeLineDark} /><View style={styles.destinationDot} />
        </View>
        <View style={styles.routeCopy}>
          <AppText numberOfLines={1} className="text-white" style={styles.activeRouteText}>{item.origin}</AppText>
          <AppText numberOfLines={1} className="text-white" style={styles.activeRouteText}>{item.destination}</AppText>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.ctaLabel}. Mở màn hình điều hành chuyến`}
        onPress={onPress}
        style={({ pressed }) => [styles.activeButton, pressed && styles.activeButtonPressed]}
      >
        <AppText weight="semibold" style={styles.activeButtonText}>{item.ctaLabel}</AppText>
        <ArrowRight size={19} color={colors.driverSurface} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

function HomeSkeleton() {
  return (
    <View accessibilityLabel="Đang tải trang chủ tài xế" style={styles.skeletonStack}>
      <View style={styles.skeletonHero}>
        <SkeletonLoader height={18} width="36%" borderRadius={8} />
        <SkeletonLoader height={32} width="78%" borderRadius={10} />
        <SkeletonLoader height={64} width="100%" borderRadius={14} />
        <SkeletonLoader height={52} width="100%" borderRadius={14} />
      </View>
      <SkeletonLoader height={150} width="100%" borderRadius={18} />
      <SkeletonLoader height={172} width="100%" borderRadius={18} />
    </View>
  );
}

export default function DriverHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const appMode = useAppStore((state) => state.appMode);
  const isSocketConnected = useSocketConnection();
  const queriesEnabled = isAuthenticated && appMode === 'driver';
  const realtimeRefetchInterval = getRealtimeRefetchInterval(isSocketConnected);
  const previousSocketConnected = useRef(isSocketConnected);
  const hasObservedSocketConnection = useRef(isSocketConnected);
  const [draftPrompt, setDraftPrompt] = useState<RideDraft | null>(null);
  const [clearingDraft, setClearingDraft] = useState(false);
  const ridesQuery = useQuery({
    queryKey: ['my-driver-rides'], queryFn: rideService.getMyRides, enabled: queriesEnabled,
  });
  const bookingsQuery = useQuery({
    queryKey: ['driver-bookings'], queryFn: bookingService.getDriverBookings, enabled: queriesEnabled,
  });
  const activeBookingQuery = useQuery({
    queryKey: ['active-booking', 'driver'], queryFn: () => bookingService.getActiveBooking('driver'),
    enabled: queriesEnabled, refetchInterval: realtimeRefetchInterval,
  });
  const activeTripQuery = useQuery({
    queryKey: ['active-driver-trip'], queryFn: tripService.getActiveDriverTrip,
    enabled: queriesEnabled, refetchInterval: realtimeRefetchInterval,
  });

  const rides = ridesQuery.data ?? EMPTY_RIDES;
  const bookings = bookingsQuery.data?.bookings ?? EMPTY_BOOKINGS;
  const activeItem = useMemo(
    () => selectDriverHomeActiveItem(activeTripQuery.data, activeBookingQuery.data),
    [activeBookingQuery.data, activeTripQuery.data],
  );
  const nextRide = useMemo(
    () => selectNextScheduledRide(rides, activeItem?.rideId), [activeItem?.rideId, rides],
  );
  const matchingRequests = useMemo(() => selectMatchingRequests(bookings), [bookings]);

  const invalidateHome = useCallback(() => {
    QUERY_KEYS.forEach((queryKey) => void queryClient.invalidateQueries({
      queryKey: [...queryKey], refetchType: 'active',
    }));
  }, [queryClient]);

  useEffect(() => {
    if (!queriesEnabled) return;

    let active = true;
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    const pendingKeys = new Set<string>();
    const listeners: { event: string; handler: () => void }[] = [];

    const scheduleInvalidation = (queryKeys: readonly string[]) => {
      queryKeys.forEach((queryKey) => pendingKeys.add(queryKey));
      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = setTimeout(() => {
        if (!active) return;
        pendingKeys.forEach((queryKey) => void queryClient.invalidateQueries({
          queryKey: [queryKey], refetchType: 'active',
        }));
        pendingKeys.clear();
        flushTimer = null;
      }, 250);
    };

    const subscribe = (events: readonly string[], queryKeys: readonly string[]) => {
      events.forEach((event) => {
        const handler = () => scheduleInvalidation(queryKeys);
        listeners.push({ event, handler });
        socketService.on(event, handler);
      });
    };

    void socketService.connect().then(() => {
      if (!active) return;
      subscribe(RIDE_EVENTS, ['my-driver-rides']);
      subscribe(BOOKING_EVENTS, ['driver-bookings', 'active-booking', 'my-driver-rides']);
      subscribe(TRIP_EVENTS, ['active-driver-trip']);
    });
    return () => {
      active = false;
      if (flushTimer) clearTimeout(flushTimer);
      listeners.forEach(({ event, handler }) => socketService.off(event, handler));
    };
  }, [queriesEnabled, queryClient]);

  useEffect(() => {
    if (isSocketConnected) {
      if (hasObservedSocketConnection.current && !previousSocketConnected.current) invalidateHome();
      hasObservedSocketConnection.current = true;
    }
    previousSocketConnected.current = isSocketConnected;
  }, [invalidateHome, isSocketConnected]);

  const continueDraft = () => {
    setDraftPrompt(null);
    router.push('/ride/create' as never);
  };

  const createNewSchedule = async () => {
    if (clearingDraft) return;
    setClearingDraft(true);
    try {
      await rideDraftService.clear();
      setDraftPrompt(null);
      router.push('/ride/create' as never);
    } finally {
      setClearingDraft(false);
    }
  };

  const openSchedule = async () => {
    const draft = await rideDraftService.load();
    if (draft) {
      setDraftPrompt(draft);
      return;
    }
    router.push('/ride/create' as never);
  };

  const refreshAll = useCallback(async () => {
    await Promise.all([
      ridesQuery.refetch(), bookingsQuery.refetch(), activeBookingQuery.refetch(), activeTripQuery.refetch(),
    ]);
  }, [activeBookingQuery, activeTripQuery, bookingsQuery, ridesQuery]);

  const queries = [ridesQuery, bookingsQuery, activeBookingQuery, activeTripQuery];
  const isInitialLoading = queries.some((query) => query.isLoading);
  const isRefreshing = queries.some((query) => query.isRefetching);
  const hasError = queries.some((query) => query.isError);
  const todayRides = rides.filter((ride) => isToday(new Date(ride.departureTime)));
  const todayPassengers = todayRides.reduce((sum, ride) => sum + (ride.bookedSeats ?? Math.max(0, ride.totalSeats - ride.availableSeats)), 0);
  const todaySharedCost = todayRides.reduce((sum, ride) => sum + ride.price * (ride.bookedSeats ?? Math.max(0, ride.totalSeats - ride.availableSeats)), 0);

  return (
    <>
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl
        refreshing={isRefreshing && !isInitialLoading} onRefresh={refreshAll}
        tintColor={colors.navigationDriver} colors={[colors.navigationDriver]}
      />}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.content, { paddingTop: spacing.sm }]}>
        {isInitialLoading ? <HomeSkeleton /> : (
          <>
            {hasError ? (
              <View accessibilityRole="alert" style={styles.errorBanner}>
                <CircleAlert size={20} color={colors.danger} />
                <View style={styles.errorCopy}>
                  <AppText weight="semibold">Một số dữ liệu chưa tải được</AppText>
                  <AppText variant="caption">Kiểm tra kết nối mạng và thử làm mới.</AppText>
                </View>
                <Pressable
                  accessibilityRole="button" accessibilityLabel="Thử tải lại dữ liệu trang chủ"
                  onPress={refreshAll} style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}
                ><RefreshCw size={17} color={colors.textPrimary} /></Pressable>
              </View>
            ) : null}

            <DriverHero firstName={user?.firstName} onCreate={() => void openSchedule()} />
            {activeItem ? <View style={styles.section}><ActiveTripCard item={activeItem} onPress={() => router.push(activeItem.route as never)} /></View> : null}
            <BookingRequestList bookings={matchingRequests} onAll={() => router.push('/(driver-tabs)/requests' as never)} onOpen={(id) => router.push(`/booking/${id}` as never)} />
            {nextRide ? <UpcomingTripCard ride={nextRide} passengerCount={Math.max(0, nextRide.bookedSeats ?? nextRide.totalSeats - nextRide.availableSeats)} onAll={() => router.push('/ride/manage' as never)} onOpen={() => router.push(`/ride/${nextRide.id}` as never)} /> : <UpcomingTripEmpty onAll={() => router.push('/ride/manage' as never)} onCreate={() => void openSchedule()} />}
            <TodayOverviewStats rides={todayRides.length} passengers={todayPassengers} sharedCost={todaySharedCost} rating={user?.driverRating} onDetails={() => router.push('/ride/history' as never)} />
            <QuickToolsGrid onRequests={() => router.push('/(driver-tabs)/requests' as never)} onMessages={() => router.push('/(driver-tabs)/messages' as never)} onWallet={() => router.push('/profile/wallet' as never)} onVehicles={() => router.push('/profile/vehicles' as never)} />

            {activeItem && !nextRide && matchingRequests.length === 0 ? (
              <View style={styles.activeTailNote}>
                <CarFront size={20} color={colors.textTertiary} />
                <AppText variant="bodySmall" style={styles.noRideText}>
                  Tập trung hoàn thành chuyến hiện tại. Lịch trình mới sẽ xuất hiện ở đây.
                </AppText>
              </View>
            ) : null}
          </>
        )}
      </View>
    </ScrollView>
    <Modal
      animationType="fade"
      onRequestClose={() => setDraftPrompt(null)}
      statusBarTranslucent
      transparent
      visible={Boolean(draftPrompt)}
    >
      <View style={styles.modalBackdrop}>
        <View accessibilityViewIsModal style={styles.draftModal}>
          <Pressable
            accessibilityLabel="Để sau"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setDraftPrompt(null)}
            style={({ pressed }) => [styles.modalClose, pressed && styles.retryPressed]}
          >
            <X size={20} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.draftModalIcon}>
            <Route size={26} color={colors.navigationDriver} strokeWidth={2.2} />
          </View>
          <AppText accessibilityRole="header" style={styles.draftModalTitle}>
            Bạn có lịch trình đã lưu
          </AppText>
          <AppText style={styles.draftModalCopy}>
            {draftPrompt
              ? `Bản nháp ${draftPrompt.extras.selectedDates.length || 1} ngày được lưu lúc ${format(new Date(draftPrompt.savedAt), 'HH:mm · dd/MM/yyyy')}.`
              : ''}
          </AppText>
          <AppButton
            title="Tiếp tục đăng chuyến"
            variant="driver"
            onPress={continueDraft}
            style={styles.modalPrimary}
          />
          <AppButton
            title="Đặt lịch mới"
            variant="ghost"
            isLoading={clearingDraft}
            onPress={createNewSchedule}
            style={styles.modalSecondary}
          />
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: { backgroundColor: colors.background, flexGrow: 1, paddingBottom: spacing.xxxl },
  content: { alignSelf: 'center', maxWidth: layout.maxContentWidth, paddingHorizontal: spacing.md, paddingTop: spacing.lg, width: '100%' },
  errorBanner: { alignItems: 'center', backgroundColor: colors.dangerSoft, borderRadius: radius.input, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, padding: spacing.sm },
  errorCopy: { flex: 1, minWidth: 0 },
  retryButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, height: layout.minTouchTarget, justifyContent: 'center', width: layout.minTouchTarget },
  retryPressed: { backgroundColor: colors.navigationPressed },
  activeCard: { backgroundColor: colors.driverSurface, borderRadius: radius.card, elevation: 6, padding: spacing.lg, shadowColor: colors.driverSurface, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 20 },
  activeTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  liveBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, minHeight: 32, paddingHorizontal: spacing.sm },
  liveDot: { backgroundColor: colors.driverAccent, borderRadius: 5, height: 9, width: 9 },
  liveBadgeText: { color: colors.surface },
  activeTitle: { color: colors.surface, fontSize: 25, fontWeight: '600', letterSpacing: -0.4, lineHeight: 31, marginTop: spacing.lg },
  passengerLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  activeSecondary: { color: 'rgba(255,255,255,0.72)' },
  activeRoute: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.input, flexDirection: 'row', marginTop: spacing.lg, padding: spacing.md },
  routeRail: { alignItems: 'center', marginRight: spacing.sm, width: 16 },
  originDot: { backgroundColor: colors.driverAccent, borderRadius: 5, height: 10, width: 10 },
  routeLineDark: { backgroundColor: 'rgba(255,255,255,0.28)', flex: 1, marginVertical: 3, width: 1 },
  destinationDot: { backgroundColor: colors.mapDestination, borderRadius: 5, height: 10, width: 10 },
  routeCopy: { flex: 1, gap: spacing.md, minWidth: 0 },
  activeRouteText: { color: colors.surface, fontSize: 15, fontWeight: '500', lineHeight: 20 },
  activeButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.input, flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', marginTop: spacing.md, minHeight: 52, paddingHorizontal: spacing.md },
  activeButtonPressed: { backgroundColor: colors.driverAccentSoft },
  activeButtonText: { color: colors.driverSurface },
  section: { marginTop: spacing.xxl },
  noRideLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, paddingHorizontal: spacing.xs },
  noRideText: { color: colors.textSecondary, flex: 1 },
  activeTailNote: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.input, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.md },
  skeletonStack: { gap: spacing.xl },
  skeletonHero: { backgroundColor: colors.surface, borderRadius: radius.card, gap: spacing.md, padding: spacing.lg },
  modalBackdrop: { alignItems: 'center', backgroundColor: colors.scrim, flex: 1, justifyContent: 'center', padding: spacing.lg },
  draftModal: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, maxWidth: 420, padding: spacing.xl, paddingTop: spacing.xxl, width: '100%' },
  modalClose: { alignItems: 'center', borderRadius: radius.pill, height: layout.minTouchTarget, justifyContent: 'center', position: 'absolute', right: spacing.xs, top: spacing.xs, width: layout.minTouchTarget },
  draftModalIcon: { alignItems: 'center', backgroundColor: colors.navigationDriverSoft, borderRadius: radius.pill, height: 56, justifyContent: 'center', marginBottom: spacing.lg, width: 56 },
  draftModalTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '600', letterSpacing: -0.3, lineHeight: 28, textAlign: 'center' },
  draftModalCopy: { color: colors.textSecondary, lineHeight: 22, marginTop: spacing.xs, textAlign: 'center' },
  modalPrimary: { marginTop: spacing.xl, width: '100%' },
  modalSecondary: { marginTop: spacing.xs, width: '100%' },
});
