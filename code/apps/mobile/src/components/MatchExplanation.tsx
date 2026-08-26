import React from 'react';
import { Check, Route } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Ride } from '../services/ride.service';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './ui/AppText';

interface MatchExplanationProps {
  ride: Ride;
  compact?: boolean;
}

const formatDistance = (kilometres?: number) => {
  if (kilometres == null) return null;
  if (kilometres < 1) return `${Math.max(10, Math.round(kilometres * 1000 / 10) * 10)} m`;
  return `${kilometres.toFixed(1)} km`;
};

export function MatchExplanation({ ride, compact = false }: MatchExplanationProps) {
  if (ride.matchScore == null) return null;

  const details = [
    ride.pickupDistanceKm != null
      ? `Điểm đón cách bạn ${formatDistance(ride.pickupDistanceKm)}`
      : null,
    ride.routeOverlap != null && ride.routeOverlap >= 70
      ? 'Tuyến đường gần như trùng nhau'
      : ride.matchType === 'ON_ROUTE'
        ? 'Bạn nằm thuận đường của tài xế'
        : 'Điểm đến cùng hướng',
    ride.detourKm != null
      ? `Tài xế chỉ đi thêm khoảng ${Math.max(1, Math.round(ride.detourKm * 2))} phút`
      : null,
  ].filter(Boolean) as string[];

  return (
    <View style={[styles.container, compact && styles.compact]} accessibilityLabel={`${ride.matchScore}% phù hợp với bạn. ${details.join('. ')}`}>
      <View style={styles.header}>
        <View style={styles.score}>
          <Route size={16} color={colors.primary} />
          <AppText variant="bodySmall" weight="semibold" style={styles.scoreText}>
            {ride.matchScore}% phù hợp
          </AppText>
        </View>
        {ride.matchType && (
          <AppText variant="caption" style={styles.typeText}>
            {ride.matchType === 'DIRECT' ? 'Trùng lộ trình' : ride.matchType === 'NEARBY' ? 'Điểm gần nhau' : 'Thuận đường'}
          </AppText>
        )}
      </View>
      {!compact && details.map((detail) => (
        <View key={detail} style={styles.detailRow}>
          <Check size={15} color={colors.success} strokeWidth={2.5} />
          <AppText variant="bodySmall" style={styles.detailText}>{detail}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.input,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  compact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  score: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  scoreText: { color: colors.primary },
  typeText: { color: colors.textSecondary },
  detailRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  detailText: { color: colors.textSecondary, flex: 1 },
});

