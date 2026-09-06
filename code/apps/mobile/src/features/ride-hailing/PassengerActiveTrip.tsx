import { memo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  CircleHelp,
  Clock3,
  MapPin,
  Phone,
  QrCode,
  Radio,
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
import { paymentService } from '../../services/payment.service';
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
  onViewDetail?: () => void;
  onSwitchToCarpool?: () => void;
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
  onViewDetail,
  onSwitchToCarpool,
}: PassengerActiveTripProps) {
  const sheetPosition = useSharedValue(0);
  const [now, setNow] = useState(() => Date.now());
  const [matchingStartedAt] = useState(() => Date.now());
  const isMatching = trip.status === 'MATCHING' || trip.status === 'PENDING';
  const copy = STATUS_COPY[trip.status];
  const driverName = [trip.driver?.firstName, trip.driver?.lastName].filter(Boolean).join(' ') || 'Tài xế CoRide';
  const vehicle = trip.driver?.vehicles?.[0];
  const alreadyRated = trip.driverId
    ? trip.reviews?.some((review) => review.revieweeId === trip.driverId)
    : false;

  useEffect(() => {
    if ((trip.status !== 'ARRIVED' || !trip.arrivedAt) && !isMatching) return;
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [isMatching, trip.arrivedAt, trip.status]);

  const searchSeconds = isMatching
    ? Math.max(0, Math.floor((now - matchingStartedAt) / 1000))
    : 0;
  const searchElapsedText = `${String(Math.floor(searchSeconds / 60)).padStart(2, '0')}:${String(searchSeconds % 60).padStart(2, '0')}`;

  const isWaitingPayment = trip.status === 'WAITING_PAYMENT';
  const qrQuery = useQuery({
    queryKey: ['simulator-qr', trip.id],
    queryFn: () => paymentService.getSimulatorQr(trip.id),
    enabled: isWaitingPayment,
    staleTime: 60_000,
  });

  const waitingSeconds = trip.arrivedAt
    ? Math.max(0, Math.floor((now - Date.parse(trip.arrivedAt)) / 1000))
    : 0;
  const waitingText = `${String(Math.floor(waitingSeconds / 60)).padStart(2, '0')}:${String(waitingSeconds % 60).padStart(2, '0')}`;
  const canCancel = ['PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED'].includes(trip.status);

  const footer = trip.status === 'WAITING_PAYMENT' ? (
    <AppButton
      title="TÔI ĐÃ THANH TOÁN"
      variant="passenger"
      isLoading={action === 'payment'}
      disabled={action === 'payment'}
      onPress={onPayment}
    />
  ) : trip.status === 'COMPLETED' ? (
    <View style={styles.footerStack}>
      {!alreadyRated && trip.driverId ? (
        <AppButton title="ĐÁNH GIÁ TÀI XẾ" variant="passenger" onPress={onRate} />
      ) : null}
      {onViewDetail ? (
        <AppButton title="XEM CHI TIẾT BIÊN LAI" variant="outline" onPress={onViewDetail} />
      ) : null}
      <AppButton
        title="VỀ TRANG CHỦ"
        variant={alreadyRated || !trip.driverId ? 'passenger' : 'ghost'}
        onPress={onDone}
      />
    </View>
  ) : trip.status === 'NO_DRIVER' ? (
    <View style={styles.footerStack}>
      <AppButton title="TÌM LẠI TÀI XẾ" variant="passenger" isLoading={action === 'retry'} onPress={onRetry} />
      <AppButton title="ĐIỀU CHỈNH ĐIỂM ĐÓN" variant="outline" onPress={onAdjustPickup} />
      {onSwitchToCarpool ? (
        <AppButton title="TÌM XE ĐI CHUNG (CARPOOLING)" variant="ghost" onPress={onSwitchToCarpool} />
      ) : null}
    </View>
  ) : trip.status === 'CANCELLED' ? (
    <View style={styles.footerStack}>
      {onViewDetail ? (
        <AppButton title="XEM CHI TIẾT CHUYẾN ĐI" variant="outline" onPress={onViewDetail} />
      ) : null}
      <AppButton title="ĐẶT CHUYẾN MỚI" variant="passenger" onPress={onDone} />
    </View>
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
        snapPoints={trip.status === 'WAITING_PAYMENT' ? [0.68, 0.94] : [0.38, 0.64, 0.92]}
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
              <View style={styles.radarHeader}>
                <View style={styles.radarPulse}>
                  <Radio size={20} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText weight="bold" style={styles.radarTitle}>Đang quét tìm tài xế gần bạn</AppText>
                  <AppText variant="caption" style={styles.secondary}>Thời gian tìm kiếm: {searchElapsedText}</AppText>
                </View>
              </View>
              <View style={styles.searchDivider} />
              {['Kiểm tra tuyến đường và bán kính', 'Kết nối mạng lưới tài xế CoRide', 'Gửi lời mời đón tới tài xế phù hợp'].map((label, index) => (
                <View key={label} style={styles.progressRow}>
                  <View style={styles.check}><Check size={14} color={colors.surface} /></View>
                  <AppText variant="bodySmall">{label}{index === 2 ? '…' : ''}</AppText>
                </View>
              ))}
            </View>
          ) : null}

          {trip.status === 'ARRIVED' ? (
            <View style={styles.arrivedBanner}>
              <View style={styles.arrivedBannerHeader}>
                <Clock3 size={20} color={colors.success} />
                <AppText weight="bold" style={styles.arrivedBannerTitle}>TÀI XẾ ĐÃ ĐẾN ĐIỂM ĐÓN</AppText>
              </View>
              <AppText variant="bodySmall" style={styles.arrivedBannerText}>
                Tài xế đang chờ bạn tại điểm đón. Thời gian chờ: <AppText weight="bold" style={{ color: colors.success }}>{waitingText}</AppText>
              </AppText>
              {vehicle?.licensePlate ? (
                <View style={styles.arrivedPlateRow}>
                  <AppText variant="caption" style={styles.secondary}>Đối chiếu biển số xe:</AppText>
                  <View style={styles.plateBadgeSmall}>
                    <AppText weight="bold" style={styles.plateTextSmall}>{vehicle.licensePlate}</AppText>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {trip.driver ? (
            <View style={styles.driverRow}>
              <View style={styles.avatar}>
                <AppText variant="h3" weight="semibold">{driverName.charAt(0).toUpperCase()}</AppText>
              </View>
              <View style={styles.flex}>
                <AppText weight="semibold" numberOfLines={1}>{driverName}</AppText>
                <View style={styles.rating}>
                  <Star size={14} color={colors.warning} fill={colors.warning} />
                  <AppText variant="caption" weight="semibold">{trip.driver.driverRating?.toFixed(1) || '5.0'}</AppText>
                </View>
                {vehicle ? (
                  <View style={styles.vehicleInfoRow}>
                    <View style={styles.plateBadge}>
                      <AppText weight="bold" style={styles.plateText}>{vehicle.licensePlate}</AppText>
                    </View>
                    <AppText variant="caption" style={styles.secondary} numberOfLines={1}>
                      {vehicle.color ? `${vehicle.color} · ` : ''}{vehicle.type === 'CAR' ? 'Ô tô 4 chỗ' : 'Xe máy'}
                    </AppText>
                  </View>
                ) : null}
              </View>
              {trip.driver.phone ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Gọi tài xế"
                  onPress={() => void Linking.openURL(`tel:${trip.driver?.phone}`)}
                  style={styles.iconButton}
                >
                  <Phone size={20} color={colors.primary} />
                </Pressable>
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

          {trip.status === 'WAITING_PAYMENT' ? (
            <View style={styles.qrSection}>
              <View style={styles.qrHeader}>
                <QrCode size={20} color={colors.primary} />
                <AppText weight="semibold">Quét mã QR để thanh toán</AppText>
              </View>
              {qrQuery.isLoading ? (
                <View style={styles.qrLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <AppText variant="caption" style={styles.secondary}>Đang tạo mã thanh toán…</AppText>
                </View>
              ) : qrQuery.isError ? (
                <View style={styles.qrError}>
                  <AppText variant="caption" style={styles.errorText}>Không thể tải mã QR.</AppText>
                  <Pressable accessibilityRole="button" onPress={() => void qrQuery.refetch()} style={styles.qrRetry}>
                    <AppText variant="caption" weight="semibold" style={{ color: colors.primary }}>Thử lại</AppText>
                  </Pressable>
                </View>
              ) : qrQuery.data?.data?.qrUrl ? (
                <View style={styles.qrBox}>
                  <Image
                    source={{ uri: qrQuery.data.data.qrUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <AppText variant="caption" style={styles.qrDesc}>
                    {qrQuery.data.data.description}
                  </AppText>
                </View>
              ) : null}
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
  radarHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  radarPulse: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  radarTitle: { color: colors.textPrimary, fontSize: 14 },
  searchDivider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
  arrivedBanner: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  arrivedBannerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  arrivedBannerTitle: {
    color: colors.success,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  arrivedBannerText: {
    color: colors.textPrimary,
  },
  arrivedPlateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  plateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#0F172A',
    borderRadius: 4,
    borderWidth: 1.5,
    marginVertical: 2,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  plateText: {
    color: '#0F172A',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  plateBadgeSmall: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0F172A',
    borderRadius: 4,
    borderWidth: 1.2,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  plateTextSmall: {
    color: '#0F172A',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  vehicleInfoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  qrSection: { alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: radius.card, gap: spacing.sm, padding: spacing.md },
  qrHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  qrLoading: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  qrError: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  errorText: { color: colors.danger },
  qrRetry: { minHeight: layout.minTouchTarget, justifyContent: 'center', paddingHorizontal: spacing.sm },
  qrBox: { alignItems: 'center', gap: spacing.xs },
  qrImage: { backgroundColor: colors.surface, borderRadius: radius.input, height: 190, width: 190 },
  qrDesc: { color: colors.textSecondary, textAlign: 'center' },
});
