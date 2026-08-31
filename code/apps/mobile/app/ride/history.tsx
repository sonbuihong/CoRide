import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Route } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { AppText } from '../../src/components/ui/AppText';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import { rideService, type Ride } from '../../src/services/ride.service';
import { colors, radius, spacing } from '../../src/theme/tokens';
import { formatCurrency, formatRideDistance, formatRideDuration } from '../../src/features/trip-flow/trip-flow';
import { TripScreen, TripScreenHeader, TripScrollView } from '../../src/features/trip-flow/TripScreen';

type HistoryFilter = 'ALL' | 'COMPLETED' | 'CANCELLED';
const filters: { key: HistoryFilter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy' },
];

export default function TripHistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<HistoryFilter>('ALL');
  const query = useQuery({ queryKey: ['my-driver-rides'], queryFn: rideService.getMyRides });
  const rides = useMemo(() => (query.data || []).filter((ride) =>
    (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') && (filter === 'ALL' || ride.status === filter),
  ), [filter, query.data]);

  return (
    <TripScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <TripScreenHeader title="Lịch sử chuyến đi" onBack={() => router.back()} />
      <View style={styles.tabs}>
        {filters.map((item) => (
          <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: filter === item.key }} onPress={() => setFilter(item.key)} style={[styles.tab, filter === item.key && styles.tabActive]}>
            <AppText variant="bodySmall" weight={filter === item.key ? 'bold' : 'medium'} style={filter === item.key ? styles.tabTextActive : styles.tabText}>{item.label}</AppText>
          </Pressable>
        ))}
      </View>
      {query.isLoading ? (
        <View style={styles.loading}>{[0, 1, 2].map((item) => <SkeletonLoader key={item} height={156} borderRadius={18} className="mb-3" />)}</View>
      ) : query.isError ? (
        <ErrorState message="Không thể tải lịch sử chuyến đi." onRetry={() => void query.refetch()} />
      ) : rides.length === 0 ? (
        <EmptyState title="Chưa có chuyến đi" description="Các chuyến đã hoàn thành hoặc bị hủy sẽ xuất hiện tại đây." />
      ) : (
        <TripScrollView refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.success} />}>
          {rides.map((ride) => <HistoryCard key={ride.id} ride={ride} onPress={() => router.push(`/ride/history/${ride.id}` as never)} />)}
        </TripScrollView>
      )}
    </TripScreen>
  );
}

function HistoryCard({ ride, onPress }: { ride: Ride; onPress: () => void }) {
  const completed = ride.status === 'COMPLETED';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardHeader}>
        <AppText variant="caption" weight="semibold">{format(new Date(ride.departureTime), 'dd/MM/yyyy • HH:mm', { locale: vi })}</AppText>
        <View style={[styles.badge, !completed && styles.badgeCancelled]}><AppText variant="caption" weight="bold" style={completed ? styles.badgeText : styles.badgeCancelledText}>{completed ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}</AppText></View>
      </View>
      <View style={styles.routeRow}>
        <View style={styles.rail}><View style={styles.dotGreen} /><View style={styles.line} /><View style={styles.dotRed} /></View>
        <View style={styles.routeCopy}><AppText weight="semibold" numberOfLines={2}>{ride.departure}</AppText><View style={styles.routeGap} /><AppText weight="semibold" numberOfLines={2}>{ride.destination}</AppText></View>
        <ChevronRight size={20} color={colors.textMuted} />
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.meta}><Route size={16} color={colors.textMuted} /><AppText variant="bodySmall">{formatRideDistance(ride.distance)} • {formatRideDuration(ride.duration)}</AppText></View>
        <AppText weight="bold" style={styles.money}>{formatCurrency(ride.price)}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingHorizontal: spacing.screen },
  tab: { alignItems: 'center', borderBottomColor: 'transparent', borderBottomWidth: 2, flex: 1, justifyContent: 'center', minHeight: 48 },
  tabActive: { borderBottomColor: colors.success },
  tabText: { color: colors.textSecondary },
  tabTextActive: { color: colors.success },
  loading: { padding: spacing.screen },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, marginBottom: spacing.md, padding: spacing.lg },
  pressed: { opacity: 0.72 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  badge: { backgroundColor: colors.successSoft, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  badgeCancelled: { backgroundColor: colors.dangerSoft },
  badgeText: { color: colors.success },
  badgeCancelledText: { color: colors.danger },
  routeRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.md },
  rail: { alignItems: 'center', alignSelf: 'stretch', paddingVertical: 4, width: 24 },
  dotGreen: { backgroundColor: colors.success, borderRadius: radius.full, height: 10, width: 10 },
  dotRed: { backgroundColor: colors.danger, borderRadius: radius.full, height: 10, width: 10 },
  line: { backgroundColor: colors.borderStrong, flex: 1, marginVertical: 3, width: 2 },
  routeCopy: { flex: 1, paddingHorizontal: spacing.sm },
  routeGap: { height: spacing.sm },
  cardFooter: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md },
  meta: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  money: { color: colors.success },
});
