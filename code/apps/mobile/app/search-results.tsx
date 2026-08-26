import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CalendarDays, RefreshCw, Search, Users, WifiOff } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RideCard, RideCardSkeleton } from '../src/components/RideCard';
import { AppText } from '../src/components/ui/AppText';
import { EmptyState } from '../src/components/ui/EmptyState';
import { type RideSearchParams, rideService } from '../src/services/ride.service';
import { colors, layout, radius, spacing } from '../src/theme/tokens';

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const numberParam = (value: string | string[] | undefined) => {
  const parsed = Number(first(value));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const filters: RideSearchParams = {
    origin: first(params.origin),
    destination: first(params.destination),
    originLat: numberParam(params.originLat),
    originLng: numberParam(params.originLng),
    destinationLat: numberParam(params.destinationLat),
    destinationLng: numberParam(params.destinationLng),
    date: first(params.date),
    seats: numberParam(params.seats),
  };

  const query = useQuery({
    queryKey: ['ride-search', filters],
    queryFn: () => rideService.getRides(filters),
    enabled: Boolean(filters.origin && filters.destination && filters.date),
    retry: 1,
  });

  const departure = filters.date ? new Date(filters.date) : undefined;
  const destinationName = filters.destination?.split(',')[0] || 'điểm đến';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại tìm kiếm" onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={23} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText variant="h3" weight="semibold">Chuyến đi phù hợp</AppText>
          <AppText variant="caption" numberOfLines={1} style={styles.secondaryText}>Đến {destinationName}</AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Làm mới kết quả" onPress={() => query.refetch()} style={styles.headerButton}>
          <RefreshCw size={19} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <View style={styles.summaryRoute}>
            <View style={styles.routeRail}><View style={styles.originDot} /><View style={styles.routeLine} /><View style={styles.destinationDot} /></View>
            <View style={styles.routeCopy}>
              <AppText variant="bodySmall" weight="semibold" numberOfLines={1}>{filters.origin}</AppText>
              <AppText variant="bodySmall" weight="semibold" numberOfLines={1}>{filters.destination}</AppText>
            </View>
          </View>
          <View style={styles.summaryMeta}>
            <View style={styles.metaItem}><CalendarDays size={16} color={colors.primary} /><AppText variant="caption" weight="semibold">{departure && !Number.isNaN(departure.getTime()) ? format(departure, 'HH:mm · dd/MM/yyyy') : 'Chưa chọn giờ'}</AppText></View>
            <View style={styles.metaItem}><Users size={16} color={colors.primary} /><AppText variant="caption" weight="semibold">{filters.seats || 1} ghế</AppText></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Sửa tiêu chí tìm kiếm" onPress={() => router.back()} style={styles.editButton}><AppText variant="caption" weight="semibold" style={styles.primaryText}>Sửa</AppText></Pressable>
          </View>
        </View>

        {query.isPending ? (
          <View accessibilityRole="progressbar" accessibilityLabel="Đang tìm chuyến">
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
          </View>
        ) : query.isError ? (
          <EmptyState icon={<WifiOff size={44} color={colors.danger} />} title="Không thể tải danh sách chuyến" description="Kiểm tra kết nối mạng rồi thử lại." actionTitle="Thử lại" onAction={() => query.refetch()} />
        ) : query.data?.length ? (
          <View>
            <View style={styles.resultHeading}>
              <AppText variant="h2" weight="semibold">{query.data.length} chuyến tìm thấy</AppText>
              <AppText variant="caption" style={styles.secondaryText}>Ưu tiên chuyến gần tuyến và đúng thời gian</AppText>
            </View>
            {query.data.map((ride) => <RideCard key={ride.id} ride={ride} showMatch />)}
          </View>
        ) : (
          <EmptyState icon={<Search size={44} color={colors.textTertiary} />} title="Chưa có chuyến phù hợp" description="Hãy thử đổi giờ khởi hành hoặc chọn một điểm đến gần tuyến đường chính hơn." actionTitle="Sửa tìm kiếm" onAction={() => router.back()} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F0F2F6', flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 64, paddingHorizontal: spacing.sm },
  headerButton: { alignItems: 'center', borderRadius: radius.pill, height: layout.minTouchTarget, justifyContent: 'center', width: layout.minTouchTarget },
  headerCopy: { flex: 1, minWidth: 0, paddingHorizontal: spacing.xs },
  content: { alignSelf: 'center', maxWidth: layout.maxContentWidth, padding: spacing.md, paddingBottom: spacing.xxxl, width: '100%' },
  summary: { backgroundColor: colors.surface, borderRadius: radius.card, marginBottom: spacing.xl, padding: spacing.md },
  summaryRoute: { flexDirection: 'row' },
  routeRail: { alignItems: 'center', marginRight: spacing.sm, paddingVertical: 5 },
  originDot: { borderColor: colors.mapPickup, borderRadius: radius.pill, borderWidth: 2, height: 10, width: 10 },
  destinationDot: { borderColor: colors.mapDestination, borderRadius: radius.pill, borderWidth: 2, height: 10, width: 10 },
  routeLine: { backgroundColor: colors.borderStrong, height: 24, width: 2 },
  routeCopy: { flex: 1, gap: spacing.md },
  summaryMeta: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.sm },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.xxs },
  editButton: { marginLeft: 'auto', minHeight: layout.minTouchTarget, justifyContent: 'center', paddingHorizontal: spacing.sm },
  primaryText: { color: colors.primary }, secondaryText: { color: colors.textSecondary },
  resultHeading: { marginBottom: spacing.md },
  skeletonList: { gap: spacing.md }, skeletonCard: { backgroundColor: colors.surface, borderRadius: radius.card, gap: spacing.md, padding: spacing.md },
});
