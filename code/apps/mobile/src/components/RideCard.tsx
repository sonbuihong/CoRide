import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Clock, Navigation, Star, User, Users } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import type { Ride } from '../services/ride.service';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './ui/AppText';

interface RideCardProps {
  ride: Ride;
  showMatch?: boolean;
}

const formatDistance = (distance?: number) => {
  if (distance == null || !Number.isFinite(distance)) return '— km';
  return `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km`;
};

const formatDuration = (duration?: number) => {
  if (duration == null || !Number.isFinite(duration)) return '— phút';
  return `${Math.max(1, Math.round(duration))} phút`;
};

export const RideCard: React.FC<RideCardProps> = ({ ride }) => {
  const router = useRouter();
  const formattedTime = format(new Date(ride.departureTime), 'HH:mm');
  const formattedDate = format(new Date(ride.departureTime), 'EEE, dd/MM', { locale: vi });
  const driverName = [ride.driver?.firstName, ride.driver?.lastName].filter(Boolean).join(' ') || 'Tài xế CoRide';
  const rating = ride.driver?.rating?.toFixed(1) || '5.0';

  const handlePress = () => router.push({
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

  return (
    <View style={styles.card}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${formattedTime}, từ ${ride.departure} đến ${ride.destination}, ${ride.price.toLocaleString('vi-VN')} đồng`}
        accessibilityHint="Mở chi tiết chuyến đi"
        style={styles.cardBody}
      >
        <View style={styles.header}>
          <View style={styles.schedule}>
            <View style={styles.timeRow}>
              <Clock size={16} color={colors.textSecondary} />
              <AppText variant="body" weight="semibold" style={styles.tabularText}>{formattedTime}</AppText>
            </View>
            <AppText variant="caption" style={styles.date}>{formattedDate}</AppText>
          </View>
          <AppText style={styles.price}>{ride.price.toLocaleString('vi-VN')}đ</AppText>
        </View>

        <View style={styles.middle}>
          <View style={styles.routeColumn}>
            <View style={styles.routeRail}>
              <View style={[styles.dot, styles.pickupDot]} />
              <View style={styles.routeLine} />
              <View style={[styles.dot, styles.destinationDot]} />
            </View>
            <View style={styles.routeCopy}>
              <View style={styles.routePoint}>
                <AppText variant="caption" style={styles.secondaryText}>Điểm đón</AppText>
                <AppText variant="bodySmall" weight="semibold" numberOfLines={2}>{ride.departure}</AppText>
              </View>
              <View style={styles.routePoint}>
                <AppText variant="caption" style={styles.secondaryText}>Điểm đến</AppText>
                <AppText variant="bodySmall" weight="semibold" numberOfLines={2}>{ride.destination}</AppText>
              </View>
            </View>
          </View>

          <View style={styles.driverColumn}>
            {ride.driver?.avatar ? (
              <Image source={{ uri: ride.driver.avatar }} style={styles.avatar} accessibilityLabel={`Ảnh ${driverName}`} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <User size={22} color={colors.primary} />
              </View>
            )}
            <AppText variant="caption" weight="semibold" numberOfLines={2} style={styles.driverName}>{driverName}</AppText>
            <View style={styles.ratingRow}>
              <Star size={13} color={colors.warning} fill={colors.warning} />
              <AppText variant="caption" weight="medium">{rating}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Users size={14} color={colors.textSecondary} />
            <AppText variant="caption" style={styles.secondaryText}>Còn {ride.availableSeats} chỗ</AppText>
          </View>
          <View style={styles.metadataDivider} />
          <View style={styles.metadataItem}>
            <Navigation size={14} color={colors.textSecondary} />
            <AppText variant="caption" style={styles.secondaryText}>{formatDistance(ride.distance)}</AppText>
          </View>
          <View style={styles.metadataDivider} />
          <View style={styles.metadataItem}>
            <Clock size={14} color={colors.textSecondary} />
            <AppText variant="caption" style={styles.secondaryText}>{formatDuration(ride.duration)}</AppText>
          </View>
        </View>
      </Pressable>

      <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel="Chọn chuyến" style={styles.cta}>
        <AppText variant="button" weight="semibold" style={styles.ctaText}>Chọn chuyến</AppText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.md, padding: spacing.md },
  cardBody: { width: '100%' },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  schedule: { gap: spacing.xxs },
  timeRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  tabularText: { fontVariant: ['tabular-nums'] },
  date: { marginLeft: 24 },
  price: { color: colors.primary, fontSize: 18, fontWeight: '600', fontVariant: ['tabular-nums'] },
  middle: { alignItems: 'stretch', flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  routeColumn: { flex: 1, flexDirection: 'row', minWidth: 0 },
  routeRail: { alignItems: 'center', marginRight: spacing.sm, paddingVertical: 5 },
  dot: { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 2, height: 10, width: 10 },
  pickupDot: { borderColor: colors.mapPickup },
  destinationDot: { borderColor: colors.mapDestination },
  routeLine: { backgroundColor: colors.borderStrong, flex: 1, minHeight: 38, width: 2 },
  routeCopy: { flex: 1, gap: spacing.sm, minWidth: 0 },
  routePoint: { minHeight: 48 },
  secondaryText: { color: colors.textSecondary },
  driverColumn: { alignItems: 'center', justifyContent: 'center', width: 92 },
  avatar: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 52, width: 52 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  driverName: { marginTop: spacing.xs, textAlign: 'center' },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xxs, marginTop: spacing.xxs },
  metadata: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 28 },
  metadataItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.xxs, minWidth: 0 },
  metadataDivider: { backgroundColor: colors.borderStrong, height: 12, width: StyleSheet.hairlineWidth },
  cta: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.sm, justifyContent: 'center', marginTop: spacing.sm, minHeight: 44 },
  ctaText: { color: colors.surface },
});
