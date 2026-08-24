import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Car, Clock, MapPin, Star, User, Users } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import type { Ride } from '../services/ride.service';
import { colors, layout, radius, spacing } from '../theme/tokens';
import { MatchExplanation } from './MatchExplanation';
import { AppText } from './ui/AppText';

interface RideCardProps {
  ride: Ride;
  showMatch?: boolean;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, showMatch = true }) => {
  const router = useRouter();
  const formattedTime = format(new Date(ride.departureTime), 'HH:mm');
  const formattedDate = format(new Date(ride.departureTime), 'EEE, dd/MM', { locale: vi });
  const driverName = [ride.driver?.firstName, ride.driver?.lastName].filter(Boolean).join(' ') || 'Tài xế CoRide';
  const vehicle = ride.driver?.vehicle;
  const vehicleLabel = [vehicle?.brand, vehicle?.model].filter(Boolean).join(' ') || 'Phương tiện đã xác minh';
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
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={styles.topRow}>
          <View style={styles.timeRow}>
            <Clock size={17} color={colors.textSecondary} />
            <AppText variant="body" weight="semibold">{formattedTime}</AppText>
            <AppText variant="caption" style={styles.secondaryText}>{formattedDate}</AppText>
          </View>
          <AppText style={styles.price}>{ride.price.toLocaleString('vi-VN')}đ</AppText>
        </View>

        <View style={styles.driverRow}>
          {ride.driver?.avatar ? (
            <Image source={{ uri: ride.driver.avatar }} style={styles.avatar} accessibilityLabel={`Ảnh ${driverName}`} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <User size={19} color={colors.primary} />
            </View>
          )}
          <View style={styles.driverCopy}>
            <AppText variant="bodySmall" weight="semibold" numberOfLines={1}>{driverName}</AppText>
            <View style={styles.metaRow}>
              <Star size={13} color={colors.warning} fill={colors.warning} />
              <AppText variant="caption" style={styles.secondaryText}>{ride.driver?.rating?.toFixed(1) || '5.0'}</AppText>
              <Car size={14} color={colors.textTertiary} />
              <AppText variant="caption" style={[styles.secondaryText, styles.vehicleText]} numberOfLines={1}>{vehicleLabel}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routeRail}>
            <View style={[styles.dot, styles.pickupDot]} />
            <View style={styles.line} />
            <View style={[styles.dot, styles.destinationDot]} />
          </View>
          <View style={styles.routeCopy}>
            <View>
              <AppText variant="caption" style={styles.secondaryText}>Điểm đón</AppText>
              <AppText variant="bodySmall" weight="medium" numberOfLines={1}>{ride.departure}</AppText>
            </View>
            <View>
              <AppText variant="caption" style={styles.secondaryText}>Điểm đến</AppText>
              <AppText variant="bodySmall" weight="medium" numberOfLines={1}>{ride.destination}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.seatRow}>
          <Users size={15} color={colors.textSecondary} />
          <AppText variant="caption" style={styles.secondaryText}>Còn {ride.availableSeats} chỗ</AppText>
          {ride.pickupDistanceKm != null && (
            <>
              <View style={styles.separator} />
              <MapPin size={15} color={colors.textSecondary} />
              <AppText variant="caption" style={styles.secondaryText}>
                Cách điểm đón {ride.pickupDistanceKm < 1 ? `${Math.round(ride.pickupDistanceKm * 1000)} m` : `${ride.pickupDistanceKm.toFixed(1)} km`}
              </AppText>
            </>
          )}
        </View>

        {showMatch && <MatchExplanation ride={ride} compact />}
      </Pressable>

      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Chọn chuyến"
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      >
        <AppText variant="button" weight="semibold" style={styles.ctaText}>Chọn chuyến</AppText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.md, padding: spacing.md },
  pressed: { opacity: 0.82 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  timeRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  price: { color: colors.primary, fontSize: 18, fontWeight: '600', fontVariant: ['tabular-nums'] },
  secondaryText: { color: colors.textSecondary },
  driverRow: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.md },
  avatar: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 44, marginRight: spacing.sm, width: 44 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  driverCopy: { flex: 1 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xxs, marginTop: spacing.xxs },
  vehicleText: { flexShrink: 1 },
  routeRow: { flexDirection: 'row', marginBottom: spacing.md },
  routeRail: { alignItems: 'center', marginRight: spacing.sm, paddingVertical: 5 },
  dot: { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 2, height: 10, width: 10 },
  pickupDot: { borderColor: colors.mapPickup },
  destinationDot: { borderColor: colors.mapDestination },
  line: { backgroundColor: colors.borderStrong, flex: 1, minHeight: 31, width: 2 },
  routeCopy: { flex: 1, gap: spacing.md },
  seatRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  separator: { backgroundColor: colors.borderStrong, height: 14, width: 1 },
  cta: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.button, justifyContent: 'center', marginTop: spacing.md, minHeight: layout.minTouchTarget },
  ctaPressed: { backgroundColor: colors.primaryPressed },
  ctaText: { color: colors.surface },
});
