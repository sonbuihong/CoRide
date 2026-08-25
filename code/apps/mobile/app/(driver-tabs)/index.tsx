import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isTomorrow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import {
  ArrowRight, CalendarClock, CarFront, ChevronRight, CircleAlert, Clock3,
  LocateFixed, Navigation, Plus, RefreshCw, Route, Users, Wifi, WifiOff, X,
} from 'lucide-react-native';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SocketEvents } from '@repo/shared';

import type { DriverBookingSummary } from '../../src/services/booking.service';
import type { Ride } from '../../src/services/ride.service';
import type { DriverHomeActiveItem } from '../../src/utils/driver-home';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import { useAuth } from '../../src/hooks/useAuth';
import { useDriverAvailability } from '../../src/hooks/useDriverAvailability';
import { bookingService } from '../../src/services/booking.service';
import { rideService } from '../../src/services/ride.service';
import { rideDraftService, type RideDraft } from '../../src/services/ride-draft.service';
import { socketService } from '../../src/services/socket.service';
import { tripService } from '../../src/services/trip.service';
import { colors, layout, radius, spacing, typography } from '../../src/theme/tokens';
import {
  selectDriverHomeActiveItem, selectMatchingRequests, selectNextScheduledRide,
} from '../../src/utils/driver-home';

const QUERY_KEYS = [
  ['my-driver-rides'], ['driver-bookings'], ['active-booking'], ['active-driver-trip'],
] as const;

const HOME_EVENTS = [
  SocketEvents.RIDE_CREATED, SocketEvents.RIDE_UPDATED, SocketEvents.RIDE_DELETED,
  SocketEvents.RIDE_STATUS_UPDATED, SocketEvents.RIDE_SEATS_UPDATED,
  SocketEvents.BOOKING_NEW_REQUEST, SocketEvents.BOOKING_CONFIRMED,
  SocketEvents.BOOKING_REJECTED, SocketEvents.BOOKING_PICKED_UP,
  SocketEvents.BOOKING_COMPLETED, SocketEvents.TRIP_UPDATED,
  SocketEvents.TRIP_CANCELLED, SocketEvents.TRIP_STATUS_UPDATE,
] as const;

const EMPTY_RIDES: Ride[] = [];
const EMPTY_BOOKINGS: DriverBookingSummary[] = [];

const currency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

function departureLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa xác định thời gian';
  if (isToday(date)) return `Hôm nay · ${format(date, 'HH:mm')}`;
  if (isTomorrow(date)) return `Ngày mai · ${format(date, 'HH:mm')}`;
  return format(date, "EEE, dd/MM · HH:mm", { locale: vi });
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText accessibilityRole="header" style={styles.sectionTitle}>{title}</AppText>
      {action && onAction ? (
        <Pressable
          accessibilityRole="button" accessibilityLabel={action} hitSlop={8}
          onPress={onAction}
          style={({ pressed }) => [styles.sectionAction, pressed && styles.sectionActionPressed]}
        >
          <AppText variant="bodySmall" weight="semibold" style={styles.sectionActionText}>{action}</AppText>
          <ChevronRight size={16} color={colors.navigationDriver} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ActiveTripCard({ item, onPress }: { item: DriverHomeActiveItem; onPress: () => void }) {
  return (
    <View style={styles.activeCard}>
      <View style={styles.activeTopRow}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <AppText variant="caption" weight="semibold" style={styles.liveBadgeText}>{item.statusLabel}</AppText>
        </View>
        <Navigation size={22} color={colors.surface} strokeWidth={2} />
      </View>
      <AppText accessibilityRole="header" style={styles.activeTitle}>Chuyến đang hoạt động</AppText>
      {item.passengerLabel ? (
        <View style={styles.passengerLine}>
          <Users size={16} color="rgba(255,255,255,0.72)" />
          <AppText variant="bodySmall" style={styles.activeSecondary}>{item.passengerLabel}</AppText>
        </View>
      ) : null}
      <View style={styles.activeRoute}>
        <View style={styles.routeRail}>
          <View style={styles.originDot} /><View style={styles.routeLineDark} /><View style={styles.destinationDot} />
        </View>
        <View style={styles.routeCopy}>
          <AppText numberOfLines={1} style={styles.activeRouteText}>{item.origin}</AppText>
          <AppText numberOfLines={1} style={styles.activeRouteText}>{item.destination}</AppText>
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

function AvailabilityRow({ isOnline, isChanging, onPress }: {
  isOnline: boolean; isChanging: boolean; onPress: () => void;
}) {
  return (
    <View style={styles.availabilityRow}>
      <View style={[styles.availabilityIcon, isOnline && styles.availabilityIconOnline]}>
        {isOnline
          ? <Wifi size={20} color={colors.navigationDriver} strokeWidth={2.2} />
          : <WifiOff size={20} color={colors.textSecondary} strokeWidth={2.2} />}
      </View>
      <View style={styles.availabilityCopy}>
        <AppText weight="semibold">{isOnline ? 'Đang trực tuyến' : 'Bạn đang ngoại tuyến'}</AppText>
        <AppText variant="caption">
          {isOnline ? 'Sẵn sàng nhận yêu cầu gần bạn' : 'Bật trực tuyến để nhận chuyến nhanh'}
        </AppText>
      </View>
      <AppButton
        title={isOnline ? 'Tắt' : 'Bật ngay'} variant={isOnline ? 'outline' : 'driver'}
        isLoading={isChanging} onPress={onPress} className="min-h-[48px] px-4 py-2"
      />
    </View>
  );
}

function PublishHero({ firstName, onPress }: { firstName?: string; onPress: () => void }) {
  return (
    <View style={styles.introSection}>
      <AppText accessibilityRole="header" style={styles.pageTitle}>
        {firstName ? `Chào ${firstName}, hôm nay bạn muốn đi đâu?` : 'Hôm nay bạn muốn đi đâu?'}
      </AppText>
      <AppText style={styles.pageSubtitle}>
        Đăng hành trình của bạn để tìm hành khách phù hợp và chia sẻ chi phí.
      </AppText>
      <Pressable
        accessibilityRole="button" accessibilityLabel="Đăng chuyến đi mới" onPress={onPress}
        style={({ pressed }) => [styles.publishButton, pressed && styles.publishButtonPressed]}
      >
        <View style={styles.publishIcon}><Plus size={23} color={colors.surface} strokeWidth={2.5} /></View>
        <View style={styles.publishCopy}>
          <AppText weight="semibold" style={styles.publishTitle}>Đăng chuyến đi</AppText>
          <AppText variant="bodySmall" style={styles.publishSubtitle}>Chia sẻ ghế trống trên hành trình sắp tới</AppText>
        </View>
        <ChevronRight size={22} color={colors.surface} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

function NextRideCard({ ride, pendingCount, onPress }: { ride: Ride; pendingCount: number; onPress: () => void }) {
  const availableSeats = ride.availableSeats ?? Math.max(0, (ride.totalSeats ?? 0) - (ride.bookedSeats ?? 0));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chuyến tiếp theo đến ${ride.destination}. ${departureLabel(ride.departureTime)}`}
      onPress={onPress} style={({ pressed }) => [styles.nextRideCard, pressed && styles.cardPressed]}
    >
      <View style={styles.nextRideTop}>
        <View style={styles.calendarBadge}><CalendarClock size={21} color={colors.navigationDriver} strokeWidth={2.2} /></View>
        <View style={styles.nextRideTime}>
          <AppText weight="semibold">{departureLabel(ride.departureTime)}</AppText>
          <AppText variant="caption">{availableSeats} ghế trống</AppText>
        </View>
        <ChevronRight size={20} color={colors.textTertiary} />
      </View>
      <View style={styles.lightRoute}>
        <View style={styles.routeRail}>
          <View style={styles.originDotLight} /><View style={styles.routeLineLight} /><View style={styles.destinationDotLight} />
        </View>
        <View style={styles.routeCopy}>
          <AppText numberOfLines={1} weight="semibold">{ride.departure || ride.origin || 'Điểm khởi hành'}</AppText>
          <AppText numberOfLines={1} weight="semibold">{ride.destination}</AppText>
        </View>
      </View>
      {pendingCount > 0 ? (
        <View style={styles.pendingStrip}>
          <CircleAlert size={16} color={colors.warning} strokeWidth={2.2} />
          <AppText variant="bodySmall" weight="semibold" style={styles.pendingText}>
            {pendingCount} yêu cầu ghép chuyến đang chờ
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

function MatchingRequestCard({ booking, onPress }: { booking: DriverBookingSummary; onPress: () => void }) {
  const name = [booking.passenger.firstName, booking.passenger.lastName].filter(Boolean).join(' ') || 'Hành khách CoRide';
  const detour = booking.detourKm ?? booking.matching?.detourKm ?? 0;
  const pickup = booking.matching?.pickupDistanceKm;
  const dropoff = booking.matching?.dropoffDistanceKm;
  const matchLabel = booking.matching?.matchScore != null
    ? `Phù hợp ${booking.matching.matchScore}%`
    : 'Yêu cầu mới';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Yêu cầu ghép chuyến của ${name}. Thêm ${detour.toFixed(1)} ki-lô-mét`}
      onPress={onPress} style={({ pressed }) => [styles.requestCard, pressed && styles.cardPressed]}
    >
      <View style={styles.requestHeader}>
        <View style={styles.avatarFallback}>
          <AppText weight="semibold" style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</AppText>
        </View>
        <View style={styles.requestIdentity}>
          <AppText weight="semibold" numberOfLines={1}>{name}</AppText>
          <AppText variant="caption">{booking.seats} ghế · {matchLabel}</AppText>
        </View>
        <AppText weight="semibold" style={styles.requestPrice}>{currency(booking.totalPrice ?? 0)}</AppText>
      </View>
      <View style={styles.requestRouteRow}>
        <Route size={18} color={colors.textSecondary} strokeWidth={2} />
        <View style={styles.requestRouteCopy}>
          <AppText variant="bodySmall" weight="medium" numberOfLines={1}>
            {booking.pickupAddress || booking.ride.origin}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>Đến {booking.dropoffAddress || booking.ride.destination}</AppText>
        </View>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metricPill}>
          <LocateFixed size={14} color={colors.navigationDriver} />
          <AppText variant="caption" weight="semibold" style={styles.metricText}>+{detour.toFixed(1)} km</AppText>
        </View>
        <View style={styles.metricPill}>
          <Clock3 size={14} color={colors.navigationDriver} />
          <AppText variant="caption" weight="semibold" style={styles.metricText}>+{booking.additionalTimeMinutes ?? 0} phút</AppText>
        </View>
        {pickup != null && dropoff != null ? (
          <AppText variant="caption" style={styles.deviationText}>Đón {pickup.toFixed(1)} · Trả {dropoff.toFixed(1)} km</AppText>
        ) : null}
      </View>
      <View style={styles.requestFooter}>
        <AppText variant="bodySmall" weight="semibold" style={styles.viewRequestText}>Xem yêu cầu</AppText>
        <ArrowRight size={17} color={colors.navigationDriver} strokeWidth={2.2} />
      </View>
    </Pressable>
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
  const { user } = useAuth();
  const [draftPrompt, setDraftPrompt] = useState<RideDraft | null>(null);
  const [clearingDraft, setClearingDraft] = useState(false);
  const { isOnline, isChanging, goOnline, goOffline } = useDriverAvailability();
  const ridesQuery = useQuery({ queryKey: ['my-driver-rides'], queryFn: rideService.getMyRides });
  const bookingsQuery = useQuery({ queryKey: ['driver-bookings'], queryFn: bookingService.getDriverBookings });
  const activeBookingQuery = useQuery({
    queryKey: ['active-booking'], queryFn: bookingService.getActiveBooking, refetchInterval: 10_000,
  });
  const activeTripQuery = useQuery({
    queryKey: ['active-driver-trip'], queryFn: tripService.getActiveDriverTrip, refetchInterval: 10_000,
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
  const allPendingCount = bookings.filter((booking) => booking.status === 'PENDING').length;
  const nextRidePendingCount = nextRide
    ? bookings.filter((booking) => booking.ride.id === nextRide.id && booking.status === 'PENDING').length
    : 0;

  const invalidateHome = useCallback(() => {
    QUERY_KEYS.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey: [...queryKey] }));
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    void socketService.connect().then(() => {
      if (active) HOME_EVENTS.forEach((event) => socketService.on(event, invalidateHome));
    });
    return () => {
      active = false;
      HOME_EVENTS.forEach((event) => socketService.off(event, invalidateHome));
    };
  }, [invalidateHome]);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    void rideDraftService.load().then((draft) => {
      if (mounted && draft) setDraftPrompt(draft);
    });
    return () => { mounted = false; };
  }, [user?.id]);

  const continueDraft = () => {
    setDraftPrompt(null);
    router.push('/ride/create' as never);
  };

  const deleteDraft = async () => {
    if (clearingDraft) return;
    setClearingDraft(true);
    try {
      await rideDraftService.clear();
      setDraftPrompt(null);
    } finally {
      setClearingDraft(false);
    }
  };

  const refreshAll = useCallback(async () => {
    await Promise.all([
      ridesQuery.refetch(), bookingsQuery.refetch(), activeBookingQuery.refetch(), activeTripQuery.refetch(),
    ]);
  }, [activeBookingQuery, activeTripQuery, bookingsQuery, ridesQuery]);

  const handleAvailability = useCallback(async () => {
    if (isOnline) { goOffline(); return; }
    try {
      const enabled = await goOnline();
      if (!enabled) {
        Alert.alert('Cần quyền vị trí', 'Hãy cho phép CoRide truy cập vị trí để nhận chuyến gần mình.');
      }
    } catch {
      Alert.alert('Không thể bật trực tuyến', 'Vui lòng kiểm tra GPS và kết nối mạng rồi thử lại.');
    }
  }, [goOffline, goOnline, isOnline]);

  const queries = [ridesQuery, bookingsQuery, activeBookingQuery, activeTripQuery];
  const isInitialLoading = queries.some((query) => query.isLoading);
  const isRefreshing = queries.some((query) => query.isRefetching);
  const hasError = queries.some((query) => query.isError);

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
      <View style={styles.content}>
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

            {activeItem ? (
              <ActiveTripCard item={activeItem} onPress={() => router.push(activeItem.route as never)} />
            ) : (
              <>
                <PublishHero firstName={user?.firstName} onPress={() => router.push('/(driver-tabs)/publish' as never)} />
                <AvailabilityRow isChanging={isChanging} isOnline={isOnline} onPress={handleAvailability} />
              </>
            )}

            {nextRide ? (
              <View style={styles.section}>
                <SectionHeader title="Chuyến tiếp theo" action="Xem tất cả" onAction={() => router.push('/ride/manage' as never)} />
                <NextRideCard
                  ride={nextRide} pendingCount={nextRidePendingCount}
                  onPress={() => router.push(`/ride/${nextRide.id}` as never)}
                />
              </View>
            ) : !activeItem ? (
              <View style={styles.noRideLine}>
                <CalendarClock size={19} color={colors.textTertiary} />
                <AppText variant="bodySmall" style={styles.noRideText}>Bạn chưa có chuyến nào sắp tới.</AppText>
              </View>
            ) : null}

            {matchingRequests.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader
                  title="Yêu cầu phù hợp" action={allPendingCount > 3 ? 'Xem tất cả' : undefined}
                  onAction={() => router.push('/(driver-tabs)/requests' as never)}
                />
                <View style={styles.requestList}>
                  {matchingRequests.map((booking) => (
                    <MatchingRequestCard
                      key={booking.id} booking={booking}
                      onPress={() => router.push(`/booking/${booking.id}` as never)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

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
            Bạn có chuyến đang soạn
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
            title="Xóa bản nháp"
            variant="ghost"
            isLoading={clearingDraft}
            onPress={deleteDraft}
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
  introSection: { paddingTop: spacing.xs },
  pageTitle: { color: colors.textPrimary, fontSize: 28, fontWeight: '600', letterSpacing: -0.5, lineHeight: 34, maxWidth: 440 },
  pageSubtitle: { color: colors.textSecondary, fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight, marginTop: spacing.xs, maxWidth: 460 },
  publishButton: { alignItems: 'center', backgroundColor: colors.navigationDriver, borderRadius: radius.card, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, minHeight: 76, padding: spacing.md },
  publishButtonPressed: { backgroundColor: colors.success },
  publishIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.input, height: 44, justifyContent: 'center', width: 44 },
  publishCopy: { flex: 1, minWidth: 0 },
  publishTitle: { color: colors.surface, fontSize: 17, lineHeight: 22 },
  publishSubtitle: { color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  availabilityRow: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.card, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, padding: spacing.sm },
  availabilityIcon: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.input, height: 44, justifyContent: 'center', width: 44 },
  availabilityIconOnline: { backgroundColor: colors.navigationDriverSoft },
  availabilityCopy: { flex: 1, minWidth: 0 },
  section: { marginTop: spacing.xxl },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { color: colors.textPrimary, flex: 1, fontSize: 20, fontWeight: '600', lineHeight: 26 },
  sectionAction: { alignItems: 'center', borderRadius: radius.pill, flexDirection: 'row', minHeight: 44, paddingLeft: spacing.sm, paddingRight: spacing.xs },
  sectionActionPressed: { backgroundColor: colors.navigationDriverSoft },
  sectionActionText: { color: colors.navigationDriver },
  nextRideCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.md },
  cardPressed: { backgroundColor: colors.surfaceMuted },
  nextRideTop: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  calendarBadge: { alignItems: 'center', backgroundColor: colors.navigationDriverSoft, borderRadius: radius.input, height: 44, justifyContent: 'center', width: 44 },
  nextRideTime: { flex: 1, minWidth: 0 },
  lightRoute: { flexDirection: 'row', marginTop: spacing.lg, paddingHorizontal: spacing.xs },
  originDotLight: { backgroundColor: colors.mapPickup, borderRadius: 5, height: 10, width: 10 },
  routeLineLight: { backgroundColor: colors.borderStrong, flex: 1, marginVertical: 3, width: 1 },
  destinationDotLight: { backgroundColor: colors.mapDestination, borderRadius: 5, height: 10, width: 10 },
  pendingStrip: { alignItems: 'center', backgroundColor: colors.warningSoft, borderRadius: radius.sm, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg, minHeight: 40, paddingHorizontal: spacing.sm },
  pendingText: { color: colors.warning, flex: 1 },
  requestList: { gap: spacing.sm },
  requestCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.md },
  requestHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  avatarFallback: { alignItems: 'center', backgroundColor: colors.navigationDriverSoft, borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  avatarInitial: { color: colors.navigationDriver, fontSize: 17 },
  requestIdentity: { flex: 1, minWidth: 0 },
  requestPrice: { color: colors.navigationDriver, flexShrink: 0 },
  requestRouteRow: { alignItems: 'flex-start', backgroundColor: colors.surfaceMuted, borderRadius: radius.input, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, padding: spacing.sm },
  requestRouteCopy: { flex: 1, minWidth: 0 },
  metricsRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  metricPill: { alignItems: 'center', backgroundColor: colors.navigationDriverSoft, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xxs, minHeight: 32, paddingHorizontal: spacing.sm },
  metricText: { color: colors.navigationDriver },
  deviationText: { flexShrink: 1 },
  requestFooter: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.xxs, justifyContent: 'flex-end', marginTop: spacing.md, minHeight: 40, paddingTop: spacing.sm },
  viewRequestText: { color: colors.navigationDriver },
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
