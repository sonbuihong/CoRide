import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Route } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Ride } from '../services/ride.service';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './ui/AppText';

interface MatchExplanationProps {
  ride: Ride;
  compact?: boolean;
  featured?: boolean;
}

const formatDistance = (kilometres?: number) => {
  if (kilometres == null || !Number.isFinite(kilometres)) return undefined;
  if (kilometres < 1) return `${Math.max(10, Math.round(kilometres * 1000 / 10) * 10)} m`;
  return `${kilometres.toFixed(1).replace('.', ',')} km`;
};

const matchLabel = (type?: Ride['matchType']) => {
  if (type === 'DIRECT') return 'Trùng lộ trình';
  if (type === 'ON_ROUTE') return 'Thuận đường';
  if (type === 'NEARBY') return 'Gần tuyến';
  return 'Phù hợp';
};

export function MatchExplanation({ ride, compact = false, featured = false }: MatchExplanationProps) {
  if (ride.matchScore == null) return null;

  const details = [
    ride.pickupDistanceKm != null
      ? `Điểm đón cách tuyến tài xế ${formatDistance(ride.pickupDistanceKm)}`
      : null,
    ride.sharedDistanceKm != null && ride.sharedDistanceKm > 0
      ? `${formatDistance(ride.sharedDistanceKm)} hành trình của bạn nằm chung tuyến`
      : ride.routeOverlap != null
        ? `Trùng ${Math.round(ride.routeOverlap)}% đoạn đường`
        : ride.matchType === 'ON_ROUTE'
          ? 'Điểm đón và trả nằm đúng chiều di chuyển'
          : null,
    ride.detourKm != null && ride.detourKm > 0
      ? `Tài xế đi thêm ${formatDistance(ride.detourKm)}${ride.estimatedDetourMinutes != null ? `, khoảng ${ride.estimatedDetourMinutes} phút` : ''}`
      : ride.detourKm === 0
        ? 'Không cần lệch khỏi tuyến đã đăng'
        : null,
    ride.expectedPickupTime
      ? `Dự kiến qua điểm đón lúc ${format(new Date(ride.expectedPickupTime), 'HH:mm')}`
      : null,
  ].filter(Boolean) as string[];

  if (compact) {
    return (
      <View style={styles.compact} accessibilityLabel={`${ride.matchScore}% phù hợp, ${matchLabel(ride.matchType)}`}>
        <Route size={15} color={colors.primary} />
        <AppText variant="caption" weight="semibold" style={styles.compactText}>
          {ride.matchScore}% phù hợp · {matchLabel(ride.matchType)}
        </AppText>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, featured && styles.featured]}
      accessibilityLabel={`${ride.matchScore}% phù hợp với bạn. ${details.join('. ')}`}
    >
      <View style={styles.header}>
        <View style={styles.scoreRow}>
          <Route size={18} color={colors.primary} />
          <AppText variant="h3" weight="semibold" style={styles.scoreText}>
            {ride.matchScore}% phù hợp với bạn
          </AppText>
        </View>
        <View style={styles.typeBadge}>
          <AppText variant="caption" weight="semibold" style={styles.typeText}>
            {matchLabel(ride.matchType)}
          </AppText>
        </View>
      </View>

      {details.map((detail) => (
        <View key={detail} style={styles.detailRow}>
          <CheckCircle2 size={17} color={colors.success} strokeWidth={2.3} />
          <AppText variant="bodySmall" style={styles.detailText}>{detail}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.primarySoft, borderRadius: radius.card, gap: spacing.sm, padding: spacing.md },
  featured: { paddingVertical: spacing.lg },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  scoreRow: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: spacing.xs, minWidth: 0 },
  scoreText: { color: colors.primary, flexShrink: 1 },
  typeBadge: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  typeText: { color: colors.primary },
  detailRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  detailText: { color: colors.textSecondary, flex: 1 },
  compact: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, minHeight: 28 },
  compactText: { color: colors.primary },
});
