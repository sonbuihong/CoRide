import React, { memo } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Navigation,
  Star,
  User,
  Users,
} from 'lucide-react-native';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';

import type { Ride } from '../services/ride.service';
import { colors } from '../theme/tokens';
import { AppText } from './ui/AppText';
import { SkeletonLoader } from './ui/SkeletonLoader';

export interface RideCardProps {
  ride: Ride;
  showMatch?: boolean;
}

// ─── Format Utilities ────────────────────────────────────────────────────────
const formatDistance = (distance?: number) => {
  if (distance == null || !Number.isFinite(distance)) return '— km';
  return `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km`;
};

const formatDuration = (duration?: number) => {
  if (duration == null || !Number.isFinite(duration)) return '— phút';
  return `${Math.max(1, Math.round(duration))} phút`;
};

const formatRideDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const dayOfWeek = format(d, 'EEEE', { locale: vi });
    const dateFormatted = format(d, 'dd/MM');
    const capitalized = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    return `${capitalized}, ${dateFormatted}`;
  } catch {
    return '';
  }
};

// ─── Subcomponent: RideHeader ────────────────────────────────────────────────
interface RideHeaderProps {
  departureTime: string;
  price: number;
  availableSeats: number;
  matchType?: string;
  showMatch?: boolean;
}

const RideHeader: React.FC<RideHeaderProps> = memo(({
  departureTime,
  price,
  availableSeats,
  matchType,
  showMatch,
}) => {
  const formattedTime = format(new Date(departureTime), 'HH:mm');
  const formattedDate = formatRideDate(departureTime);
  const isSoldOut = availableSeats <= 0;

  return (
    <View style={styles.header}>
      <View style={styles.scheduleBlock}>
        <AppText style={styles.timeText}>{formattedTime}</AppText>
        <AppText style={styles.dateText}>{formattedDate}</AppText>
      </View>

      <View style={styles.priceBlock}>
        <AppText style={styles.priceText}>{price.toLocaleString('vi-VN')}đ</AppText>
        {isSoldOut ? (
          <View style={styles.soldOutBadge}>
            <AppText style={styles.soldOutBadgeText}>Hết chỗ</AppText>
          </View>
        ) : showMatch && matchType ? (
          <View style={styles.matchBadge}>
            <AppText style={styles.matchBadgeText}>
              {matchType === 'DIRECT' ? 'Đúng tuyến' : 'Tiện đường'}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
});
RideHeader.displayName = 'RideHeader';

// ─── Subcomponent: RideRoute ─────────────────────────────────────────────────
interface RideRouteProps {
  departure: string;
  destination: string;
}

const RideRoute: React.FC<RideRouteProps> = memo(({ departure, destination }) => {
  return (
    <View style={styles.routeContainer}>
      <View style={styles.routeRail}>
        <View style={styles.pickupMarker} />
        <View style={styles.routeLine} />
        <View style={styles.destinationMarker} />
      </View>

      <View style={styles.routeLocations}>
        <View style={styles.locationRow}>
          <AppText numberOfLines={2} ellipsizeMode="tail" style={styles.locationText}>
            {departure}
          </AppText>
        </View>

        <View style={styles.locationRow}>
          <AppText numberOfLines={2} ellipsizeMode="tail" style={styles.locationText}>
            {destination}
          </AppText>
        </View>
      </View>
    </View>
  );
});
RideRoute.displayName = 'RideRoute';

// ─── Subcomponent: DriverSummary ─────────────────────────────────────────────
interface DriverSummaryProps {
  driver?: Ride['driver'];
}

const DriverSummary: React.FC<DriverSummaryProps> = memo(({ driver }) => {
  const driverName = [driver?.firstName, driver?.lastName].filter(Boolean).join(' ') || 'Tài xế CoRide';
  const rating = driver?.rating;
  const isVerified = driver?.isVerified;
  const hasRating = typeof rating === 'number' && rating > 0;

  return (
    <View style={styles.driverRow}>
      {driver?.avatar ? (
        <Image
          source={{ uri: driver.avatar }}
          style={styles.driverAvatar}
          accessibilityLabel={`Ảnh đại diện ${driverName}`}
        />
      ) : (
        <View style={styles.avatarFallback}>
          <User size={18} color={colors.primary} />
        </View>
      )}

      <View style={styles.driverMeta}>
        <View style={styles.driverNameRow}>
          <AppText numberOfLines={1} style={styles.driverName}>
            {driverName}
          </AppText>
          {isVerified && (
            <CheckCircle2
              size={14}
              color={colors.primary}
              fill="rgba(0, 113, 227, 0.12)"
              style={styles.verifiedIcon}
            />
          )}
        </View>

        <View style={styles.driverSubRow}>
          {hasRating ? (
            <View style={styles.starRow}>
              <Star size={11} color="#F59E0B" fill="#F59E0B" />
              <AppText style={styles.ratingText}>{rating.toFixed(1)}</AppText>
            </View>
          ) : (
            <AppText style={styles.newDriverText}>Mới</AppText>
          )}
        </View>
      </View>

      <ChevronRight size={18} color="#9CA3AF" style={styles.chevron} strokeWidth={2} />
    </View>
  );
});
DriverSummary.displayName = 'DriverSummary';

// ─── Subcomponent: RideMetadata ──────────────────────────────────────────────
interface RideMetadataProps {
  availableSeats: number;
  distance?: number;
  duration?: number;
}

const RideMetadata: React.FC<RideMetadataProps> = memo(({
  availableSeats,
  distance,
  duration,
}) => {
  const isSoldOut = availableSeats <= 0;
  const isNearlyFull = availableSeats === 1;

  const seatsColor = isSoldOut
    ? colors.textTertiary
    : isNearlyFull
      ? '#D97706' // amber-600 warning nhẹ, dễ chịu
      : colors.textSecondary;

  const seatsText = isSoldOut
    ? 'Hết chỗ'
    : `Còn ${availableSeats} chỗ`;

  return (
    <View style={styles.metadataContainer}>
      <View style={styles.metaItem}>
        <Users size={13} color={seatsColor} strokeWidth={2} />
        <AppText
          style={[
            styles.metaText,
            isNearlyFull && styles.metaTextWarning,
            isSoldOut && styles.metaTextSoldOut,
          ]}
        >
          {seatsText}
        </AppText>
      </View>

      <AppText style={styles.metaDot}>·</AppText>

      <View style={styles.metaItem}>
        <Navigation size={12} color={colors.textSecondary} strokeWidth={2} />
        <AppText style={styles.metaText}>{formatDistance(distance)}</AppText>
      </View>

      <AppText style={styles.metaDot}>·</AppText>

      <View style={styles.metaItem}>
        <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
        <AppText style={styles.metaText}>{formatDuration(duration)}</AppText>
      </View>
    </View>
  );
});
RideMetadata.displayName = 'RideMetadata';

// ─── Main Component: RideCard ────────────────────────────────────────────────
export const RideCard: React.FC<RideCardProps> = memo(({ ride, showMatch = false }) => {
  const router = useRouter();
  const formattedTime = format(new Date(ride.departureTime), 'HH:mm');
  const formattedDate = formatRideDate(ride.departureTime);
  const isSoldOut = ride.availableSeats <= 0;

  const handlePress = () => {
    router.push({
      pathname: '/ride/[id]',
      params: {
        id: ride.id,
        matchType: ride.matchType,
        matchScore: ride.matchScore?.toString(),
        pickupDistanceKm: ride.pickupDistanceKm?.toString(),
        detourKm: ride.detourKm?.toString(),
        routeOverlap: ride.routeOverlap?.toString(),
      },
    } as any);
  };

  return (
    <View style={[styles.cardContainer, isSoldOut && styles.cardDisabled]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Chuyến đi lúc ${formattedTime} ngày ${formattedDate}, từ ${ride.departure} đến ${ride.destination}, giá ${ride.price.toLocaleString('vi-VN')} đồng`}
        accessibilityHint="Nhấn để xem chi tiết chuyến đi"
        android_ripple={{ color: 'rgba(0, 0, 0, 0.05)', borderless: false }}
        style={({ pressed }) => [
          styles.cardPressable,
          pressed && Platform.OS !== 'android' && styles.cardPressed,
        ]}
      >
        <View style={styles.cardContent}>
          <RideHeader
            departureTime={ride.departureTime}
            price={ride.price}
            availableSeats={ride.availableSeats}
            matchType={ride.matchType}
            showMatch={showMatch}
          />

          <RideRoute
            departure={ride.departure}
            destination={ride.destination}
          />

          <DriverSummary driver={ride.driver} />

          <RideMetadata
            availableSeats={ride.availableSeats}
            distance={ride.distance}
            duration={ride.duration}
          />
        </View>
      </Pressable>
    </View>
  );
});

RideCard.displayName = 'RideCard';

// ─── Skeleton Component: RideCardSkeleton ────────────────────────────────────
export const RideCardSkeleton: React.FC = memo(() => (
  <View style={styles.cardContainer}>
    <View style={styles.cardPressable}>
      <View style={styles.cardContent}>
        <View style={styles.skeletonHeader}>
        <View style={styles.skeletonSchedule}>
          <SkeletonLoader height={22} width={64} borderRadius={5} />
          <SkeletonLoader height={13} width={92} borderRadius={4} />
        </View>
        <SkeletonLoader height={22} width={76} borderRadius={5} />
      </View>

      <View style={styles.skeletonRoute}>
        <View style={styles.skeletonRail}>
          <View style={styles.skeletonDot} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonDot} />
        </View>
        <View style={styles.skeletonAddresses}>
          <SkeletonLoader height={15} width="85%" borderRadius={4} />
          <SkeletonLoader height={15} width="68%" borderRadius={4} />
        </View>
      </View>

      <View style={styles.skeletonDriver}>
        <SkeletonLoader height={38} width={38} borderRadius={19} />
        <View style={styles.skeletonDriverMeta}>
          <SkeletonLoader height={14} width={110} borderRadius={4} />
          <SkeletonLoader height={12} width={45} borderRadius={3} />
        </View>
      </View>

      <View style={styles.skeletonMetadata}>
        <SkeletonLoader height={13} width={70} borderRadius={4} />
        <SkeletonLoader height={13} width={50} borderRadius={4} />
        <SkeletonLoader height={13} width={50} borderRadius={4} />
      </View>
      </View>
    </View>
  </View>
));
RideCardSkeleton.displayName = 'RideCardSkeleton';

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Viền xám neutral rất nhẹ nhàng (gray-200)
    marginBottom: 20, // Tăng mạnh khoảng cách giữa các card
    marginHorizontal: 4, // Thêm khoảng lề nhỏ hai bên để thoát khỏi mép màn hình nếu padding không đủ
    // Đổ bóng nhẹ nhàng, tự nhiên trên Android và iOS
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardDisabled: {
    opacity: 0.65,
    backgroundColor: '#FAFAFC',
  },
  cardPressable: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  cardPressed: {
    backgroundColor: '#F8F9FA',
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16, // Khoảng cách thoáng từ Header xuống Route
  },
  scheduleBlock: {
    flexDirection: 'column',
  },
  timeText: {
    fontSize: 21,
    fontWeight: '700',
    color: '#111827', // text đậm nét, nổi bật
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
    lineHeight: 26,
  },
  dateText: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 17,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.primary, // Màu xanh chủ đạo CoRide
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
    lineHeight: 26,
  },
  soldOutBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(115, 115, 119, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  soldOutBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    lineHeight: 14,
  },
  matchBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(0, 113, 227, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 14,
  },

  // Route - Hiển thị trực tiếp, KHÔNG dùng khung viền xám lồng bên trong
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16, // Khoảng cách thoáng từ Route xuống Driver
    paddingVertical: 2,
  },
  routeRail: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginRight: 12,
  },
  pickupMarker: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
    borderColor: '#0F766E', // teal trang nhã
    backgroundColor: '#FFFFFF',
  },
  routeLine: {
    width: 1.5,
    flex: 1,
    minHeight: 16,
    backgroundColor: '#E5E7EB',
    marginVertical: 3,
  },
  destinationMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626', // red
  },
  routeLocations: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
  },
  locationRow: {
    justifyContent: 'center',
    minHeight: 20,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    lineHeight: 20,
  },

  // Driver
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14, // Khoảng cách từ Driver xuống Metadata
  },
  driverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 113, 227, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMeta: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
    marginRight: 8,
    gap: 2,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  verifiedIcon: {
    marginTop: 0.5,
  },
  driverSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
    lineHeight: 16,
  },
  newDriverText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 16,
  },
  chevron: {
    marginLeft: 'auto',
  },

  // Metadata
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 4,
    paddingTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 17,
  },
  metaTextWarning: {
    color: '#D97706',
    fontWeight: '600',
  },
  metaTextSoldOut: {
    color: colors.textTertiary,
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginHorizontal: 8,
  },

  // Skeleton
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  skeletonSchedule: {
    gap: 4,
  },
  skeletonRoute: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
    paddingVertical: 2,
  },
  skeletonRail: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginRight: 12,
  },
  skeletonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  skeletonLine: {
    width: 1.5,
    flex: 1,
    minHeight: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 3,
  },
  skeletonAddresses: {
    flex: 1,
    gap: 12,
  },
  skeletonDriver: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  skeletonDriverMeta: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  skeletonMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 2,
  },
});
