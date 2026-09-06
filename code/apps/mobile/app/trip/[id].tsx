import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack as ExpoStack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bike, CalendarClock, Car } from 'lucide-react-native';
import { format, isValid } from 'date-fns';

import { AppText } from '../../src/components/ui/AppText';
import { tripService } from '../../src/services/trip.service';
import { colors, layout, radius, spacing } from '../../src/theme/tokens';

const Stack = {
  Screen: ({ children: _children, ...props }: React.ComponentProps<typeof ExpoStack.Screen> & { children?: React.ReactNode }) => <ExpoStack.Screen {...props} />,
};

const labels: Record<string, string> = { PENDING: 'Đang chờ', MATCHING: 'Đang tìm tài xế', ACCEPTED: 'Đã có tài xế', ARRIVING: 'Tài xế đang đến', ARRIVED: 'Tài xế đã đến', IN_PROGRESS: 'Đang di chuyển', WAITING_PAYMENT: 'Chờ thanh toán', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', NO_DRIVER: 'Không tìm thấy tài xế' };

export default function RideHailingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useQuery({ queryKey: ['trip-detail', id], queryFn: () => tripService.getTripById(id), enabled: Boolean(id) });
  const trip = query.data;
  return <View style={styles.screen}><Stack.Screen options={{ headerShown: false }}><></></Stack.Screen><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={styles.back}><ArrowLeft size={22} color={colors.textPrimary} /></Pressable><AppText variant="h3" weight="semibold">Chi tiết chuyến đặt xe</AppText><View style={styles.back} /></View>
    {query.isLoading ? <View style={styles.body}><View style={styles.skeleton} /><View style={styles.skeleton} /></View> : query.isError || !trip ? <View style={styles.state}><AppText variant="h3" weight="semibold">Không thể tải chuyến đi</AppText><Pressable onPress={() => void query.refetch()} style={styles.action}><AppText style={styles.actionText} weight="semibold">Thử lại</AppText></Pressable></View> : <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.statusRow}><View style={styles.type}><AppText variant="caption" weight="semibold" style={styles.blue}>ĐẶT XE</AppText></View><AppText weight="semibold" style={styles.blue}>{labels[trip.status] || trip.status}</AppText></View>
      <View style={styles.card}><View style={styles.route}><View style={styles.rail}><View style={styles.start} /><View style={styles.line} /><View style={styles.end} /></View><View style={styles.copy}><AppText>{trip.originAddress}</AppText><View style={styles.gap} /><AppText>{trip.destAddress}</AppText></View></View></View>
      <View style={styles.card}><Info icon={<CalendarClock size={19} color={colors.textMuted} />} label="Thời gian" value={formatDate(trip.createdAt)} /><Info icon={trip.vehicleType === 'CAR' ? <Car size={19} color={colors.textMuted} /> : <Bike size={19} color={colors.textMuted} />} label="Loại xe" value={trip.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'} /><Info label="Chi phí" value={formatPrice(trip.finalPrice ?? trip.estimatedPrice)} /><Info label="Thanh toán" value={trip.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'} /></View>
      {trip.driver && <View style={styles.card}><AppText variant="caption">Tài xế</AppText><AppText weight="semibold">{[trip.driver.firstName, trip.driver.lastName].filter(Boolean).join(' ') || 'Tài xế CoRide'}</AppText></View>}
    </ScrollView>}
  </View>;
}
function Info({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) { return <View style={styles.info}>{icon}<View style={styles.infoCopy}><AppText variant="caption">{label}</AppText><AppText weight="medium">{value}</AppText></View></View>; }
function formatDate(value?: string) { if (!value) return 'Chưa xác định'; const date = new Date(value); return isValid(date) ? format(date, 'HH:mm · dd/MM/yyyy') : 'Chưa xác định'; }
function formatPrice(value?: number | null) { return typeof value === 'number' ? `${value.toLocaleString('vi-VN')}đ` : 'Chưa có giá'; }
const styles = StyleSheet.create({ screen: { backgroundColor: colors.background, flex: 1 }, header: { alignSelf: 'center', alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', maxWidth: layout.maxContentWidth, minHeight: 60, paddingHorizontal: spacing.md, width: '100%' }, back: { alignItems: 'center', justifyContent: 'center', minHeight: layout.minTouchTarget, width: layout.minTouchTarget }, body: { alignSelf: 'center', gap: spacing.md, maxWidth: layout.maxContentWidth, padding: spacing.screen, width: '100%' }, statusRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, type: { backgroundColor: colors.primarySoft, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, blue: { color: colors.primary }, card: { backgroundColor: colors.surface, borderRadius: radius.card, gap: spacing.lg, padding: spacing.lg }, route: { flexDirection: 'row' }, rail: { alignItems: 'center', width: 20 }, start: { backgroundColor: colors.success, borderRadius: 6, height: 12, width: 12 }, line: { backgroundColor: colors.borderStrong, flex: 1, marginVertical: 3, width: 2 }, end: { backgroundColor: colors.danger, borderRadius: 6, height: 12, width: 12 }, copy: { flex: 1, paddingLeft: spacing.sm }, gap: { height: spacing.xl }, info: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 44 }, infoCopy: { flex: 1 }, state: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl }, action: { backgroundColor: colors.primary, borderRadius: radius.button, marginTop: spacing.lg, minHeight: layout.minTouchTarget, paddingHorizontal: spacing.xl, justifyContent: 'center' }, actionText: { color: colors.surface }, skeleton: { backgroundColor: colors.border, borderRadius: radius.card, height: 160 } });
