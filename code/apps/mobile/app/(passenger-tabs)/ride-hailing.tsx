import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { PassengerActiveTrip } from '../../src/features/ride-hailing/PassengerActiveTrip';
import { PassengerRideRequest } from '../../src/features/ride-hailing/PassengerRideRequest';
import {
  rideHailingKeys,
  useRideHailingTrip,
} from '../../src/features/ride-hailing/useRideHailingTrip';
import { paymentService } from '../../src/services/payment.service';
import { tripService, type RideHailingTrip } from '../../src/services/trip.service';
import { colors, layout, spacing } from '../../src/theme/tokens';
import { getApiErrorMessage } from '../../src/utils/api-error';
import { showConfirmDialog, showInfoDialog } from '../../src/utils/dialog';

export default function PassengerRideHailingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const active = useRideHailingTrip('passenger');
  const [lastRequest, setLastRequest] = useState<RideHailingTrip | null>(null);
  const [action, setAction] = useState<'cancel' | 'payment' | 'retry' | null>(null);
  const [error, setError] = useState<string>();

  const setActiveTrip = (trip: RideHailingTrip) => {
    active.clearTerminalTrip();
    setLastRequest(null);
    queryClient.setQueryData(rideHailingKeys.active('passenger'), trip);
  };

  const cancelTrip = () => {
    const trip = active.trip;
    if (!trip || action) return;
    showConfirmDialog(
      trip.driverId ? 'Hủy chuyến đã có tài xế?' : 'Hủy tìm tài xế?',
      trip.driverId
        ? 'Tài xế đã nhận và có thể đang di chuyển đến bạn.'
        : 'Hệ thống sẽ dừng gửi yêu cầu tới các tài xế.',
      () => {
        setAction('cancel');
        setError(undefined);
        void tripService.cancelTrip(trip.id, 'Hành khách thay đổi kế hoạch')
          .then(({ data }) => {
            active.rememberTerminalTrip(data);
            queryClient.setQueryData(rideHailingKeys.active('passenger'), null);
          })
          .catch((caught) => setError(getApiErrorMessage(caught, 'Không thể hủy chuyến lúc này.')))
          .finally(() => setAction(null));
      },
      'Hủy chuyến',
    );
  };

  const confirmPayment = async (trip: RideHailingTrip) => {
    if (action === 'payment') return;
    setAction('payment');
    setError(undefined);
    try {
      const result = await paymentService.confirmSimulatorPayment(trip.id);
      const completedTrip = result?.data?.trip as RideHailingTrip | undefined;
      const finalTrip = completedTrip ?? { ...trip, status: 'COMPLETED', paymentStatus: 'PAID' };
      active.rememberTerminalTrip(finalTrip);
      queryClient.setQueryData(rideHailingKeys.active('passenger'), null);
      queryClient.setQueryData(rideHailingKeys.detail(trip.id), finalTrip);
      showInfoDialog('Thanh toán thành công', 'Chuyến đi đã hoàn tất. Hãy đánh giá tài xế của bạn.');
    } catch (caught: any) {
      const status = caught?.response?.status;
      const code = caught?.response?.data?.code || caught?.response?.data?.message;
      if (status === 409 || (typeof code === 'string' && code.includes('PAYMENT_ALREADY_PROCESSED'))) {
        const finalTrip: RideHailingTrip = { ...trip, status: 'COMPLETED', paymentStatus: 'PAID' };
        active.rememberTerminalTrip(finalTrip);
        queryClient.setQueryData(rideHailingKeys.active('passenger'), null);
        queryClient.setQueryData(rideHailingKeys.detail(trip.id), finalTrip);
        showInfoDialog('Thanh toán thành công', 'Thanh toán của bạn đã được ghi nhận.');
        return;
      }
      setError(getApiErrorMessage(caught, 'Không thể xác nhận thanh toán. Vui lòng thử lại.'));
    } finally {
      setAction(null);
    }
  };

  const retryTrip = async () => {
    const trip = active.trip;
    if (!trip || action) return;
    setAction('retry');
    setError(undefined);
    try {
      const result = await tripService.createTrip({
        originAddress: trip.originAddress,
        originLat: trip.originLat,
        originLng: trip.originLng,
        destAddress: trip.destAddress,
        destLat: trip.destLat,
        destLng: trip.destLng,
        vehicleType: trip.vehicleType,
      });
      setActiveTrip(result.data);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Không thể tìm lại tài xế. Vui lòng thử lại.'));
    } finally {
      setAction(null);
    }
  };

  const adjustPickup = () => {
    if (!active.trip) return;
    setLastRequest(active.trip);
    active.clearTerminalTrip();
    setError(undefined);
  };

  const finish = () => {
    active.clearTerminalTrip();
    setLastRequest(null);
    setError(undefined);
  };

  if (active.isLoading && !active.trip) {
    return <View style={styles.state}><ActivityIndicator size="large" color={colors.primary} /><AppText variant="bodySmall">Đang khôi phục chuyến đang diễn ra…</AppText></View>;
  }

  if (active.isError && !active.trip) {
    return (
      <View style={styles.state}>
        <AppText variant="h3" weight="semibold">Không thể tải chuyến đang diễn ra</AppText>
        <AppText variant="bodySmall" style={styles.secondary}>Kiểm tra kết nối để tránh tạo trùng một chuyến khác.</AppText>
        <AppButton title="THỬ LẠI" variant="passenger" onPress={() => void active.syncLatest()} style={styles.stateButton} />
      </View>
    );
  }

  if (active.trip) {
    return (
      <PassengerActiveTrip
        trip={active.trip}
        action={action}
        error={error}
        onCancel={cancelTrip}
        onPayment={() => void confirmPayment(active.trip!)}
        onRetry={() => void retryTrip()}
        onAdjustPickup={adjustPickup}
        onRate={() => router.push({
          pathname: '/review-modal',
          params: { tripRequestId: active.trip!.id, revieweeId: active.trip!.driverId! },
        } as never)}
        onDone={finish}
        onViewDetail={() => router.push(`/trip/${active.trip!.id}` as never)}
        onSwitchToCarpool={() => {
          const trip = active.trip!;
          finish();
          router.push({
            pathname: '/search-results',
            params: {
              origin: trip.originAddress,
              destination: trip.destAddress,
              originLat: String(trip.originLat),
              originLng: String(trip.originLng),
              destinationLat: String(trip.destLat),
              destinationLng: String(trip.destLng),
              date: new Date().toISOString(),
              seats: '1',
            },
          } as never);
        }}
      />
    );
  }

  return <PassengerRideRequest initialTrip={lastRequest} onCreated={setActiveTrip} />;
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', backgroundColor: colors.background, flex: 1, gap: spacing.md, justifyContent: 'center', paddingHorizontal: layout.screenGutter },
  secondary: { color: colors.textSecondary, textAlign: 'center' },
  stateButton: { alignSelf: 'stretch' },
});
