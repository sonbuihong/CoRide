import React, { memo } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { CheckCircle2, Navigation, Star, User, Users } from 'lucide-react-native';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';

import type { Ride } from '../services/ride.service';
import { colors, layout, radius, spacing } from '../theme/tokens';
import { MatchExplanation } from './MatchExplanation';
import { AppText } from './ui/AppText';
import { SkeletonLoader } from './ui/SkeletonLoader';

export interface PassengerRouteContext {
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  date?: string;
  seats?: number;
}

export interface RideCardProps {
  ride: Ride;
  showMatch?: boolean;
  featured?: boolean;
  passengerRoute?: PassengerRouteContext;
}

const formatDistance = (distance?: number) => {
  if (distance == null || !Number.isFinite(distance)) return undefined;
  return `${distance < 10 ? distance.toFixed(1).replace('.', ',') : Math.round(distance)} km`;
};

const formatDuration = (duration?: number) => {
  if (duration == null || !Number.isFinite(duration)) return undefined;
  return `${Math.max(1, Math.round(duration))} phút`;
};

const rideDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : format(date, 'EEEE, dd/MM', { locale: vi });
};

function RouteSummary({ origin, destination }: { origin: string; destination: string }) {
  return (
    <View style={styles.route}>
      <View style={styles.routeRail}>
        <View style={styles.pickupMarker} />
        <View style={styles.routeLine} />
        <View style={styles.dropoffMarker} />
      </View>
      <View style={styles.routeCopy}>
        <AppText variant="bodySmall" weight="semibold" numberOfLines={2}>{origin}</AppText>
        <AppText variant="bodySmall" weight="semibold" numberOfLines={2}>{destination}</AppText>
      </View>
    </View>
  );
}

function DriverSummary({ ride }: { ride: Ride }) {
  const driver = ride.driver;
  const name = [driver?.firstName, driver?.lastName].filter(Boolean).join(' ') || 'Tài xế CoRide';
  const vehicle = driver?.vehicle ?? ride.vehicle ?? undefined;
  const vehicleText = [vehicle?.type === 'CAR' ? 'Ô tô' : vehicle?.type === 'BIKE' ? 'Xe máy' : undefined, vehicle?.color, vehicle?.licensePlate]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.driverRow}>
      {driver?.avatar ? (
        <Image source={{ uri: driver.avatar }} style={styles.avatar} accessibilityLabel={`Ảnh đại diện ${name}`} />
      ) : (
        <View style={styles.avatarFallback}><User size={19} color={colors.primary} /></View>
      )}
      <View style={styles.driverCopy}>
        <View style={styles.driverNameRow}>
          <AppText variant="bodySmall" weight="semibold" numberOfLines={1}>{name}</AppText>
          {driver?.isVerified ? <CheckCircle2 size={15} color={colors.primary} /> : null}
          {typeof driver?.rating === 'number' && driver.rating > 0 ? (
            <View style={styles.rating}>
              <Star size={12} color="#D97706" fill="#D97706" />
              <AppText variant="caption" weight="semibold">{driver.rating.toFixed(1)}</AppText>
            </View>
          ) : null}
        </View>
        {vehicleText ? <AppText variant="caption" numberOfLines={1}>{vehicleText}</AppText> : null}
      </View>
    </View>
  );
}

export const RideCard: React.FC<RideCardProps> = memo(({
  ride,
  showMatch = false,
  featured = false,
  passengerRoute,
}) => {
  const router = useRouter();
  const isSoldOut = ride.availableSeats <= 0;
  const isOngoing = ride.status === 'ONGOING';
  const primaryOrigin = showMatch && passengerRoute?.origin ? passengerRoute.origin : ride.departure;
  const primaryDestination = showMatch && passengerRoute?.destination ? passengerRoute.destination : ride.destination;
  const fare = ride.passengerFare ?? ride.price;
  const details = [formatDistance(ride.distance), formatDuration(ride.duration)].filter(Boolean);

  const openDetail = () => {
    router.push({
      pathname: '/ride/[id]',
      params: {
        id: ride.id,
        context: showMatch ? 'search' : undefined,
        passengerOrigin: passengerRoute?.origin,
        passengerDestination: passengerRoute?.destination,
        passengerOriginLat: passengerRoute?.originLat?.toString(),
        passengerOriginLng: passengerRoute?.originLng?.toString(),
        passengerDestinationLat: passengerRoute?.destinationLat?.toString(),
        passengerDestinationLng: passengerRoute?.destinationLng?.toString(),
        passengerDate: passengerRoute?.date,
        seats: passengerRoute?.seats?.toString(),
        matchType: ride.matchType,
        matchScore: ride.matchScore?.toString(),
        pickupDistanceKm: ride.pickupDistanceKm?.toString(),
        dropoffDistanceKm: ride.dropoffDistanceKm?.toString(),
        detourKm: ride.detourKm?.toString(),
        routeOverlap: ride.routeOverlap?.toString(),
        sharedDistanceKm: ride.sharedDistanceKm?.toString(),
        pickupRoutePosition: ride.pickupRoutePosition?.toString(),
        dropoffRoutePosition: ride.dropoffRoutePosition?.toString(),
        expectedPickupTime: ride.expectedPickupTime,
        estimatedDetourMinutes: ride.estimatedDetourMinutes?.toString(),
        passengerFare: ride.passengerFare?.toString(),
        passengerPricePerSeat: ride.passengerPricePerSeat?.toString(),
      },
    } as any);
  };

  return (
    <View style={[styles.card, featured && styles.featuredCard, isSoldOut && styles.disabledCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Chuyến ${isOngoing ? 'đang di chuyển, ' : ''}${format(new Date(ride.departureTime), 'HH:mm')}, từ ${primaryOrigin} đến ${primaryDestination}, ${fare.toLocaleString('vi-VN')} đồng, còn ${ride.availableSeats} chỗ`}
        accessibilityHint="Nhấn để xem chi tiết chuyến đi"
        onPress={openDetail}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
      >
        <View style={styles.content}>
          {featured && ride.matchScore != null ? (
            <View style={styles.bestRow}>
              <Star size={14} color="#B45309" fill="#FBBF24" />
              <AppText variant="caption" weight="semibold" style={styles.bestText}>PHÙ HỢP NHẤT</AppText>
              <AppText variant="caption" weight="semibold" style={styles.bestScore}>{ride.matchScore}%</AppText>
            </View>
          ) : null}

          <View style={styles.header}>
            <View>
              <AppText variant="h2" weight="semibold" style={styles.time}>{format(new Date(ride.departureTime), 'HH:mm')}</AppText>
              <AppText variant="caption" style={styles.date}>{rideDate(ride.departureTime)}</AppText>
              {isOngoing ? (
                <View style={styles.ongoingBadge}>
                  <View style={styles.ongoingDot} />
                  <AppText variant="caption" weight="semibold" style={styles.ongoingText}>Đang di chuyển</AppText>
                </View>
              ) : null}
            </View>
            <View style={styles.priceBlock}>
              <AppText variant="h2" weight="semibold" style={styles.price}>{fare.toLocaleString('vi-VN')}đ</AppText>
              {showMatch && ride.passengerFare != null ? <AppText variant="caption">chi phí của bạn</AppText> : null}
            </View>
          </View>

          <RouteSummary origin={primaryOrigin} destination={primaryDestination} />
          
          <DriverSummary ride={ride} />

          <View style={styles.footer}>
            <View style={styles.metaItem}>
              <Users size={15} color={ride.availableSeats === 1 ? colors.warning : colors.textSecondary} />
              <AppText variant="caption" weight="semibold" style={ride.availableSeats === 1 ? styles.warning : undefined}>
                {isSoldOut ? 'Hết chỗ' : `Còn ${ride.availableSeats} chỗ`}
              </AppText>
            </View>
            {!showMatch && details.length ? (
              <View style={styles.metaItem}>
                <Navigation size={14} color={colors.textSecondary} />
                <AppText variant="caption">{details.join(' · ')}</AppText>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
});
RideCard.displayName = 'RideCard';

export const RideCardSkeleton = memo(() => (
  <View style={styles.card} accessibilityRole="progressbar" accessibilityLabel="Đang tải chuyến đi">
    <View style={styles.content}>
      <View style={styles.skeletonHeader}><SkeletonLoader height={26} width={70} /><SkeletonLoader height={26} width={90} /></View>
      <View style={styles.skeletonRoute}><SkeletonLoader height={18} width="82%" /><SkeletonLoader height={18} width="66%" /></View>
      <SkeletonLoader height={52} width="100%" borderRadius={radius.card} />
      <View style={styles.skeletonDriver}><SkeletonLoader height={42} width={42} borderRadius={21} /><SkeletonLoader height={18} width={150} /></View>
    </View>
  </View>
));

RideCardSkeleton.displayName = 'RideCardSkeleton';

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, elevation: 2, marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14 },
  featuredCard: { elevation: 4, shadowOpacity: 0.11, shadowRadius: 18 },
  disabledCard: { opacity: 0.6 },
  pressable: { borderRadius: radius.card, overflow: 'hidden' },
  pressed: { backgroundColor: colors.navigationPressed, opacity: 0.86 },
  content: { gap: spacing.md, padding: spacing.lg },
  bestRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  bestText: { color: '#92400E', letterSpacing: 0.35 },
  bestScore: { color: colors.primary, marginLeft: 'auto' },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontVariant: ['tabular-nums'] },
  date: { marginTop: 1, textTransform: 'capitalize' },
  ongoingBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.successSoft, borderRadius: radius.full, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, minHeight: 28, paddingHorizontal: spacing.sm },
  ongoingDot: { backgroundColor: colors.success, borderRadius: radius.full, height: 7, width: 7 },
  ongoingText: { color: colors.success },
  priceBlock: { alignItems: 'flex-end' },
  price: { color: colors.primary, fontVariant: ['tabular-nums'] },
  route: { flexDirection: 'row', minHeight: 58 },
  routeRail: { alignItems: 'center', marginRight: spacing.sm, paddingVertical: 5, width: 14 },
  pickupMarker: { backgroundColor: colors.surface, borderColor: colors.mapPickup, borderRadius: radius.pill, borderWidth: 2, height: 11, width: 11 },
  routeLine: { backgroundColor: colors.borderStrong, flex: 1, marginVertical: 3, width: 2 },
  dropoffMarker: { backgroundColor: colors.mapDestination, borderRadius: radius.pill, height: 10, width: 10 },
  routeCopy: { flex: 1, gap: spacing.md, justifyContent: 'space-between' },
  driverRoute: { color: colors.textSecondary },
  driverRow: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingTop: spacing.md },
  avatar: { backgroundColor: colors.surfaceMuted, borderRadius: 21, height: 42, width: 42 },
  avatarFallback: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  driverCopy: { flex: 1, gap: 2, marginLeft: spacing.sm, minWidth: 0 },
  driverNameRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  rating: { alignItems: 'center', flexDirection: 'row', gap: 3, marginLeft: 'auto' },
  footer: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, minHeight: layout.minTouchTarget - 12 },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  warning: { color: colors.warning },
  skeletonHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  skeletonRoute: { gap: spacing.md, paddingVertical: spacing.sm },
  skeletonDriver: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
});
