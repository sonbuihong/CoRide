import React, { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowRight, RefreshCw, Search } from 'lucide-react-native';
import { Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { RideCard, RideCardSkeleton } from '../../src/components/RideCard';
import { AppText } from '../../src/components/ui/AppText';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { rideService } from '../../src/services/ride.service';
import { socketService } from '../../src/services/socket.service';
import { colors, layout, radius, spacing } from '../../src/theme/tokens';

const QUERY_KEY = ['rides'];

export default function PassengerHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const spinValue = useRef(new Animated.Value(0)).current;

  const { data: rides = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => rideService.getRides({}),
  });

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isRefetching) {
      spinValue.setValue(0);
      animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 750,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
    } else {
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isRefetching, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
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
          <AppText
            accessibilityRole="header"
            variant="display"
            weight="semibold"
            style={styles.heroTitle}
          >
            Khởi hành cùng nhau.
          </AppText>
          <AppText variant="bodySmall" numberOfLines={1} style={styles.heroSubtitle}>
            Chia sẻ hành trình, tiết kiệm chi phí và bảo vệ môi trường.
          </AppText>

          {/* Search entry bar – navigates to Search screen */}
          <View style={styles.heroSearchShell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bạn muốn đi đâu?"
              accessibilityHint="Chuyển sang trang tìm kiếm chuyến đi"
              onPress={() => router.push('/search' as any)}
              style={styles.heroSearchTouch}
            >
              <View style={styles.heroSearch}>
                <View style={styles.heroSearchIcon}>
                  <Search size={22} color={colors.textSecondary} strokeWidth={2.2} />
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
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Ride list section */}
      <View style={styles.content}>
        <View style={styles.resultsHeader}>
          <View style={styles.titleGroup}>
            <AppText
              accessibilityRole="header"
              style={styles.resultsTitle}
            >
              Chuyến đi phù hợp
            </AppText>
            {!isLoading && rides.length > 0 && (
              <View style={styles.countBadge}>
                <AppText style={styles.countBadgeText}>{rides.length} chuyến</AppText>
              </View>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Làm mới danh sách chuyến đi"
            accessibilityHint="Cập nhật danh sách chuyến đi mới nhất"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={isRefetching}
            onPress={() => refetch()}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.refreshPressed,
              isRefetching && styles.disabled,
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RefreshCw
                size={15}
                color={isRefetching ? colors.primary : colors.textSecondary}
                strokeWidth={2.2}
              />
            </Animated.View>
          </Pressable>
        </View>

        {isLoading ? (
          <View>
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
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
            title="Chưa có chuyến phù hợp"
            description="Thử thay đổi điểm đến, thời gian hoặc kéo xuống để làm mới danh sách."
            actionTitle="Làm mới"
            onAction={() => refetch()}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { backgroundColor: '#F0F2F6', paddingBottom: spacing.xxl },
  hero: { backgroundColor: '#080808', overflow: 'hidden', paddingBottom: spacing.xxxl, paddingHorizontal: spacing.md, paddingTop: spacing.xxxl, position: 'relative' },
  heroGlow: { alignSelf: 'center', backgroundColor: 'rgba(0,113,227,0.30)', borderRadius: 220, height: 220, position: 'absolute', top: -110, width: 340 },
  heroContent: { alignSelf: 'center', maxWidth: layout.maxContentWidth, width: '100%', zIndex: 1 },
  heroTitle: { alignSelf: 'center', color: colors.surface, letterSpacing: -0.6, maxWidth: 360, textAlign: 'center' },
  heroSubtitle: { alignSelf: 'center', color: colors.surface, fontSize: 11, letterSpacing: -0.25, lineHeight: 16, marginTop: spacing.xs, opacity: 0.68, textAlign: 'center', width: '100%' },
  heroSearchShell: { alignSelf: 'stretch', borderRadius: radius.input, elevation: 12, marginTop: spacing.xxl, shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.24, shadowRadius: 20 },
  heroSearchTouch: { alignSelf: 'stretch', backgroundColor: colors.surface, borderRadius: radius.input, height: 60, overflow: 'hidden', width: '100%' },
  heroSearch: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.input, flexDirection: 'row', gap: spacing.sm, height: 60, paddingLeft: spacing.md, paddingRight: spacing.xs, width: '100%' },
  heroSearchPressed: { backgroundColor: colors.surfaceMuted, opacity: 0.94 },
  heroSearchIcon: { alignItems: 'center', flexShrink: 0, height: 24, justifyContent: 'center', width: 24 },
  heroSearchText: { color: colors.textSecondary, flex: 1, flexShrink: 1, fontSize: 16, fontWeight: '400', letterSpacing: -0.2, lineHeight: 22, minWidth: 0, textAlignVertical: 'center' },
  heroSearchAction: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.input, flexShrink: 0, height: 44, justifyContent: 'center', width: 44 },
  content: { alignSelf: 'center', maxWidth: layout.maxContentWidth, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, width: '100%' },
  resultsHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 4 },
  titleGroup: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: 8 },
  resultsTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  countBadge: { backgroundColor: 'rgba(0, 113, 227, 0.08)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  refreshPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.09)',
    transform: [{ scale: 0.94 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
