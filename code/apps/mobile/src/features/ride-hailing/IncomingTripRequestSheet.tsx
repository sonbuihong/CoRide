import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Clock3, MapPin, Route, Star, X } from 'lucide-react-native';
import { SocketEvents, type TripOfferPayload } from '@repo/shared';

import { ActiveRideMap } from '../../components/ActiveRideMap';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { tripService } from '../../services/trip.service';
import { socketService } from '../../services/socket.service';
import { colors, layout, radius, spacing } from '../../theme/tokens';
import { getApiErrorMessage, getApiErrorPayload } from '../../utils/api-error';
import { showInfoDialog } from '../../utils/dialog';
import { rideHailingKeys } from './useRideHailingTrip';

export function IncomingTripRequestSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [offer, setOffer] = useState<TripOfferPayload | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [action, setAction] = useState<'accept' | 'reject' | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void socketService.connect();
    const handleOffer = (payload: TripOfferPayload) => {
      setOffer(payload);
      setError(undefined);
      setAction(null);
    };
    const handleExpired = (payload: { tripId: string }) => {
      setOffer((current) => current?.tripId === payload.tripId ? null : current);
    };
    socketService.on(SocketEvents.TRIP_NEW_REQUEST, handleOffer);
    socketService.on(SocketEvents.TRIP_REQUEST_EXPIRED, handleExpired);
    return () => {
      socketService.off(SocketEvents.TRIP_NEW_REQUEST, handleOffer);
      socketService.off(SocketEvents.TRIP_REQUEST_EXPIRED, handleExpired);
    };
  }, []);

  useEffect(() => {
    if (!offer) return;
    const updateCountdown = () => {
      const seconds = Math.max(0, Math.ceil((Date.parse(offer.expiresAt) - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) setOffer(null);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 250);
    return () => clearInterval(interval);
  }, [offer]);

  const routeCoords = useMemo(() => offer ? [
    { latitude: offer.originLat, longitude: offer.originLng },
    { latitude: offer.destLat, longitude: offer.destLng },
  ] : [], [offer]);

  const accept = async () => {
    if (!offer || action) return;
    setAction('accept');
    setError(undefined);
    try {
      await tripService.acceptTrip(offer.tripId);
      setOffer(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rideHailingKeys.active('driver') }),
        queryClient.invalidateQueries({ queryKey: ['active-driver-trip'] }),
      ]);
      router.push('/driver/active-trip' as never);
    } catch (caught) {
      const payload = getApiErrorPayload(caught);
      if (payload.code === 'TRIP_ALREADY_ACCEPTED' || payload.code === 'TRIP_NOT_OFFERED') {
        setOffer(null);
        showInfoDialog('Chuyến không còn khả dụng', payload.message || 'Chuyến đã được tài xế khác nhận.');
      } else {
        setError(getApiErrorMessage(caught, 'Không thể nhận chuyến. Hãy kiểm tra kết nối và thử lại.'));
      }
    } finally {
      setAction(null);
    }
  };

  const reject = async () => {
    if (!offer || action) return;
    setAction('reject');
    setError(undefined);
    try {
      await tripService.rejectTrip(offer.tripId);
      setOffer(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Không thể từ chối yêu cầu lúc này.'));
    } finally {
      setAction(null);
    }
  };

  if (!offer) return null;
  const passengerName = [offer.passenger.firstName, offer.passenger.lastName]
    .filter(Boolean)
    .join(' ') || 'Hành khách CoRide';

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={reject}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Từ chối yêu cầu" style={styles.scrim} onPress={reject} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View>
              <AppText variant="caption" weight="semibold" style={styles.eyebrow}>YÊU CẦU CHUYẾN MỚI</AppText>
              <AppText variant="h2" weight="semibold">Thuận tuyến {offer.matchScore}%</AppText>
            </View>
            <View style={styles.timer}>
              <Clock3 size={17} color={colors.warning} />
              <AppText weight="semibold" style={styles.timerText}>{remainingSeconds}s</AppText>
            </View>
          </View>

          <View style={styles.mapPreview} pointerEvents="none">
            <ActiveRideMap
              originCoords={routeCoords[0]}
              destinationCoords={routeCoords[1]}
              routeCoords={routeCoords}
              originLabel={offer.originAddress}
              destinationLabel={offer.destAddress}
            />
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <MapPin size={18} color={colors.mapPickup} />
              <AppText variant="bodySmall" weight="semibold">{offer.driverDistance.toFixed(1)} km · {offer.pickupEtaMinutes} phút đến đón</AppText>
            </View>
            <View style={styles.metric}>
              <Route size={18} color={colors.primary} />
              <AppText variant="bodySmall" weight="semibold">{offer.estimatedDistance.toFixed(1)} km · {offer.estimatedDuration} phút</AppText>
            </View>
          </View>

          <View style={styles.passengerRow}>
            <View style={styles.avatar}><AppText weight="semibold">{passengerName.charAt(0).toUpperCase()}</AppText></View>
            <View style={styles.passengerCopy}>
              <AppText weight="semibold" numberOfLines={1}>{passengerName}</AppText>
              <View style={styles.ratingRow}><Star size={14} color={colors.warning} fill={colors.warning} /><AppText variant="caption">{offer.passenger.passengerRating?.toFixed(1) || 'Mới'}</AppText></View>
            </View>
            <View style={styles.fareCopy}>
              <AppText variant="caption">Thu nhập dự kiến</AppText>
              <AppText variant="h3" weight="semibold" style={styles.fare}>{offer.estimatedPrice.toLocaleString('vi-VN')}đ</AppText>
            </View>
          </View>

          <View style={styles.routeCopy}>
            <AppText variant="bodySmall" numberOfLines={1}>● {offer.originAddress}</AppText>
            <AppText variant="bodySmall" numberOfLines={1}>○ {offer.destAddress}</AppText>
          </View>
          {error ? <AppText accessibilityRole="alert" variant="bodySmall" style={styles.error}>{error}</AppText> : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Từ chối chuyến"
              disabled={Boolean(action)}
              onPress={reject}
              style={({ pressed }) => [styles.rejectButton, pressed && styles.pressed]}
            >
              <X size={24} color={colors.textSecondary} />
            </Pressable>
            <AppButton
              title="NHẬN CHUYẾN"
              variant="driver"
              isLoading={action === 'accept'}
              disabled={Boolean(action)}
              onPress={accept}
              style={styles.acceptButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, gap: spacing.md, paddingHorizontal: layout.screenGutter, paddingTop: spacing.sm },
  handle: { alignSelf: 'center', backgroundColor: colors.borderStrong, borderRadius: radius.full, height: 5, width: 42 },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: colors.driverAccent, letterSpacing: 0.8, marginBottom: 2 },
  timer: { alignItems: 'center', backgroundColor: colors.warningSoft, borderRadius: radius.full, flexDirection: 'row', gap: spacing.xs, minHeight: 44, paddingHorizontal: spacing.md },
  timerText: { color: colors.warning },
  mapPreview: { borderRadius: radius.card, height: 150, overflow: 'hidden' },
  metricsRow: { gap: spacing.sm },
  metric: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  passengerRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingVertical: spacing.md },
  avatar: { alignItems: 'center', backgroundColor: colors.driverAccentSoft, borderRadius: radius.full, height: 44, justifyContent: 'center', width: 44 },
  passengerCopy: { flex: 1, marginLeft: spacing.md },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: 2 },
  fareCopy: { alignItems: 'flex-end' },
  fare: { color: colors.success },
  routeCopy: { gap: spacing.xs },
  error: { color: colors.danger },
  actions: { flexDirection: 'row', gap: spacing.md },
  rejectButton: { alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderRadius: radius.button, borderWidth: 1, height: 54, justifyContent: 'center', width: 54 },
  acceptButton: { flex: 1 },
  pressed: { opacity: 0.72 },
});
