import React, { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SocketEvents } from '@repo/shared';
import { format, isToday, isTomorrow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Bike, CalendarDays, Clock3, RefreshCw, Search, Sparkles, Users, WifiOff } from 'lucide-react-native';
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

  const handleGoToRideHailing = () => {
    router.push({
      pathname: '/(passenger-tabs)/ride-hailing',
      params: {
        pickup: filters.origin || '',
        dropoff: filters.destination || '',
        pickupLat: filters.originLat != null ? String(filters.originLat) : '',
        pickupLng: filters.originLng != null ? String(filters.originLng) : '',
        dropoffLat: filters.destinationLat != null ? String(filters.destinationLat) : '',
        dropoffLng: filters.destinationLng != null ? String(filters.destinationLng) : '',
      },
    } as never);
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
            {/* Quick Hailing banner when carpool rides exist */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đặt xe riêng đi ngay"
              onPress={handleGoToRideHailing}
              style={({ pressed }) => [styles.quickHailingBanner, pressed && styles.bannerPressed]}
            >
              <View style={styles.quickHailingIcon}>
                <Bike size={20} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodySmall" weight="semibold">Cần đi gấp? Đặt xe đón ngay</AppText>
                <AppText variant="caption" style={styles.secondaryText}>Đi xe riêng · Không cần chờ ghép chuyến</AppText>
              </View>
              <ArrowRight size={18} color={colors.primary} />
            </Pressable>

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
            {/* Prominent Ride-Hailing Callout Card when no carpool ride found */}
            <View style={styles.hailingHeroCard}>
              <View style={styles.hailingHeroBadge}>
                <Sparkles size={14} color={colors.primary} />
                <AppText variant="caption" weight="semibold" style={styles.primaryText}>DỊCH VỤ ĐẶT XE ĐI NGAY</AppText>
              </View>
              <AppText variant="h2" weight="semibold" style={styles.hailingHeroTitle}>Không có xe ghép? Đặt xe đi ngay!</AppText>
              <AppText variant="bodySmall" style={styles.hailingHeroDesc}>
                Tài xế CoRide (Xe máy / Ô tô) sẽ đến đón bạn trực tiếp theo đúng lộ trình này mà không cần chờ đợi.
              </AppText>
              <AppButton
                title="ĐẶT XE NGAY (RIDE-HAILING)"
                variant="passenger"
                leftIcon={<Bike size={20} color={colors.surface} />}
                onPress={handleGoToRideHailing}
                style={styles.hailingHeroButton}
              />
            </View>

            <EmptyState
              icon={<Search size={44} color={colors.textTertiary} />}
              title="Chưa có chuyến đi chung phù hợp"
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
  flex: { flex: 1 },
  quickHailingBanner: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  quickHailingIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  bannerPressed: {
    opacity: 0.82,
  },
  hailingHeroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.card,
    borderWidth: 1,
    elevation: 3,
    gap: spacing.sm,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  hailingHeroBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  hailingHeroTitle: {
    letterSpacing: -0.3,
  },
  hailingHeroDesc: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  hailingHeroButton: {
    marginTop: spacing.xs,
  },
});
