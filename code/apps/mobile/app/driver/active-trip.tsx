import { memo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Clock3, MapPin, Navigation, Phone, Star } from 'lucide-react-native';
import type { TripStatus } from '@repo/shared';

import { ActiveRideMap, type ActiveRideMapHandle, type ActiveRideLatLng } from '../../src/components/ActiveRideMap';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { DraggableBottomSheet } from '../../src/components/ui/DraggableBottomSheet';
import { FloatingMyLocation } from '../../src/components/ui/FloatingMyLocation';
import { useRideHailingTrip, rideHailingKeys } from '../../src/features/ride-hailing/useRideHailingTrip';
import { useDriverTracking } from '../../src/hooks/useDriverLocation';
import { getDirections } from '../../src/services/direction.service';
import { tripService, type RideHailingTrip } from '../../src/services/trip.service';
import { colors, layout, radius, spacing } from '../../src/theme/tokens';
import { getApiErrorMessage, getApiErrorPayload } from '../../src/utils/api-error';
import { showConfirmDialog, showInfoDialog } from '../../src/utils/dialog';

const STATUS_COPY: Record<TripStatus, { title: string; description: string }> = {
  PENDING: { title: 'Đang chuẩn bị chuyến', description: 'Hệ thống đang xử lý yêu cầu.' },
  MATCHING: { title: 'Đang ghép tài xế', description: 'Chuyến chưa được gán.' },
  ACCEPTED: { title: 'Đã nhận chuyến', description: 'Xem lại điểm đón trước khi bắt đầu di chuyển.' },
  ARRIVING: { title: 'Đang đến điểm đón', description: 'Đi theo tuyến và chỉ xác nhận khi đã tới.' },
  ARRIVED: { title: 'Đang chờ hành khách', description: 'Liên hệ hành khách nếu cần hỗ trợ tìm nhau.' },
  IN_PROGRESS: { title: 'Đang đến điểm đến', description: 'Tập trung lái xe và theo dõi lộ trình.' },
  WAITING_PAYMENT: { title: 'Chờ hành khách thanh toán', description: 'Bạn sẽ nhận cập nhật ngay khi thanh toán hoàn tất.' },
  COMPLETED: { title: 'Chuyến đi hoàn thành ✓', description: 'Bạn đã sẵn sàng cho chuyến tiếp theo.' },
  CANCELLED: { title: 'Chuyến đi đã hủy', description: 'Trạng thái tài xế đã được giải phóng.' },
  NO_DRIVER: { title: 'Chuyến không còn khả dụng', description: 'Quay về trang chủ để chờ yêu cầu khác.' },
};

const TRACKING_STATUSES: TripStatus[] = ['ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS'];

const DriverTripMap = memo(function DriverTripMap({
  trip,
  sheetPosition,
}: {
  trip: RideHailingTrip;
  sheetPosition: SharedValue<number>;
}) {
  const mapRef = useRef<ActiveRideMapHandle>(null);
  const tracking = useDriverTracking(TRACKING_STATUSES.includes(trip.status) ? trip.id : null);
  const [routeCoords, setRouteCoords] = useState<ActiveRideLatLng[]>([
    { latitude: trip.originLat, longitude: trip.originLng },
    { latitude: trip.destLat, longitude: trip.destLng },
  ]);
  const [centered, setCentered] = useState(true);
  const pickupPhase = ['ACCEPTED', 'ARRIVING', 'ARRIVED'].includes(trip.status);
  const driverLocation = tracking.currentLocation;
  const hasDriverLocation = Boolean(driverLocation);

  useEffect(() => {
    if (!driverLocation) return;
    let cancelled = false;
    const start = { latitude: driverLocation.latitude, longitude: driverLocation.longitude };
    const destination = pickupPhase
      ? { latitude: trip.originLat, longitude: trip.originLng }
      : { latitude: trip.destLat, longitude: trip.destLng };
    void getDirections(start, destination, trip.vehicleType === 'CAR' ? 'car' : 'bike')
      .then((route) => {
        if (!cancelled && route?.polylineCoords.length) setRouteCoords(route.polylineCoords);
      });
    return () => { cancelled = true; };
  // Recalculate once when GPS becomes available and once when the destination
  // phase changes; high-frequency GPS updates only move the marker.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDriverLocation, pickupPhase, trip.destLat, trip.destLng, trip.originLat, trip.originLng, trip.vehicleType]);

  const origin = driverLocation
    ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude }
    : { latitude: trip.originLat, longitude: trip.originLng };
  const destination = pickupPhase
    ? { latitude: trip.originLat, longitude: trip.originLng }
    : { latitude: trip.destLat, longitude: trip.destLng };

  return (
    <>
      <ActiveRideMap
        ref={mapRef}
        originCoords={origin}
        destinationCoords={destination}
        routeCoords={routeCoords}
        driverLocation={driverLocation}
        originLabel={pickupPhase ? 'Vị trí tài xế' : trip.originAddress}
        destinationLabel={pickupPhase ? trip.originAddress : trip.destAddress}
        onUserPan={() => setCentered(false)}
      />
      <FloatingMyLocation
        animatedPosition={sheetPosition}
        isCentered={centered}
        onRecenter={(location) => {
          mapRef.current?.recenter({ latitude: location.latitude, longitude: location.longitude });
          setCentered(true);
        }}
      />
    </>
  );
});

export default function DriverActiveTripScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const active = useRideHailingTrip('driver');
  const sheetPosition = useSharedValue(0);
  const [action, setAction] = useState<'en-route' | 'arrive' | 'start' | 'complete' | 'cancel' | null>(null);
  const [error, setError] = useState<string>();
  const [now, setNow] = useState(Date.now());
  const trip = active.trip;

  useEffect(() => {
    if (trip?.status !== 'ARRIVED' || !trip.arrivedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [trip?.arrivedAt, trip?.status]);

  const applyTrip = (updated: RideHailingTrip) => {
    queryClient.setQueryData(rideHailingKeys.active('driver'), updated);
    void queryClient.invalidateQueries({ queryKey: ['active-driver-trip'] });
  };

  const command = async (
    name: NonNullable<typeof action>,
    execute: () => Promise<{ data: RideHailingTrip }>,
  ) => {
    if (action) return;
    setAction(name);
    setError(undefined);
    try {
      const result = await execute();
      applyTrip(result.data);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Không thể cập nhật chuyến. Hãy thử lại.'));
    } finally {
      setAction(null);
    }
  };

  const complete = async (confirmFarFromDestination = false) => {
    if (!trip || action) return;
    setAction('complete');
    setError(undefined);
    try {
      const result = await tripService.completeTrip(trip.id, confirmFarFromDestination);
      applyTrip(result.data);
      showInfoDialog('Đã kết thúc hành trình', 'Đang chờ hành khách thanh toán.');
    } catch (caught) {
      const payload = getApiErrorPayload(caught);
      if (payload.code === 'TRIP_TOO_FAR_FROM_DESTINATION' && !confirmFarFromDestination) {
        setAction(null);
        showConfirmDialog(
          'Bạn chưa ở gần điểm đến',
          `${payload.message || 'Vị trí hiện tại còn xa điểm đến'} Bạn có chắc muốn hoàn thành chuyến?`,
          () => void complete(true),
          'Vẫn hoàn thành',
        );
        return;
      }
      setError(payload.message || 'Không thể hoàn thành chuyến.');
    } finally {
      setAction(null);
    }
  };

  const cancel = () => {
    if (!trip || action) return;
    showConfirmDialog(
      'Hủy chuyến đã nhận?',
      'Hành khách sẽ được thông báo và hệ thống sẽ giải phóng chuyến của bạn.',
      () => {
        setAction('cancel');
        setError(undefined);
        void tripService.cancelTrip(trip.id, 'Tài xế không thể tiếp tục chuyến')
          .then(({ data }) => {
            active.rememberTerminalTrip(data);
            queryClient.setQueryData(rideHailingKeys.active('driver'), null);
          })
          .catch((caught) => setError(getApiErrorMessage(caught, 'Không thể hủy chuyến.')))
          .finally(() => setAction(null));
      },
      'Hủy chuyến',
    );
  };

  if (active.isLoading && !trip) {
    return <View style={styles.state}><ActivityIndicator size="large" color={colors.driverAccent} /><AppText variant="bodySmall">Đang khôi phục chuyến đang diễn ra…</AppText></View>;
  }

  if (!trip) {
    return (
      <View style={styles.state}>
        <AppText variant="h3" weight="semibold">{active.isError ? 'Không thể tải chuyến' : 'Không có chuyến đang hoạt động'}</AppText>
        <AppText variant="bodySmall" style={styles.secondary}>{active.isError ? 'Kiểm tra kết nối và thử đồng bộ lại.' : 'Quay lại online để chờ yêu cầu mới.'}</AppText>
        {active.isError ? <AppButton title="THỬ LẠI" variant="driver" onPress={() => void active.syncLatest()} style={styles.fullButton} /> : null}
        <AppButton title="VỀ TRANG CHỦ" variant="outline" onPress={() => router.replace('/(driver-tabs)' as never)} style={styles.fullButton} />
      </View>
    );
  }

  const copy = STATUS_COPY[trip.status];
  const passengerName = [trip.passenger?.firstName, trip.passenger?.lastName].filter(Boolean).join(' ') || 'Hành khách CoRide';
  const pickupPhase = ['ACCEPTED', 'ARRIVING', 'ARRIVED'].includes(trip.status);
  const targetAddress = pickupPhase ? trip.originAddress : trip.destAddress;
  const waitingSeconds = trip.arrivedAt ? Math.max(0, Math.floor((now - Date.parse(trip.arrivedAt)) / 1000)) : 0;
  const waitingText = `${String(Math.floor(waitingSeconds / 60)).padStart(2, '0')}:${String(waitingSeconds % 60).padStart(2, '0')}`;
  const navigationTarget = pickupPhase
    ? `${trip.originLat},${trip.originLng}`
    : `${trip.destLat},${trip.destLng}`;
  const navigationUrl = Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${navigationTarget}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${navigationTarget}&travelmode=driving`;

  const footer = trip.status === 'ACCEPTED' ? (
    <AppButton title="BẮT ĐẦU ĐẾN ĐIỂM ĐÓN" variant="driver" isLoading={action === 'en-route'} onPress={() => void command('en-route', () => tripService.setEnRoute(trip.id))} />
  ) : trip.status === 'ARRIVING' ? (
    <AppButton title="ĐÃ ĐẾN ĐIỂM ĐÓN" variant="driver" isLoading={action === 'arrive'} onPress={() => void command('arrive', () => tripService.markArrived(trip.id))} />
  ) : trip.status === 'ARRIVED' ? (
    <AppButton title="BẮT ĐẦU CHUYẾN" variant="driver" isLoading={action === 'start'} onPress={() => void command('start', () => tripService.startTrip(trip.id))} />
  ) : trip.status === 'IN_PROGRESS' ? (
    <AppButton title="HOÀN THÀNH CHUYẾN" variant="driver" isLoading={action === 'complete'} onPress={() => void complete()} />
  ) : ['COMPLETED', 'CANCELLED', 'NO_DRIVER'].includes(trip.status) ? (
    <AppButton title="XONG" variant="driver" onPress={() => { active.clearTerminalTrip(); router.replace('/(driver-tabs)' as never); }} />
  ) : trip.status === 'WAITING_PAYMENT' ? (
    <AppButton title="VỀ TRANG CHỦ" variant="outline" onPress={() => router.replace('/(driver-tabs)' as never)} />
  ) : null;

  return (
    <View style={styles.screen}>
      <DriverTripMap trip={trip} sheetPosition={sheetPosition} />
      <DraggableBottomSheet animatedPosition={sheetPosition} snapPoints={[0.36, 0.62, 0.92]} initialSnapIndex={0} footer={footer}>
        <View style={styles.content}>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>{trip.status === 'ARRIVED' ? <Clock3 size={22} color={colors.success} /> : <Navigation size={22} color={colors.driverAccent} />}</View>
            <View style={styles.flex}><AppText variant="h2" weight="semibold">{copy.title}</AppText><AppText variant="bodySmall" style={styles.secondary}>{copy.description}</AppText></View>
          </View>

          {trip.status === 'ARRIVED' ? <View style={styles.waiting}><Clock3 size={20} color={colors.warning} /><View><AppText variant="caption">Thời gian chờ</AppText><AppText variant="h3" weight="semibold">{waitingText}</AppText></View></View> : null}

          <View style={styles.passengerRow}>
            <View style={styles.avatar}><AppText variant="h3" weight="semibold">{passengerName.charAt(0).toUpperCase()}</AppText></View>
            <View style={styles.flex}>
              <AppText weight="semibold">Đón {passengerName}</AppText>
              <View style={styles.rating}><Star size={14} color={colors.warning} fill={colors.warning} /><AppText variant="caption">{trip.passenger?.passengerRating?.toFixed(1) || 'Mới'}</AppText></View>
            </View>
            {trip.passenger?.phone ? <Pressable accessibilityRole="button" accessibilityLabel="Gọi hành khách" onPress={() => void Linking.openURL(`tel:${trip.passenger?.phone}`)} style={styles.iconButton}><Phone size={20} color={colors.success} /></Pressable> : null}
          </View>

          <View style={styles.target}>
            <MapPin size={20} color={pickupPhase ? colors.mapPickup : colors.mapDestination} />
            <View style={styles.flex}><AppText variant="caption">{pickupPhase ? 'ĐIỂM ĐÓN' : 'ĐIỂM ĐẾN'}</AppText><AppText weight="semibold">{targetAddress}</AppText></View>
          </View>
          {TRACKING_STATUSES.includes(trip.status) ? <AppButton title="ĐIỀU HƯỚNG" variant="outline" leftIcon={<Navigation size={19} color={colors.success} />} onPress={() => void Linking.openURL(navigationUrl)} /> : null}

          <View style={styles.routeSummary}>
            <View><AppText variant="caption">Quãng đường</AppText><AppText weight="semibold">{trip.estimatedDistance.toFixed(1)} km</AppText></View>
            <View><AppText variant="caption">Thời gian dự kiến</AppText><AppText weight="semibold">{trip.estimatedDuration} phút</AppText></View>
            <View><AppText variant="caption">Thu nhập dự kiến</AppText><AppText weight="semibold" style={styles.earning}>{(trip.finalPrice ?? trip.estimatedPrice).toLocaleString('vi-VN')}đ</AppText></View>
          </View>

          {['ACCEPTED', 'ARRIVING', 'ARRIVED'].includes(trip.status) ? <Pressable accessibilityRole="button" disabled={Boolean(action)} onPress={cancel} style={styles.cancelButton}><AppText variant="bodySmall" weight="semibold" style={styles.cancelText}>{action === 'cancel' ? 'Đang hủy…' : 'Không thể tiếp tục? Hủy chuyến'}</AppText></Pressable> : null}
          {error ? <AppText accessibilityRole="alert" style={styles.error}>{error}</AppText> : null}
        </View>
      </DraggableBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  state: { alignItems: 'center', backgroundColor: colors.background, flex: 1, gap: spacing.md, justifyContent: 'center', paddingHorizontal: layout.screenGutter },
  fullButton: { alignSelf: 'stretch' },
  content: { gap: spacing.md, paddingHorizontal: layout.screenGutter, paddingTop: spacing.sm },
  flex: { flex: 1 },
  secondary: { color: colors.textSecondary },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  statusIcon: { alignItems: 'center', backgroundColor: colors.driverAccentSoft, borderRadius: radius.full, height: 48, justifyContent: 'center', width: 48 },
  waiting: { alignItems: 'center', backgroundColor: colors.warningSoft, borderRadius: radius.card, flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  passengerRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  avatar: { alignItems: 'center', backgroundColor: colors.driverAccentSoft, borderRadius: radius.full, height: 52, justifyContent: 'center', width: 52 },
  rating: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  iconButton: { alignItems: 'center', backgroundColor: colors.driverAccentSoft, borderRadius: radius.full, height: layout.minTouchTarget, justifyContent: 'center', width: layout.minTouchTarget },
  target: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  routeSummary: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.card, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, justifyContent: 'space-between', padding: spacing.md },
  earning: { color: colors.success },
  cancelButton: { alignItems: 'center', justifyContent: 'center', minHeight: layout.minTouchTarget },
  cancelText: { color: colors.danger },
  error: { color: colors.danger },
});
