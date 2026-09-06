import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Clock3, MapPin, Users, WalletCards } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { colors, layout, radius, spacing } from '../../src/theme/tokens';
import { formatCurrency, formatRideDistance, formatRideDuration } from '../../src/features/trip-flow/trip-flow';

export default function TripCompletedScreen() {
  const params = useLocalSearchParams<{ rideId: string; distanceKm?: string; durationMinutes?: string; passengers?: string; total?: string }>();
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;
      if (reduceMotion) scale.setValue(1);
      else Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 150, useNativeDriver: true }).start();
    });
    return () => { active = false; };
  }, [scale]);

  return (
    <View style={styles.canvas}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top', 'bottom']} style={styles.viewport}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Animated.View style={[styles.successIcon, { transform: [{ scale }] }]}><Check size={42} color={colors.surface} strokeWidth={3} /></Animated.View>
          <AppText variant="h1" weight="bold" style={styles.title}>Bạn đã hoàn thành chuyến đi!</AppText>
          <AppText style={styles.subtitle}>Cảm ơn bạn đã đồng hành cùng CoRide.</AppText>

          <View style={styles.summary}>
            <AppText variant="h3" weight="bold" style={styles.summaryTitle}>Tổng kết chuyến</AppText>
            <SummaryRow icon={<MapPin size={20} color={colors.info} />} label="Quãng đường" value={formatRideDistance(Number(params.distanceKm || 0))} />
            <SummaryRow icon={<Clock3 size={20} color={colors.info} />} label="Thời gian" value={formatRideDuration(Number(params.durationMinutes || 0))} />
            <SummaryRow icon={<Users size={20} color={colors.info} />} label="Hành khách" value={params.passengers || '0'} />
            <SummaryRow icon={<WalletCards size={20} color={colors.success} />} label="Chi phí chia sẻ" value={formatCurrency(Number(params.total || 0))} emphasis />
            <View style={styles.paymentRow}><AppText variant="bodySmall" style={styles.paymentLabel}>Thanh toán</AppText><AppText variant="bodySmall" weight="semibold">Theo từng đặt chỗ</AppText></View>
          </View>
        </ScrollView>
        <View style={styles.actions}>
          <AppButton variant="driver" title="Xem chi tiết chuyến" onPress={() => router.replace(`/driver/trips/${params.rideId}` as never)} />
          <AppButton variant="outline" title="Về trang chủ" onPress={() => router.replace('/(driver-tabs)' as never)} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function SummaryRow({ icon, label, value, emphasis }: { icon: React.ReactNode; label: string; value: string; emphasis?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <AppText weight="bold" style={emphasis ? styles.money : undefined}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { alignItems: 'center', backgroundColor: 'transparent', flex: 1 },
  viewport: { backgroundColor: colors.background, flex: 1, justifyContent: 'space-between', maxWidth: layout.maxContentWidth, width: '100%' },
  content: { alignItems: 'center', flexGrow: 1, padding: spacing.screen, paddingTop: spacing['2xl'] },
  successIcon: { alignItems: 'center', backgroundColor: colors.driverAccent, borderRadius: 42, height: 84, justifyContent: 'center', shadowColor: colors.success, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 12, width: 84 },
  title: { marginTop: spacing.xl, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  summary: { backgroundColor: colors.surface, borderRadius: radius.card, marginTop: spacing['2xl'], padding: spacing.lg, width: '100%' },
  summaryTitle: { marginBottom: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 52 },
  rowIcon: { alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: radius.full, height: 38, justifyContent: 'center', width: 38 },
  rowLabel: { color: colors.textSecondary, flex: 1, marginLeft: spacing.md },
  money: { color: colors.success },
  paymentRow: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.md },
  paymentLabel: { color: colors.textSecondary },
  actions: { gap: spacing.sm, padding: spacing.screen },
});
