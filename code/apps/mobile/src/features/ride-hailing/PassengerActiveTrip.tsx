import { memo, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import {
  Check,
  CircleHelp,
  Clock3,
  MapPin,
  Phone,
  Route,
  ShieldCheck,
  Star,
} from 'lucide-react-native';
import type { TripStatus } from '@repo/shared';

import { ActiveRideMap, type ActiveRideMapHandle } from '../../components/ActiveRideMap';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { DraggableBottomSheet } from '../../components/ui/DraggableBottomSheet';
import { FloatingMyLocation } from '../../components/ui/FloatingMyLocation';
import { usePassengerTrackDriver } from '../../hooks/useDriverLocation';
import { getDirections } from '../../services/direction.service';
import type { RideHailingTrip } from '../../services/trip.service';
import { colors, layout, radius, spacing } from '../../theme/tokens';

interface PassengerActiveTripProps {
  trip: RideHailingTrip;
  action: 'cancel' | 'payment' | 'retry' | null;
  error?: string;
  onCancel: () => void;
  onPayment: () => void;
  onRetry: () => void;
  onAdjustPickup: () => void;
  onRate: () => void;
  onDone: () => void;
}

const STATUS_COPY: Record<TripStatus, { title: string; description: string }> = {
  PENDING: { title: 'Đang chuẩn bị tìm tài xế', description: 'CoRide đang xác nhận yêu cầu của bạn.' },
  MATCHING: { title: 'Đang tìm tài xế phù hợp…', description: 'Ưu tiên tài xế gần và có hành trình cùng hướng.' },
  ACCEPTED: { title: 'Đã tìm được tài xế', description: 'Tài xế đang chuẩn bị di chuyển đến điểm đón.' },
  ARRIVING: { title: 'Tài xế đang đến', description: 'Hãy sẵn sàng tại điểm đón và để ý điện thoại.' },
  ARRIVED: { title: 'TÀI XẾ ĐÃ ĐẾN', description: 'Tài xế đang chờ bạn tại điểm đón.' },
  IN_PROGRESS: { title: 'Đang đến điểm đến', description: 'Theo dõi hành trình và thời gian còn lại trên bản đồ.' },
  WAITING_PAYMENT: { title: 'Chuyến đi hoàn thành', description: 'Kiểm tra chi phí do hệ thống tính trước khi thanh toán.' },
  COMPLETED: { title: 'Đã thanh toán', description: 'Cảm ơn bạn đã đồng hành cùng CoRide.' },
  CANCELLED: { title: 'Chuyến đi đã hủy', description: 'Bạn có thể điều chỉnh thông tin và đặt lại chuyến.' },
  NO_DRIVER: { title: 'Không tìm thấy tài xế phù hợp', description: 'Thử tìm lại hoặc điều chỉnh điểm đón để có thêm lựa chọn.' },
};

const TRACKED_STATUSES: TripStatus[] = ['ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS'];

const PassengerTripMap = memo(function PassengerTripMap({
  trip,
  sheetPosition,
}: {
  trip: RideHailingTrip;
  sheetPosition: SharedValue<number>;
}) {
  const mapRef = useRef<ActiveRideMapHandle>(null);
  const [routeCoords, setRouteCoords] = useState([
    { latitude: trip.originLat, longitude: trip.originLng },
    { latitude: trip.destLat, longitude: trip.destLng },
  ]);
  const [centered, setCentered] = useState(true);
  const driverLocation = usePassengerTrackDriver(
    trip.driverId && TRACKED_STATUSES.includes(trip.status) ? trip.id : null,
  );

  useEffect(() => {
    let cancelled = false;
    void getDirections(
      { latitude: trip.originLat, longitude: trip.originLng },
      { latitude: trip.destLat, longitude: trip.destLng },
      trip.vehicleType === 'CAR' ? 'car' : 'bike',
    ).then((route) => {
      if (!cancelled && route?.polylineCoords.length) setRouteCoords(route.polylineCoords);
    });
    return () => { cancelled = true; };
  }, [trip.destLat, trip.destLng, trip.originLat, trip.originLng, trip.vehicleType]);

  return (
    <>
      <ActiveRideMap
        ref={mapRef}
        originCoords={{ latitude: trip.originLat, longitude: trip.originLng }}
        destinationCoords={{ latitude: trip.destLat, longitude: trip.destLng }}
        routeCoords={routeCoords}
        driverLocation={driverLocation}
        originLabel={trip.originAddress}
        destinationLabel={trip.destAddress}
        onUserPan={() => setCentered(false)}
      />
      <FloatingMyLocation
        animatedPosition={sheetPosition}
        isCentered={centered}
        onRecenter={(location) => {
          mapRef.current?.recenter({
            latitude: location.latitude,
            longitude: location.longitude,
          });
          setCentered(true);
        }}
      />
    </>
  );
});

export function PassengerActiveTrip({
  trip,
  action,
  error,
  onCancel,
  onPayment,
  onRetry,
  onAdjustPickup,
  onRate,
  onDone,
}: PassengerActiveTripProps) {
  const sheetPosition = useSharedValue(0);
  const [now, setNow] = useState(Date.now());
  const copy = STATUS_COPY[trip.status];
  const driverName = [trip.driver?.firstName, trip.driver?.lastName].filter(Boolean).join(' ') || 'Tài xế CoRide';
  const vehicle = trip.driver?.vehicles?.[0];
  const alreadyRated = trip.driverId
    ? trip.reviews?.some((review) => review.revieweeId === trip.driverId)
    : false;

  useEffect(() => {
    if (trip.status !== 'ARRIVED' || !trip.arrivedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [trip.arrivedAt, trip.status]);

  const waitingSeconds = trip.arrivedAt
    ? Math.max(0, Math.floor((now - Date.parse(trip.arrivedAt)) / 1000))
    : 0;
  const waitingText = `${String(Math.floor(waitingSeconds / 60)).padStart(2, '0')}:${String(waitingSeconds % 60).padStart(2, '0')}`;
  const canCancel = ['PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED'].includes(trip.status);

  const footer = trip.status === 'WAITING_PAYMENT' ? (
    <AppButton title="THANH TOÁN" variant="passenger" isLoading={action === 'payment'} onPress={onPayment} />
  ) : trip.status === 'COMPLETED' ? (
    alreadyRated || !trip.driverId
      ? <AppButton title="XONG" variant="passenger" onPress={onDone} />
      : <AppButton title="GỬI ĐÁNH GIÁ" variant="passenger" onPress={onRate} />
  ) : trip.status === 'NO_DRIVER' ? (
    <View style={styles.footerStack}>
      <AppButton title="TÌM LẠI" variant="passenger" isLoading={action === 'retry'} onPress={onRetry} />
      <AppButton title="ĐIỀU CHỈNH ĐIỂM ĐÓN" variant="ghost" onPress={onAdjustPickup} />
    </View>
  ) : trip.status === 'CANCELLED' ? (
    <AppButton title="ĐẶT CHUYẾN MỚI" variant="passenger" onPress={onDone} />
  ) : canCancel ? (
    <AppButton
      title={trip.driverId ? 'HỦY CHUYẾN' : 'HỦY TÌM KIẾM'}
      variant="outline"
      isLoading={action === 'cancel'}
      onPress={onCancel}
    />
  ) : null;

  return (
    <View style={styles.screen}>
      <PassengerTripMap trip={trip} sheetPosition={sheetPosition} />
      <DraggableBottomSheet
        animatedPosition={sheetPosition}
        snapPoints={[0.36, 0.62, 0.92]}
        initialSnapIndex={0}
        footer={footer}
      >
        <View style={styles.content}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, trip.status === 'ARRIVED' && styles.arrivedIcon]}>
              {trip.status === 'ARRIVED'
                ? <Clock3 size={22} color={colors.success} />
                : <Route size={22} color={colors.primary} />}
            </View>
            <View style={styles.flex}>
              <AppText variant="h2" weight="semibold" style={trip.status === 'ARRIVED' ? styles.arrivedText : undefined}>{copy.title}</AppText>
              <AppText variant="bodySmall" style={styles.secondary}>{copy.description}</AppText>
            </View>
          </View>

          {trip.status === 'MATCHING' || trip.status === 'PENDING' ? (
            <View style={styles.searchProgress}>
              {['Đang kiểm tra hướng tuyến', 'Đang tìm tài xế gần bạn', 'Đang gửi yêu cầu theo từng nhóm'].map((label, index) => (
                <View key={label} style={styles.progressRow}>
                  <View style={styles.check}><Check size={15} color={colors.surface} /></View>
                  <AppText variant="bodySmall">{label}{index === 2 ? '…' : ''}</AppText>
                </View>
              ))}
            </View>
          ) : null}

          {trip.status === 'ARRIVED' ? (
            <View style={styles.waitingRow}>
              <Clock3 size={20} color={colors.warning} />
              <View><AppText variant="caption">Thời gian chờ</AppText><AppText variant="h3" weight="semibold">{waitingText}</AppText></View>
            </View>
          ) : null}

          {trip.driver ? (
            <View style={styles.driverRow}>
              <View style={styles.avatar}><AppText variant="h3" weight="semibold">{driverName.charAt(0).toUpperCase()}</AppText></View>
              <View style={styles.flex}>
                <AppText weight="semibold">{driverName}</AppText>
                <View style={styles.rating}><Star size={14} color={colors.warning} fill={colors.warning} /><AppText variant="caption">{trip.driver.driverRating?.toFixed(1) || 'Mới'}</AppText></View>
                {vehicle ? <AppText variant="bodySmall" style={styles.secondary}>{vehicle.color ? `${vehicle.color} · ` : ''}{vehicle.licensePlate}</AppText> : null}
              </View>
              {trip.driver.phone ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Gọi tài xế" onPress={() => void Linking.openURL(`tel:${trip.driver?.phone}`)} style={styles.iconButton}><Phone size={20} color={colors.primary} /></Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.routeBlock}>
            <View style={styles.routeRow}><MapPin size={18} color={colors.mapPickup} /><View style={styles.flex}><AppText variant="caption">Điểm đón</AppText><AppText variant="bodySmall" weight="semibold">{trip.originAddress}</AppText></View></View>
            <View style={styles.routeRow}><Route size={18} color={colors.mapDestination} /><View style={styles.flex}><AppText variant="caption">Điểm đến</AppText><AppText variant="bodySmall" weight="semibold">{trip.destAddress}</AppText></View></View>
          </View>

          {trip.status === 'IN_PROGRESS' ? (
            <View style={styles.metrics}>
              <View><AppText variant="caption">Thời gian dự kiến</AppText><AppText weight="semibold">{trip.estimatedDuration} phút</AppText></View>
              <View><AppText variant="caption">Quãng đường</AppText><AppText weight="semibold">{trip.estimatedDistance.toFixed(1)} km</AppText></View>
              <View style={styles.support}><ShieldCheck size={18} color={colors.success} /><AppText variant="bodySmall">Hành trình được theo dõi realtime</AppText></View>
            </View>
          ) : null}

          {trip.status === 'WAITING_PAYMENT' || trip.status === 'COMPLETED' ? (
            <View style={styles.fareBreakdown}>
              <AppText weight="semibold">Chi phí chuyến đi</AppText>
              <View style={styles.fareRow}><AppText variant="bodySmall" style={styles.secondary}>Giá hệ thống tính</AppText><AppText variant="bodySmall">{trip.estimatedPrice.toLocaleString('vi-VN')}đ</AppText></View>
              {trip.finalPrice != null && trip.finalPrice !== trip.estimatedPrice ? <View style={styles.fareRow}><AppText variant="bodySmall" style={styles.secondary}>Điều chỉnh</AppText><AppText variant="bodySmall">{(trip.finalPrice - trip.estimatedPrice).toLocaleString('vi-VN')}đ</AppText></View> : null}
              <View style={[styles.fareRow, styles.totalRow]}><AppText weight="semibold">TỔNG</AppText><AppText variant="h2" weight="semibold" style={styles.total}>{(trip.finalPrice ?? trip.estimatedPrice).toLocaleString('vi-VN')}đ</AppText></View>
            </View>
          ) : null}

          {error ? <AppText accessibilityRole="alert" style={styles.error}>{error}</AppText> : null}
          <View style={styles.help}><CircleHelp size={17} color={colors.textSecondary} /><AppText variant="bodySmall" style={styles.secondary}>Cần hỗ trợ? Liên hệ 1900 0000</AppText></View>
        </View>
      </DraggableBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.md, paddingHorizontal: layout.screenGutter, paddingTop: spacing.sm },
  flex: { flex: 1 },
  statusHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  statusIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.full, height: 48, justifyContent: 'center', width: 48 },
  arrivedIcon: { backgroundColor: colors.successSoft },
  arrivedText: { color: colors.success },
  secondary: { color: colors.textSecondary },
  searchProgress: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.card, gap: spacing.sm, padding: spacing.md },
  progressRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 28 },
  check: { alignItems: 'center', backgroundColor: colors.success, borderRadius: radius.full, height: 22, justifyContent: 'center', width: 22 },
  waitingRow: { alignItems: 'center', backgroundColor: colors.warningSoft, borderRadius: radius.card, flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  driverRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  avatar: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.full, height: 52, justifyContent: 'center', width: 52 },
  rating: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  iconButton: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.full, height: layout.minTouchTarget, justifyContent: 'center', width: layout.minTouchTarget },
  routeBlock: { gap: spacing.md },
  routeRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  metrics: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.card, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, padding: spacing.md },
  support: { alignItems: 'center', flexBasis: '100%', flexDirection: 'row', gap: spacing.sm },
  fareBreakdown: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.card, gap: spacing.sm, padding: spacing.md },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalRow: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.xs, paddingTop: spacing.md },
  total: { color: colors.primary },
  help: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 44 },
  error: { color: colors.danger },
  footerStack: { gap: spacing.xs },
});
