import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowRight, RefreshCw, Search } from 'lucide-react-native';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { RideCard } from '../../src/components/RideCard';
import { AppText } from '../../src/components/ui/AppText';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import { rideService } from '../../src/services/ride.service';
import { socketService } from '../../src/services/socket.service';
import { colors, layout, radius, spacing } from '../../src/theme/tokens';

const QUERY_KEY = ['rides'];

export default function PassengerHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: rides = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => rideService.getRides({}),
  });

  useEffect(() => {
    let active = true;
    const refresh = () => { if (active) refetch(); };
    const remove = ({ id }: { id: string }) => {
      if (active) queryClient.setQueryData(QUERY_KEY, (current: any[] | undefined) => current?.filter((ride) => ride.id !== id));
    };
    const updateStatus = ({ rideId, status }: { rideId: string; status: string }) => {
      if (status === 'CANCELLED' || status === 'COMPLETED') remove({ id: rideId });
      else refresh();
    };

    socketService.connect().then(() => {
      if (!active) return;
      socketService.on('ride:created', refresh);
      socketService.on('ride:updated', refresh);
      socketService.on('ride:deleted', remove);
      socketService.on('ride:status', updateStatus);
    });
    return () => {
      active = false;
      socketService.off('ride:created', refresh);
      socketService.off('ride:updated', refresh);
      socketService.off('ride:deleted', remove);
      socketService.off('ride:status', updateStatus);
    };
  }, [queryClient, refetch]);

  const resultTitle = isLoading
    ? 'Đang tải...'
    : rides.length
      ? `Khám phá ${rides.length} chuyến đi`
      : 'Chưa có chuyến đi nào';

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Hero section */}
      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.heroGlow} />
        <View style={styles.heroContent}>
          <AppText accessibilityRole="header" style={styles.heroTitle}>Khởi hành cùng nhau.</AppText>
          <AppText style={styles.heroSubtitle}>
            Chia sẻ hành trình, tiết kiệm chi phí và bảo vệ môi trường.
          </AppText>

          {/* Search entry pill – navigates to Search screen */}
          <View style={styles.heroSearchShell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tìm chuyến đi"
              accessibilityHint="Chuyển sang trang tìm kiếm chuyến đi"
              onPress={() => router.push('/search' as any)}
              style={({ pressed }) => [styles.heroSearch, pressed && styles.heroSearchPressed]}
            >
              <View style={styles.heroSearchIcon}>
                <Search size={20} color="#FFFFFF" strokeWidth={2.2} />
              </View>
              <AppText
                style={styles.heroSearchText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Bạn muốn đi đâu?
              </AppText>
              <View style={styles.heroSearchAction}>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.2} />
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Ride list section */}
      <View style={styles.content}>
        <View style={styles.resultsHeader}>
          <AppText accessibilityRole="header" style={styles.resultsTitle}>{resultTitle}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Làm mới danh sách chuyến đi"
            disabled={isRefetching}
            onPress={() => refetch()}
            style={({ pressed }) => [styles.refreshButton, pressed && styles.refreshPressed, isRefetching && styles.disabled]}
          >
            {isRefetching
              ? <ActivityIndicator size="small" color={colors.textPrimary} />
              : <RefreshCw size={16} color={colors.textPrimary} />}
            <AppText variant="bodySmall" weight="medium">Làm mới</AppText>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.skeletonCard}>
            <SkeletonLoader height={20} width="45%" />
            <SkeletonLoader height={48} width="100%" borderRadius={14} />
            <SkeletonLoader height={76} width="100%" borderRadius={14} />
          </View>
        ) : isError ? (
          <EmptyState
            title="Không thể tải danh sách chuyến đi"
            description="Vui lòng kiểm tra kết nối mạng và thử lại."
            actionTitle="Thử lại"
            onAction={() => refetch()}
          />
        ) : rides.length ? (
          rides.map((ride) => <RideCard key={ride.id} ride={ride} showMatch={false} />)
        ) : (
          <EmptyState
            title="Chưa có chuyến đi nào"
            description="Hãy quay lại sau hoặc kéo xuống để làm mới danh sách."
            actionTitle="Làm mới"
            onAction={() => refetch()}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { backgroundColor: colors.background, paddingBottom: spacing.xxl },
  hero: { backgroundColor: '#080808', overflow: 'hidden', paddingBottom: 64, paddingHorizontal: spacing.md, paddingTop: 54, position: 'relative' },
  heroGlow: { alignSelf: 'center', backgroundColor: 'rgba(0,113,227,0.30)', borderRadius: 260, height: 260, position: 'absolute', top: -130, width: 400 },
  heroContent: { alignSelf: 'center', maxWidth: layout.maxContentWidth, width: '100%' },
  heroTitle: { color: '#FFFFFF', fontSize: 38, fontWeight: '700', letterSpacing: -0.8, lineHeight: 42, textAlign: 'center' },
  heroSubtitle: { color: 'rgba(255,255,255,0.50)', fontSize: 14, letterSpacing: -0.15, lineHeight: 22, marginHorizontal: spacing.sm, marginTop: spacing.sm, textAlign: 'center' },
  heroSearchShell: { alignSelf: 'stretch', elevation: 20, marginHorizontal: -4, marginTop: spacing.xxxl, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.50, shadowRadius: 28 },
  heroSearch: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#1C1C1E', borderColor: 'rgba(255,255,255,0.12)', borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', flexWrap: 'nowrap', gap: spacing.sm, height: 64, paddingHorizontal: 9, width: '100%' },
  heroSearchPressed: { backgroundColor: '#242426', borderColor: 'rgba(255,255,255,0.22)', opacity: 0.95 },
  heroSearchIcon: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.pill, flexShrink: 0, height: 44, justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.55, shadowRadius: 14, width: 44 },
  heroSearchText: { color: 'rgba(255,255,255,0.82)', flex: 1, flexShrink: 1, fontSize: 16, fontWeight: '500', letterSpacing: -0.2, lineHeight: 20, minWidth: 0, paddingHorizontal: spacing.xxs, textAlignVertical: 'center' },
  heroSearchAction: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.pill, flexShrink: 0, height: 44, justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.45, shadowRadius: 8, width: 44 },
  content: { alignSelf: 'center', maxWidth: layout.maxContentWidth, paddingHorizontal: spacing.md, paddingTop: spacing.xxxl, width: '100%' },
  resultsHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', marginBottom: spacing.xl },
  resultsTitle: { color: colors.textPrimary, flex: 1, fontSize: 28, fontWeight: '600', letterSpacing: -0.42, lineHeight: 32 },
  refreshButton: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, minHeight: 44, paddingHorizontal: spacing.md },
  refreshPressed: { backgroundColor: 'rgba(0,0,0,0.09)' },
  disabled: { opacity: 0.5 },
  skeletonCard: { backgroundColor: colors.surface, borderRadius: 24, gap: spacing.md, padding: spacing.lg },
});
