import React, { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SocketEvents } from '@repo/shared';
import { format, isToday, isTomorrow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CalendarDays, Clock3, RefreshCw, Search, Users, WifiOff } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RideCard, RideCardSkeleton, type PassengerRouteContext } from '../src/components/RideCard';
import { AppButton } from '../src/components/ui/AppButton';
import { AppText } from '../src/components/ui/AppText';
import { EmptyState } from '../src/components/ui/EmptyState';
import { type RideSearchParams, rideService } from '../src/services/ride.service';
import { socketService } from '../src/services/socket.service';
import { colors, layout, radius, spacing } from '../src/theme/tokens';

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const numberParam = (value: string | string[] | undefined) => {
  const parsed = Number(first(value));
  return Number.isFinite(parsed) ? parsed : undefined;
};
const placeName = (value?: string) => value?.split(',')[0]?.trim() || 'Chưa chọn';

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const filters = useMemo<RideSearchParams>(() => ({
    origin: first(params.origin),
    destination: first(params.destination),
    originLat: numberParam(params.originLat),
    originLng: numberParam(params.originLng),
    destinationLat: numberParam(params.destinationLat),
    destinationLng: numberParam(params.destinationLng),
    date: first(params.date),
    seats: numberParam(params.seats),
  }), [params.date, params.destination, params.destinationLat, params.destinationLng, params.origin, params.originLat, params.originLng, params.seats]);

  const queryKey = useMemo(() => ['ride-search', filters] as const, [filters]);
  const query = useQuery({
    queryKey,
    queryFn: () => rideService.getRides(filters),
    enabled: Boolean(
      filters.origin && filters.destination && filters.date &&
      filters.originLat != null && filters.originLng != null &&
      filters.destinationLat != null && filters.destinationLng != null,
    ),
    retry: 1,
  });

  useEffect(() => {
    const refresh = () => void queryClient.invalidateQueries({ queryKey: ['ride-search'] });
    const events = [
      SocketEvents.RIDE_CREATED,
      SocketEvents.RIDE_UPDATED,
      SocketEvents.RIDE_DELETED,
      SocketEvents.RIDE_STATUS_UPDATED,
      SocketEvents.RIDE_SEATS_UPDATED,
      SocketEvents.RIDE_FULL,
    ];
    void socketService.connect();
    events.forEach((event) => socketService.on(event, refresh));
    return () => events.forEach((event) => socketService.off(event, refresh));
  }, [queryClient]);

  const departure = filters.date ? new Date(filters.date) : undefined;
  const dateLabel = departure && !Number.isNaN(departure.getTime())
    ? isToday(departure) ? `Hôm nay, ${format(departure, 'dd/MM')}`
      : isTomorrow(departure) ? `Ngày mai, ${format(departure, 'dd/MM')}`
        : format(departure, 'EEEE, dd/MM', { locale: vi })
    : 'Chưa chọn ngày';
  const passengerRoute: PassengerRouteContext = {
    origin: filters.origin || 'Điểm đón',
    destination: filters.destination || 'Điểm đến',
    originLat: filters.originLat,
    originLng: filters.originLng,
    destinationLat: filters.destinationLat,
    destinationLng: filters.destinationLng,
    date: filters.date,
    seats: filters.seats || 1,
  };

  const adjustTime = (minutes: number) => {
    if (!departure || Number.isNaN(departure.getTime())) return;
    router.setParams({ date: new Date(departure.getTime() + minutes * 60_000).toISOString() });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại tìm kiếm" onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={23} color={colors.textPrimary} />
        </Pressable>
        <AppText accessibilityRole="header" variant="h3" weight="semibold" style={styles.headerTitle}>Chuyến đi phù hợp</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Làm mới kết quả" onPress={() => query.refetch()} style={styles.headerButton}>
          <RefreshCw size={19} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <View style={styles.summaryRoute}>
            <View style={styles.routeRail}><View style={styles.originDot} /><View style={styles.routeLine} /><View style={styles.destinationDot} /></View>
            <View style={styles.routeCopy}>
              <AppText variant="body" weight="semibold" numberOfLines={1}>{placeName(filters.origin)}</AppText>
              <AppText variant="body" weight="semibold" numberOfLines={1}>{placeName(filters.destination)}</AppText>
            </View>
          </View>
          <View style={styles.summaryMeta}>
            <View style={styles.metaItem}><Clock3 size={16} color={colors.primary} /><AppText variant="caption" weight="semibold">{departure ? format(departure, 'HH:mm') : '--:--'}</AppText></View>
            <View style={styles.metaItem}><CalendarDays size={16} color={colors.primary} /><AppText variant="caption" weight="semibold" style={styles.capitalize}>{dateLabel}</AppText></View>
            <View style={styles.metaItem}><Users size={16} color={colors.primary} /><AppText variant="caption" weight="semibold">{filters.seats || 1} người</AppText></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Sửa tiêu chí tìm kiếm" onPress={() => router.back()} style={styles.editButton}>
              <AppText variant="caption" weight="semibold" style={styles.primaryText}>Sửa</AppText>
            </Pressable>
          </View>
        </View>

        {query.isPending ? (
          <View accessibilityRole="progressbar" accessibilityLabel="Đang tìm chuyến">
            <RideCardSkeleton /><RideCardSkeleton /><RideCardSkeleton />
          </View>
        ) : query.isError ? (
          <EmptyState icon={<WifiOff size={44} color={colors.danger} />} title="Không thể tải danh sách chuyến" description="Kiểm tra kết nối mạng rồi thử lại." actionTitle="Thử lại" onAction={() => query.refetch()} />
        ) : query.data?.length ? (
          <View>
            <View style={styles.resultHeading}>
              <AppText accessibilityRole="header" variant="h2" weight="semibold">{query.data.length} chuyến phù hợp với hành trình của bạn</AppText>
              <AppText variant="bodySmall" style={styles.secondaryText}>Xếp theo độ phù hợp, thời gian đón, khoảng cách và độ lệch tuyến.</AppText>
            </View>
            {query.data.map((ride, index) => (
              <RideCard key={ride.id} ride={ride} showMatch featured={index === 0} passengerRoute={passengerRoute} />
            ))}
          </View>
        ) : (
          <View>
            <EmptyState
              icon={<Search size={44} color={colors.textTertiary} />}
              title="Chưa có chuyến phù hợp"
              description="Hiện chưa có tài xế nào có hành trình phù hợp với tuyến đường và thời gian của bạn."
              actionTitle="Sửa điểm đi / điểm đến"
              onAction={() => router.back()}
            />
            <View style={styles.timeSuggestions}>
              <AppText variant="bodySmall" weight="semibold" style={styles.suggestionTitle}>Thử khung giờ khác</AppText>
              <View style={styles.suggestionActions}>
                <AppButton title="Sớm hơn 30 phút" variant="outline" size="sm" onPress={() => adjustTime(-30)} style={styles.suggestionButton} />
                <AppButton title="Muộn hơn 30 phút" variant="outline" size="sm" onPress={() => adjustTime(30)} style={styles.suggestionButton} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  header: { alignSelf: 'center', alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', maxWidth: layout.maxContentWidth, minHeight: 64, paddingHorizontal: spacing.sm, width: '100%' },
  headerButton: { alignItems: 'center', borderRadius: radius.pill, height: layout.minTouchTarget, justifyContent: 'center', width: layout.minTouchTarget },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: { alignSelf: 'center', maxWidth: layout.maxContentWidth, padding: spacing.md, paddingBottom: spacing.xxxl, width: '100%' },
  summary: { backgroundColor: colors.surface, borderRadius: radius.card, marginBottom: spacing.xl, padding: spacing.lg },
  summaryRoute: { flexDirection: 'row' },
  routeRail: { alignItems: 'center', marginRight: spacing.sm, paddingVertical: 5 },
  originDot: { borderColor: colors.mapPickup, borderRadius: radius.pill, borderWidth: 2, height: 11, width: 11 },
  destinationDot: { backgroundColor: colors.mapDestination, borderRadius: radius.pill, height: 10, width: 10 },
  routeLine: { backgroundColor: colors.borderStrong, height: 28, width: 2 },
  routeCopy: { flex: 1, gap: spacing.md },
  summaryMeta: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.sm },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  editButton: { justifyContent: 'center', marginLeft: 'auto', minHeight: layout.minTouchTarget, paddingHorizontal: spacing.sm },
  primaryText: { color: colors.primary },
  secondaryText: { color: colors.textSecondary, marginTop: spacing.xs },
  capitalize: { textTransform: 'capitalize' },
  resultHeading: { marginBottom: spacing.lg },
  timeSuggestions: { alignItems: 'center', marginTop: -spacing.md, paddingBottom: spacing.xl },
  suggestionTitle: { marginBottom: spacing.sm },
  suggestionActions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  suggestionButton: { flex: 1 },
});
