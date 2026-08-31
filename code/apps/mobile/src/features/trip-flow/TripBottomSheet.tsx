import React, { memo, useMemo } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import {
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  MessageCircle,
  Navigation,
  Phone,
  Route,
  Star,
  UserRound,
  Users,
} from 'lucide-react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import type { DriverBookingSummary } from '../../services/booking.service';
import { colors, radius, spacing } from '../../theme/tokens';
import {
  ActiveRideViewModel,
  DriverTripPhase,
  formatCurrency,
  formatRideDistance,
  formatRideDuration,
  formatTripDistance,
  formatTripDuration,
  getConfirmedPassengers,
  getNextStop,
  getPassengerStatusLabel,
  getTripStops,
} from './trip-flow';

interface TripBottomSheetProps {
  ride: ActiveRideViewModel;
  phase: DriverTripPhase;
  snapIndex: number;
  distance?: number;
  duration?: number;
  isBusy?: boolean;
  dropoffArrived?: boolean;
  onPrimaryAction: () => void;
  onNavigate: () => void;
  onOpenRoute: () => void;
  onPassengerPress: (booking: DriverBookingSummary) => void;
  onChat: (booking: DriverBookingSummary) => void;
}

const passengerName = (booking?: DriverBookingSummary | null) =>
  [booking?.passenger.firstName, booking?.passenger.lastName].filter(Boolean).join(' ') ||
  'Hành khách';

const primaryActionLabel = (
  phase: DriverTripPhase,
  booking?: DriverBookingSummary | null,
  dropoffArrived?: boolean,
) => {
  switch (phase) {
    case 'READY_TO_START':
      return 'Bắt đầu chuyến đi';
    case 'ARRIVING_PICKUP':
      return 'Đã đến điểm đón';
    case 'WAITING_PASSENGER':
      return `Xác nhận đã đón ${booking?.passenger.firstName || 'khách'}`;
    case 'EN_ROUTE_DROPOFF':
      return dropoffArrived
        ? `Xác nhận đã trả ${booking?.passenger.firstName || 'khách'}`
        : 'Đã đến điểm trả';
    case 'READY_TO_COMPLETE':
      return 'Hoàn thành chuyến đi';
    default:
      return 'Chuyến đi đã hoàn thành';
  }
};

export const TripStatusHeader = memo(function TripStatusHeader({ phase }: { phase: DriverTripPhase }) {
  const copy =
    phase === 'WAITING_PASSENGER'
      ? 'Đang chờ hành khách'
      : phase === 'READY_TO_COMPLETE'
        ? 'Sẵn sàng hoàn thành'
        : phase === 'READY_TO_START'
          ? 'Sẵn sàng khởi hành'
          : 'Đang di chuyển';

  return (
    <View style={styles.statusHeader}>
      <View style={styles.navigationIcon}>
        <Navigation size={18} color={colors.info} fill={colors.info} />
      </View>
      <AppText weight="bold" style={styles.statusText}>{copy}</AppText>
    </View>
  );
});

export const NextStopCard = memo(function NextStopCard({
  ride,
  distance,
  duration,
  onNavigate,
}: {
  ride: ActiveRideViewModel;
  distance?: number;
  duration?: number;
  onNavigate: () => void;
}) {
  const nextStop = getNextStop(ride);
  if (!nextStop) return null;

  return (
    <View style={styles.nextStop}>
      <View style={styles.sectionHeadingRow}>
        <View style={styles.sectionHeadingCopy}>
          <AppText variant="caption" weight="bold" style={styles.mutedCaps}>ĐIỂM TIẾP THEO</AppText>
          <AppText variant="title" weight="bold" numberOfLines={1}>{nextStop.title}</AppText>
        </View>
        <View style={[styles.stopDot, nextStop.kind === 'DROPOFF' && styles.stopDotDanger]} />
      </View>
      <AppText variant="bodySmall" style={styles.address} numberOfLines={2}>{nextStop.address}</AppText>
      <View style={styles.nextStopFooter}>
        <AppText variant="bodySmall" weight="semibold" style={styles.nextStopMetric}>
          {formatTripDistance(distance)}  •  {formatTripDuration(duration)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở ứng dụng điều hướng"
          onPress={onNavigate}
          style={({ pressed }) => [styles.navigateButton, pressed && styles.pressed]}
        >
          <Navigation size={17} color={colors.surface} />
          <AppText variant="bodySmall" weight="bold" style={styles.navigateText}>Điều hướng</AppText>
        </Pressable>
      </View>
    </View>
  );
});

export const CompactNextStop = memo(function CompactNextStop({
  ride,
  phase,
  distance,
  duration,
}: {
  ride: ActiveRideViewModel;
  phase: DriverTripPhase;
  distance?: number;
  duration?: number;
}) {
  const nextStop = getNextStop(ride);
  if (!nextStop) return null;
  const status = phase === 'WAITING_PASSENGER' ? 'ĐANG CHỜ HÀNH KHÁCH' : 'ĐANG DI CHUYỂN';
  return (
    <View style={styles.compactStop}>
      <View style={styles.compactTopRow}>
        <AppText variant="caption" weight="bold" style={styles.compactStatus}>{status}</AppText>
        <AppText variant="bodySmall" weight="bold">{formatTripDistance(distance)} • {formatTripDuration(duration)}</AppText>
      </View>
      <AppText variant="title" weight="bold" numberOfLines={1}>{nextStop.title}</AppText>
      <AppText variant="bodySmall" style={styles.address} numberOfLines={1}>{nextStop.address}</AppText>
    </View>
  );
});

export const TripRouteSummary = memo(function TripRouteSummary({
  ride,
  distance,
  duration,
  onPress,
}: {
  ride: ActiveRideViewModel;
  distance?: number;
  duration?: number;
  onPress: () => void;
}) {
  const passengers = getConfirmedPassengers(ride);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Xem chi tiết lộ trình"
      onPress={onPress}
      style={({ pressed }) => [styles.routeSummary, pressed && styles.pressed]}
    >
      <View style={styles.routeLineColumn}>
        <View style={styles.originDot} />
        <View style={styles.routeLine} />
        <View style={styles.destinationDot} />
      </View>
      <View style={styles.routeCopy}>
        <AppText variant="caption">Điểm đi</AppText>
        <AppText weight="semibold" numberOfLines={2}>{ride.origin}</AppText>
        <View style={styles.routeGap} />
        <AppText variant="caption">Điểm đến</AppText>
        <AppText weight="semibold" numberOfLines={2}>{ride.destination}</AppText>
        <View style={styles.metricsRow}>
          <View style={styles.metric}><Users size={16} color={colors.info} /><AppText variant="bodySmall" weight="medium">{passengers.length} khách</AppText></View>
          <View style={styles.metric}><Route size={16} color={colors.info} /><AppText variant="bodySmall" weight="medium">{ride.distance ? formatRideDistance(ride.distance) : formatTripDistance(distance)}</AppText></View>
          <View style={styles.metric}><Clock3 size={16} color={colors.info} /><AppText variant="bodySmall" weight="medium">{ride.duration ? formatRideDuration(ride.duration) : formatTripDuration(duration)}</AppText></View>
        </View>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </Pressable>
  );
});

export const TripProgress = memo(function TripProgress({ ride }: { ride: ActiveRideViewModel }) {
  const stops = getTripStops(ride);
  return (
    <View style={styles.section}>
      <AppText variant="h3" weight="bold" style={styles.sectionTitle}>Tiến trình chuyến đi</AppText>
      {stops.map((stop, index) => (
        <View key={stop.id} style={styles.progressRow}>
          <View style={styles.progressRail}>
            <View style={[
              styles.progressDot,
              stop.state === 'DONE' && styles.progressDotDone,
              stop.state === 'CURRENT' && styles.progressDotCurrent,
              (stop.kind === 'DROPOFF' || stop.kind === 'DESTINATION') && stop.state !== 'DONE' && styles.progressDotDropoff,
            ]}>
              {stop.state === 'DONE' ? <Check size={12} color={colors.surface} strokeWidth={3} /> : null}
            </View>
            {index < stops.length - 1 ? <View style={styles.progressLine} /> : null}
          </View>
          <View style={styles.progressCopy}>
            <AppText weight={stop.state === 'CURRENT' ? 'bold' : 'medium'} style={stop.state === 'UPCOMING' ? styles.upcomingText : undefined}>{stop.title}</AppText>
            <AppText variant="bodySmall" numberOfLines={2} style={styles.progressAddress}>{stop.address}</AppText>
          </View>
        </View>
      ))}
    </View>
  );
});

export const PassengerCard = memo(function PassengerCard({
  booking,
  onPress,
  onChat,
}: {
  booking: DriverBookingSummary;
  onPress: () => void;
  onChat: () => void;
}) {
  const status = getPassengerStatusLabel(booking);
  const canCall = Boolean(booking.passenger.phone);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem hành khách ${passengerName(booking)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.passengerRow, pressed && styles.pressed]}
    >
      {booking.passenger.avatarUrl ? (
        <Image source={{ uri: booking.passenger.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}><AppText weight="bold" style={styles.avatarInitial}>{booking.passenger.firstName?.charAt(0) || '?'}</AppText></View>
      )}
      <View style={styles.passengerCopy}>
        <AppText weight="bold" numberOfLines={1}>{passengerName(booking)}</AppText>
        <View style={styles.ratingRow}>
          <Star size={13} color={colors.warning} fill={colors.warning} />
          <AppText variant="caption" weight="semibold">{booking.passenger.passengerRating?.toFixed(1) || '—'}</AppText>
          <AppText variant="caption">• {status}</AppText>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Gọi hành khách"
        disabled={!canCall}
        onPress={(event) => {
          event.stopPropagation();
          if (booking.passenger.phone) void Linking.openURL(`tel:${booking.passenger.phone}`);
        }}
        style={[styles.roundAction, !canCall && styles.disabled]}
      >
        <Phone size={19} color={colors.success} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nhắn tin cho hành khách"
        onPress={(event) => { event.stopPropagation(); onChat(); }}
        style={styles.roundAction}
      >
        <MessageCircle size={19} color={colors.success} />
      </Pressable>
    </Pressable>
  );
});

export const PassengerList = memo(function PassengerList({
  ride,
  onPassengerPress,
  onChat,
}: {
  ride: ActiveRideViewModel;
  onPassengerPress: (booking: DriverBookingSummary) => void;
  onChat: (booking: DriverBookingSummary) => void;
}) {
  const passengers = getConfirmedPassengers(ride);
  return (
    <View style={styles.section}>
      <AppText variant="h3" weight="bold" style={styles.sectionTitle}>Hành khách ({passengers.length})</AppText>
      {passengers.length ? passengers.map((booking) => (
        <PassengerCard
          key={booking.id}
          booking={booking}
          onPress={() => onPassengerPress(booking)}
          onChat={() => onChat(booking)}
        />
      )) : (
        <View style={styles.emptyPassengers}>
          <UserRound size={22} color={colors.textMuted} />
          <AppText variant="bodySmall" style={styles.emptyCopy}>Chưa có hành khách trong chuyến này.</AppText>
        </View>
      )}
    </View>
  );
});

export const PaymentCard = memo(function PaymentCard({ ride }: { ride: ActiveRideViewModel }) {
  const passengers = getConfirmedPassengers(ride);
  const total = passengers.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  return (
    <View style={styles.section}>
      <AppText variant="h3" weight="bold" style={styles.sectionTitle}>Thanh toán</AppText>
      {passengers.map((booking) => (
        <View key={booking.id} style={styles.paymentRow}>
          <View style={styles.paymentIcon}><CircleDollarSign size={18} color={colors.success} /></View>
          <View style={styles.paymentCopy}>
            <AppText weight="semibold" numberOfLines={1}>{passengerName(booking)}</AppText>
            <AppText variant="caption">{booking.paymentMethod === 'WALLET' ? 'Ví CoRide' : booking.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chưa xác định'}</AppText>
          </View>
          <AppText weight="bold" style={styles.money}>{formatCurrency(booking.totalPrice)}</AppText>
        </View>
      ))}
      <View style={styles.paymentTotal}>
        <AppText weight="semibold">Tổng tiền chuyến</AppText>
        <AppText variant="title" weight="bold" style={styles.money}>{formatCurrency(total)}</AppText>
      </View>
    </View>
  );
});

export const TripPrimaryAction = memo(function TripPrimaryAction({
  phase,
  booking,
  dropoffArrived,
  isBusy,
  onPress,
}: {
  phase: DriverTripPhase;
  booking?: DriverBookingSummary | null;
  dropoffArrived?: boolean;
  isBusy?: boolean;
  onPress: () => void;
}) {
  return (
    <AppButton
      variant="driver"
      title={primaryActionLabel(phase, booking, dropoffArrived)}
      onPress={onPress}
      isLoading={isBusy}
      disabled={phase === 'COMPLETED'}
      accessibilityHint="Cập nhật trạng thái chuyến đi"
    />
  );
});

export const TripBottomSheetContent = memo(function TripBottomSheetContent({
  ride,
  phase,
  snapIndex,
  distance,
  duration,
  onNavigate,
  onOpenRoute,
  onPassengerPress,
  onChat,
}: TripBottomSheetProps) {
  const passengers = useMemo(() => getConfirmedPassengers(ride), [ride]);
  const currentBooking = useMemo(() => getNextStop(ride)?.booking ?? null, [ride]);

  return (
    <View style={styles.content}>
      {snapIndex === 0 ? null : snapIndex === 2 ? (
        <View style={styles.expandedHeader}>
          <AppText variant="h1" weight="bold">Chi tiết chuyến</AppText>
          <View style={styles.expandedBadge}><AppText variant="caption" weight="bold" style={styles.expandedBadgeText}>ĐANG DI CHUYỂN</AppText></View>
        </View>
      ) : <TripStatusHeader phase={phase} />}

      {snapIndex === 0 ? (
        <CompactNextStop ride={ride} phase={phase} distance={distance} duration={duration} />
      ) : (
        <>
          <TripRouteSummary ride={ride} distance={distance} duration={duration} onPress={onOpenRoute} />
          <NextStopCard ride={ride} distance={distance} duration={duration} onNavigate={onNavigate} />
          <TripProgress ride={ride} />
          {snapIndex === 2 ? (
            <>
              <PassengerList ride={ride} onPassengerPress={onPassengerPress} onChat={onChat} />
              <PaymentCard ride={ride} />
              <View style={styles.detailFooterSpace} />
            </>
          ) : passengers.length > 0 && currentBooking ? (
            <PassengerCard booking={currentBooking} onPress={() => onPassengerPress(currentBooking)} onChat={() => onChat(currentBooking)} />
          ) : null}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  statusHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  navigationIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.full, height: 34, justifyContent: 'center', width: 34 },
  statusText: { color: colors.info },
  nextStop: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.card, padding: spacing.lg },
  compactStop: { paddingBottom: spacing.sm, paddingTop: spacing.xs },
  compactTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  compactStatus: { color: colors.info },
  sectionHeadingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionHeadingCopy: { flex: 1, paddingRight: spacing.md },
  mutedCaps: { color: colors.textMuted, marginBottom: spacing.xs },
  stopDot: { backgroundColor: colors.success, borderRadius: radius.full, height: 12, width: 12 },
  stopDotDanger: { backgroundColor: colors.danger },
  address: { color: colors.textSecondary, marginTop: spacing.xs },
  nextStopFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  nextStopMetric: { color: colors.textPrimary, flex: 1 },
  navigateButton: { alignItems: 'center', backgroundColor: colors.info, borderRadius: radius.full, flexDirection: 'row', gap: spacing.xs, minHeight: 48, paddingHorizontal: spacing.md },
  navigateText: { color: colors.surface },
  pressed: { opacity: 0.72 },
  routeSummary: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.md, minHeight: 150, paddingVertical: spacing.xs },
  routeLineColumn: { alignItems: 'center', alignSelf: 'stretch', paddingVertical: 7, width: 24 },
  originDot: { backgroundColor: colors.success, borderRadius: radius.full, height: 12, width: 12 },
  destinationDot: { backgroundColor: colors.danger, borderRadius: radius.full, height: 12, width: 12 },
  routeLine: { backgroundColor: colors.borderStrong, flex: 1, marginVertical: spacing.xs, width: 2 },
  routeCopy: { flex: 1, paddingHorizontal: spacing.sm },
  routeGap: { height: spacing.md },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  metric: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  section: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.xl, paddingTop: spacing.xl },
  sectionTitle: { marginBottom: spacing.md },
  progressRow: { flexDirection: 'row', minHeight: 66 },
  progressRail: { alignItems: 'center', width: 28 },
  progressDot: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radius.full, borderWidth: 2, height: 20, justifyContent: 'center', width: 20 },
  progressDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  progressDotCurrent: { backgroundColor: colors.surface, borderColor: colors.success, borderWidth: 5 },
  progressDotDropoff: { borderColor: colors.danger },
  progressLine: { backgroundColor: colors.border, flex: 1, width: 2 },
  progressCopy: { flex: 1, paddingBottom: spacing.lg, paddingLeft: spacing.sm },
  progressAddress: { color: colors.textSecondary, marginTop: 2 },
  upcomingText: { color: colors.textSecondary },
  passengerRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 72, paddingVertical: spacing.sm },
  avatar: { borderRadius: radius.full, height: 46, width: 46 },
  avatarFallback: { alignItems: 'center', backgroundColor: colors.driverAccentSoft, borderRadius: radius.full, height: 46, justifyContent: 'center', width: 46 },
  avatarInitial: { color: colors.success },
  passengerCopy: { flex: 1, marginLeft: spacing.md, minWidth: 0 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: 2 },
  roundAction: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: radius.full, height: 48, justifyContent: 'center', marginLeft: spacing.xs, width: 48 },
  disabled: { opacity: 0.35 },
  emptyPassengers: { alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: radius.card, flexDirection: 'row', padding: spacing.lg },
  emptyCopy: { color: colors.textSecondary, flex: 1, marginLeft: spacing.sm },
  paymentRow: { alignItems: 'center', flexDirection: 'row', minHeight: 62 },
  paymentIcon: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: radius.full, height: 40, justifyContent: 'center', width: 40 },
  paymentCopy: { flex: 1, marginLeft: spacing.md },
  money: { color: colors.success },
  paymentTotal: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.md },
  expandedHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  expandedBadge: { backgroundColor: colors.driverAccentSoft, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  expandedBadgeText: { color: colors.success },
  detailFooterSpace: { height: spacing.xl },
});
