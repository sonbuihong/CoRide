import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { CalendarDays, CarFront, ChevronRight, RefreshCw, Route, WifiOff } from 'lucide-react-native';
import { AppText } from '../../components/ui/AppText';
import { useActivityRealtime } from '../../hooks/useActivityRealtime';
import { getRealtimeRefetchInterval } from '../../hooks/useSocketConnection';
import { activityService } from '../../services/activity.service';
import { useAppStore } from '../../stores/useAppStore';
import { colors, layout, radius, spacing } from '../../theme/tokens';
import { ActivityCard } from './ActivityCard';
import { ActivitySegmentedControl } from './ActivitySegmentedControl';
import type { ActivityAction, ActivityItem, ActivityRole, ActivitySegment } from './activity.types';
import { emptyStateCopy, formatActivityMonth, segmentCountLabel } from './activity.utils';

interface Props { role: ActivityRole }

type ListRow = { type: 'month'; id: string; label: string } | { type: 'activity'; item: ActivityItem };

export function ActivityScreen({ role }: Props) {
  const router = useRouter();
  const listRef = useRef<FlatList<ListRow>>(null);
  const { fontScale, width } = useWindowDimensions();
  const compactLayout = width < 390 || fontScale > 1.15;
  const veryCompactLayout = width < 350 || fontScale > 1.25;
  const [segment, setSegment] = useState<ActivitySegment>('ACTIVE');
  const [now, setNow] = useState(() => new Date());
  const socketConnected = useActivityRealtime();
  const isOffline = useAppStore((state) => state.isOffline);
  const query = useInfiniteQuery({
    queryKey: ['activities', role, segment],
    queryFn: ({ pageParam }) => activityService.getActivities(role, segment, pageParam, 20),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    refetchInterval: getRealtimeRefetchInterval(socketConnected),
  });

  const activities = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const rows = useMemo<ListRow[]>(() => {
    if (segment !== 'COMPLETED' && segment !== 'CANCELLED') return activities.map((item) => ({ type: 'activity', item }));
    const result: ListRow[] = [];
    let currentMonth = '';
    for (const item of activities) {
      const month = formatActivityMonth(item.sortAt);
      if (month !== currentMonth) {
        currentMonth = month;
        result.push({ type: 'month', id: `${month}:${item.sortAt.slice(0, 7)}`, label: month });
      }
      result.push({ type: 'activity', item });
    }
    return result;
  }, [activities, segment]);
  const count = query.data?.pages[0]?.counts?.[segment] ?? 0;

  useEffect(() => {
    if (segment !== 'UPCOMING') return;
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, [segment]);

  const changeSegment = useCallback((next: ActivitySegment) => {
    setSegment(next);
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: false }));
  }, []);

  const navigate = useCallback((action: ActivityAction) => {
    if (action.params) router.push({ pathname: action.route as never, params: action.params } as never);
    else router.push(action.route as never);
  }, [router]);

  const header = (
    <View>
      <View style={[styles.intro, compactLayout && styles.introCompact]}>
        <AppText accessibilityRole="header" variant="h1" weight="semibold">Hoạt động</AppText>
        <AppText variant="bodySmall" style={styles.subtitle}>Theo dõi các chuyến đi của bạn</AppText>
      </View>
      {(isOffline || !socketConnected) ? <ConnectionBanner offline={isOffline} /> : null}
      <ActivitySegmentedControl compact={compactLayout} selected={segment} role={role} onChange={changeSegment} />
      <AppText accessibilityLiveRegion="polite" variant="bodySmall" weight="medium" style={styles.countLabel}>
        {segmentCountLabel(count, segment)}
      </AppText>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        ref={listRef}
        data={query.isLoading ? [] : rows}
        keyExtractor={(row) => row.type === 'month' ? `month:${row.id}` : `${row.item.source}:${row.item.id}`}
        renderItem={({ item }) => item.type === 'month'
          ? <AppText accessibilityRole="header" variant="bodySmall" weight="semibold" style={styles.month}>{item.label}</AppText>
          : <ActivityCard
              item={item.item}
              role={role}
              now={now}
              compactLayout={compactLayout}
              veryCompactLayout={veryCompactLayout}
              onAction={navigate}
            />}
        ListHeaderComponent={header}
        ListEmptyComponent={query.isLoading
          ? <ActivitySkeleton />
          : query.isError
            ? <ActivityError onRetry={() => void query.refetch()} />
            : <ActivityEmpty role={role} segment={segment} />}
        ListFooterComponent={query.isFetchingNextPage ? <ActivitySkeleton count={1} /> : <View style={styles.footerSpace} />}
        contentContainerStyle={[styles.content, compactLayout && styles.contentCompact]}
        onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage(); }}
        onEndReachedThreshold={0.35}
        refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} colors={[role === 'DRIVER' ? colors.navigationDriver : colors.primary]} tintColor={role === 'DRIVER' ? colors.navigationDriver : colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function ConnectionBanner({ offline }: { offline: boolean }) {
  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.connectionBanner}>
      <WifiOff size={17} color={colors.warning} />
      <AppText variant="caption" weight="medium" style={styles.connectionText}>
        {offline ? 'Bạn đang ngoại tuyến. Dữ liệu sẽ cập nhật khi có mạng.' : 'Đang kết nối lại dữ liệu thời gian thực…'}
      </AppText>
    </View>
  );
}

function ActivitySkeleton({ count = 3 }: { count?: number }) {
  return (
    <View accessibilityLabel="Đang tải hoạt động" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={[styles.skeletonBlock, styles.skeletonBadge]} />
          <View style={[styles.skeletonBlock, styles.skeletonLine]} />
          <View style={[styles.skeletonBlock, styles.skeletonLineShort]} />
          <View style={[styles.skeletonBlock, styles.skeletonButton]} />
        </View>
      ))}
    </View>
  );
}

function ActivityError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.state}>
      <View style={[styles.stateIcon, styles.errorIcon]}><RefreshCw size={28} color={colors.danger} /></View>
      <AppText variant="h3" weight="semibold" style={styles.stateTitle}>Không thể tải hoạt động</AppText>
      <AppText variant="bodySmall" style={styles.stateCopy}>Kiểm tra kết nối mạng rồi thử tải lại danh sách chuyến đi.</AppText>
      <StateAction label="Thử lại" onPress={onRetry} />
    </View>
  );
}

function ActivityEmpty({ role, segment }: { role: ActivityRole; segment: ActivitySegment }) {
  const router = useRouter();
  const copy = emptyStateCopy(role, segment);
  const showAction = segment === 'ACTIVE' || segment === 'UPCOMING';
  const Icon = role === 'DRIVER' ? Route : segment === 'UPCOMING' ? CalendarDays : CarFront;
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}><Icon size={30} color={role === 'DRIVER' ? colors.navigationDriver : colors.primary} /></View>
      <AppText variant="h3" weight="semibold" style={styles.stateTitle}>{copy.title}</AppText>
      <AppText variant="bodySmall" style={styles.stateCopy}>{copy.description}</AppText>
      {showAction ? <StateAction label={role === 'DRIVER' ? 'Đăng chuyến' : 'Tìm chuyến'} color={role === 'DRIVER' ? colors.navigationDriver : colors.primary} onPress={() => router.push((role === 'DRIVER' ? '/(driver-tabs)/publish' : '/search') as never)} /> : null}
    </View>
  );
}

function StateAction({ label, onPress, color = colors.primary }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.stateActionTouch, pressed && styles.stateActionPressed, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}>
      <View pointerEvents="none" style={[styles.stateActionSurface, { backgroundColor: color }]}>
        <AppText variant="bodySmall" weight="semibold" style={styles.stateActionText}>{label}</AppText>
        <ChevronRight size={17} color={colors.surface} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { alignSelf: 'center', flexGrow: 1, maxWidth: layout.maxContentWidth, paddingBottom: spacing.xxl, paddingHorizontal: spacing.screen, width: '100%' },
  contentCompact: { paddingHorizontal: spacing.md },
  intro: { paddingBottom: spacing.lg, paddingTop: spacing.xl },
  introCompact: { paddingBottom: spacing.md, paddingTop: spacing.lg },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs },
  connectionBanner: { alignItems: 'center', backgroundColor: colors.warningSoft, borderRadius: radius.input, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, minHeight: 48, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  connectionText: { color: colors.warning, flex: 1 },
  countLabel: { color: colors.textSecondary, marginBottom: spacing.lg, marginTop: spacing.md },
  month: { color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.sm },
  footerSpace: { height: spacing.md },
  skeletonCard: { backgroundColor: colors.surface, borderRadius: radius.button, marginBottom: spacing.md, padding: spacing.lg },
  skeletonBlock: { backgroundColor: colors.border, borderRadius: radius.sm, opacity: 0.7 },
  skeletonBadge: { height: 30, width: 124 },
  skeletonLine: { height: 16, marginTop: spacing.lg, width: '88%' },
  skeletonLineShort: { height: 16, marginTop: spacing.md, width: '64%' },
  skeletonButton: { alignSelf: 'flex-end', height: 44, marginTop: spacing.lg, width: 112 },
  state: { alignItems: 'center', justifyContent: 'center', minHeight: 300, paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl },
  stateIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.full, height: 64, justifyContent: 'center', marginBottom: spacing.lg, width: 64 },
  errorIcon: { backgroundColor: colors.dangerSoft },
  stateTitle: { marginBottom: spacing.sm, textAlign: 'center' },
  stateCopy: { color: colors.textSecondary, maxWidth: 340, textAlign: 'center' },
  stateActionTouch: { borderRadius: radius.full, marginTop: spacing.lg, minHeight: 48 },
  stateActionSurface: { alignItems: 'center', borderRadius: radius.full, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.lg },
  stateActionPressed: { opacity: 0.75 },
  stateActionText: { color: colors.surface },
});
