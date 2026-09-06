import React, { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SocketEvents } from '@repo/shared';
import { format, isToday, isTomorrow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  RefreshCw,
  Search,
  Users,
  WifiOff,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RideCard, RideCardSkeleton, type PassengerRouteContext } from '../src/components/RideCard';
import { AppButton } from '../src/components/ui/AppButton';
import { AppText } from '../src/components/ui/AppText';
import { EmptyState } from '../src/components/ui/EmptyState';
import { type RideSearchParams, rideService, type Ride } from '../src/services/ride.service';
import { socketService } from '../src/services/socket.service';
import { colors, layout, radius, spacing } from '../src/theme/tokens';

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
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
    seats: numberParam(params.seats) || 1,
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

  // Realtime updates qua WebSocket: cập nhật ngay khi tài xế đăng chuyến, hủy hoặc cập nhật ghế
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
    ? isToday(departure)
      ? `Hôm nay, ${format(departure, 'dd/MM')}`
      : isTomorrow(departure)
        ? `Ngày mai, ${format(departure, 'dd/MM')}`
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

  // Hệ thống tự động lọc toàn bộ để tìm ra danh sách chuyến đi phù hợp nhất
  const bestRides = useMemo<Ride[]>(() => {
    const rawRides = query.data ?? [];
    if (!rawRides.length) return [];

    const requiredSeats = filters.seats || 1;
    // 1. Lọc các chuyến đảm bảo còn đủ số ghế hành khách yêu cầu
    const validRides = rawRides.filter((ride) => ride.availableSeats >= requiredSeats);

    // 2. Hệ thống tự động xếp hạng theo độ phù hợp tối ưu nhất:
    //    - Điểm so khớp lộ trình cao nhất (matchScore)
    //    - Giờ khởi hành gần nhất với giờ yêu cầu (timeDifferenceMinutes)
    //    - Khoảng cách điểm đón gần hành khách nhất (pickupDistanceKm)
    //    - Độ lệch tuyến nhỏ nhất (detourKm)
    //    - Giá cước tốt nhất (passengerFare ?? price)
    return [...validRides].sort((a, b) => {
      const scoreDiff = (b.matchScore ?? 0) - (a.matchScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;

      const timeDiff = (a.timeDifferenceMinutes ?? 0) - (b.timeDifferenceMinutes ?? 0);
      if (timeDiff !== 0) return timeDiff;

      const pickupDiff = (a.pickupDistanceKm ?? 0) - (b.pickupDistanceKm ?? 0);
      if (pickupDiff !== 0) return pickupDiff;

      const detourDiff = (a.detourKm ?? 0) - (b.detourKm ?? 0);
      if (detourDiff !== 0) return detourDiff;

      const fareA = a.passengerFare ?? a.price;
      const fareB = b.passengerFare ?? b.price;
      return fareA - fareB;
    });
  }, [query.data, filters.seats]);

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header thanh điều hướng */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại tìm kiếm"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <ArrowLeft size={23} color={colors.textPrimary} />
        </Pressable>
        <AppText accessibilityRole="header" variant="h3" weight="semibold" style={styles.headerTitle}>
          Chuyến đi phù hợp
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Làm mới kết quả"
          onPress={() => query.refetch()}
          style={styles.headerButton}
        >
          <RefreshCw size={19} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hộp tóm tắt lộ trình đang tìm kiếm */}
        <View style={styles.summary}>
          <View style={styles.summaryRoute}>
            <View style={styles.routeRail}>
              <View style={styles.originDot} />
              <View style={styles.routeLine} />
              <View style={styles.destinationDot} />
            </View>
            <View style={styles.routeCopy}>
              <View>
                <AppText variant="caption" style={styles.routeLabel}>ĐIỂM ĐÓN</AppText>
                <AppText variant="body" weight="semibold" numberOfLines={1}>
                  {placeName(filters.origin)}
                </AppText>
              </View>
              <View>
                <AppText variant="caption" style={styles.routeLabel}>ĐIỂM ĐẾN</AppText>
                <AppText variant="body" weight="semibold" numberOfLines={1}>
                  {placeName(filters.destination)}
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.summaryMeta}>
            <View style={styles.metaItem}>
              <Clock3 size={15} color={colors.primary} />
              <AppText variant="caption" weight="semibold">
                {departure ? format(departure, 'HH:mm') : '--:--'}
              </AppText>
            </View>
            <View style={styles.metaItem}>
              <CalendarDays size={15} color={colors.primary} />
              <AppText variant="caption" weight="semibold" style={styles.capitalize}>
                {dateLabel}
              </AppText>
            </View>
            <View style={styles.metaItem}>
              <Users size={15} color={colors.primary} />
              <AppText variant="caption" weight="semibold">
                {filters.seats || 1} chỗ
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sửa tiêu chí tìm kiếm"
              onPress={() => router.back()}
              style={styles.editButton}
            >
              <AppText variant="caption" weight="semibold" style={styles.primaryText}>
                Thay đổi
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* Trạng thái tải dữ liệu */}
        {query.isPending ? (
          <View accessibilityRole="progressbar" accessibilityLabel="Đang tìm kiếm chuyến đi phù hợp">
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
          </View>
        ) : query.isError ? (
          /* Trạng thái lỗi kết nối */
          <EmptyState
            icon={<WifiOff size={44} color={colors.danger} />}
            title="Không thể tải danh sách chuyến"
            description="Kiểm tra kết nối mạng rồi thử lại."
            actionTitle="Thử lại"
            onAction={() => query.refetch()}
          />
        ) : bestRides.length > 0 ? (
          /* Danh sách chuyến đi được hệ thống tự động lọc và xếp hạng phù hợp nhất */
          <View>
            <View style={styles.resultHeading}>
              <AppText accessibilityRole="header" variant="h2" weight="semibold">
                {bestRides.length} chuyến đi phù hợp nhất
              </AppText>
              <AppText variant="bodySmall" style={styles.secondaryText}>
                Hệ thống đã tự động lọc chuyến đi theo lộ trình, thời gian đón và chi phí tối ưu cho bạn.
              </AppText>
            </View>

            {bestRides.map((ride, index) => (
              <RideCard
                key={ride.id}
                ride={ride}
                showMatch
                featured={index === 0}
                passengerRoute={passengerRoute}
              />
            ))}
          </View>
        ) : (
          /* Không tìm thấy chuyến nào */
          <View>
            <EmptyState
              icon={<Search size={44} color={colors.textTertiary} />}
              title="Chưa có chuyến đi chung phù hợp"
              description="Hiện chưa có tài xế nào có hành trình phù hợp với tuyến đường và thời gian của bạn."
              actionTitle="Sửa điểm đi / điểm đến"
              onAction={() => router.back()}
            />

            {/* Gợi ý dịch chuyển thời gian */}
            <View style={styles.timeSuggestions}>
              <AppText variant="bodySmall" weight="semibold" style={styles.suggestionTitle}>
                Thử tìm ở các khung giờ lân cận
              </AppText>
              <View style={styles.suggestionActions}>
                <AppButton
                  title="Sớm hơn 30 phút"
                  variant="outline"
                  size="sm"
                  onPress={() => adjustTime(-30)}
                  style={styles.suggestionButton}
                />
                <AppButton
                  title="Muộn hơn 30 phút"
                  variant="outline"
                  size="sm"
                  onPress={() => adjustTime(30)}
                  style={styles.suggestionButton}
                />
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
  header: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    maxWidth: layout.maxContentWidth,
    minHeight: 60,
    paddingHorizontal: spacing.sm,
    width: '100%',
  },
  headerButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: layout.minTouchTarget,
    justifyContent: 'center',
    width: layout.minTouchTarget,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: {
    alignSelf: 'center',
    maxWidth: layout.maxContentWidth,
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    width: '100%',
  },

  // Route summary card
  summary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
    padding: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRoute: { flexDirection: 'row' },
  routeRail: { alignItems: 'center', marginRight: spacing.sm, paddingVertical: 4 },
  originDot: {
    borderColor: colors.mapPickup,
    borderRadius: radius.pill,
    borderWidth: 2.5,
    height: 12,
    width: 12,
    backgroundColor: colors.surface,
  },
  destinationDot: {
    backgroundColor: colors.mapDestination,
    borderRadius: radius.pill,
    height: 11,
    width: 11,
  },
  routeLine: { backgroundColor: colors.borderStrong, height: 32, width: 2 },
  routeCopy: { flex: 1, gap: spacing.sm },
  routeLabel: { color: colors.textTertiary, fontSize: 10, letterSpacing: 0.4 },
  summaryMeta: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  editButton: {
    justifyContent: 'center',
    marginLeft: 'auto',
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.sm,
  },
  primaryText: { color: colors.primary },
  secondaryText: { color: colors.textSecondary, marginTop: spacing.xxs },
  capitalize: { textTransform: 'capitalize' },

  // Results list
  resultHeading: { marginBottom: spacing.lg },

  // Time suggestions when empty
  timeSuggestions: { alignItems: 'center', marginTop: -spacing.md, paddingBottom: spacing.xl },
  suggestionTitle: { marginBottom: spacing.sm, color: colors.textSecondary },
  suggestionActions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  suggestionButton: { flex: 1 },
});
