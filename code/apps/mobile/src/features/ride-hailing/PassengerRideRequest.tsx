import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bike, Car, LocateFixed, Route } from 'lucide-react-native';

import { ActiveRideMap, type ActiveRideMapHandle, type ActiveRideLatLng } from '../../components/ActiveRideMap';
import { LocationPicker } from '../../components/LocationPicker';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { DraggableBottomSheet } from '../../components/ui/DraggableBottomSheet';
import { getDirections } from '../../services/direction.service';
import { pricingService } from '../../services/pricing.service';
import { tripService, type RideHailingTrip } from '../../services/trip.service';
import { colors, layout, radius, spacing } from '../../theme/tokens';
import { getApiErrorMessage } from '../../utils/api-error';

interface PassengerRideRequestProps {
  initialTrip?: RideHailingTrip | null;
  onCreated: (trip: RideHailingTrip) => void;
}

const DEFAULT_CENTER: ActiveRideLatLng = { latitude: 21.0285, longitude: 105.8542 };

export function PassengerRideRequest({ initialTrip, onCreated }: PassengerRideRequestProps) {
  const mapRef = useRef<ActiveRideMapHandle>(null);
  const [pickup, setPickup] = useState(initialTrip?.originAddress ?? '');
  const [dropoff, setDropoff] = useState(initialTrip?.destAddress ?? '');
  const [pickupCoords, setPickupCoords] = useState<ActiveRideLatLng | undefined>(initialTrip ? {
    latitude: initialTrip.originLat,
    longitude: initialTrip.originLng,
  } : undefined);
  const [dropoffCoords, setDropoffCoords] = useState<ActiveRideLatLng | undefined>(initialTrip ? {
    latitude: initialTrip.destLat,
    longitude: initialTrip.destLng,
  } : undefined);
  const [vehicleType, setVehicleType] = useState<'BIKE' | 'CAR'>(initialTrip?.vehicleType ?? 'BIKE');
  const [currentLocation, setCurrentLocation] = useState<ActiveRideLatLng>();
  const [routeCoords, setRouteCoords] = useState<ActiveRideLatLng[]>([]);
  const [routeError, setRouteError] = useState<string>();
  const [formError, setFormError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void Location.requestForegroundPermissionsAsync()
      .then(async ({ status }) => status === 'granted'
        ? Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        : null)
      .then((location) => {
        if (!cancelled && location) setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!pickupCoords || !dropoffCoords) {
      setRouteCoords([]);
      return;
    }
    setRouteError(undefined);
    void getDirections(pickupCoords, dropoffCoords, vehicleType === 'CAR' ? 'car' : 'bike')
      .then((result) => {
        if (cancelled) return;
        setRouteCoords(result?.polylineCoords.length
          ? result.polylineCoords
          : [pickupCoords, dropoffCoords]);
        if (!result) setRouteError('Không tải được đường đi chi tiết; hãy kiểm tra kết nối.');
      });
    return () => { cancelled = true; };
  }, [dropoffCoords, pickupCoords, vehicleType]);

  const estimateQuery = useQuery({
    queryKey: [
      'ride-hailing-estimate',
      pickupCoords?.latitude,
      pickupCoords?.longitude,
      dropoffCoords?.latitude,
      dropoffCoords?.longitude,
      vehicleType,
    ],
    queryFn: () => pricingService.estimateRideHailing({
      originLat: pickupCoords!.latitude,
      originLng: pickupCoords!.longitude,
      destLat: dropoffCoords!.latitude,
      destLng: dropoffCoords!.longitude,
      vehicleType,
    }),
    enabled: Boolean(pickupCoords && dropoffCoords),
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: () => tripService.createTrip({
      originAddress: pickup.trim(),
      originLat: pickupCoords!.latitude,
      originLng: pickupCoords!.longitude,
      destAddress: dropoff.trim(),
      destLat: dropoffCoords!.latitude,
      destLng: dropoffCoords!.longitude,
      vehicleType,
    }),
    onSuccess: ({ data }) => onCreated(data),
    onError: (error) => setFormError(getApiErrorMessage(
      error,
      'Không thể tạo yêu cầu chuyến. Hãy kiểm tra mạng và thử lại.',
    )),
  });

  const canSubmit = Boolean(
    pickupCoords && dropoffCoords && pickup.trim() && dropoff.trim() &&
    estimateQuery.data && !estimateQuery.isError,
  );
  const mapOrigin = pickupCoords ?? currentLocation ?? DEFAULT_CENTER;
  const mapDestination = dropoffCoords ?? mapOrigin;
  const mapRoute = routeCoords.length > 1 ? routeCoords : pickupCoords && dropoffCoords
    ? [pickupCoords, dropoffCoords]
    : [];
  const locationBias = currentLocation
    ? `${currentLocation.latitude},${currentLocation.longitude}`
    : undefined;
  const estimate = estimateQuery.data;

  const submit = () => {
    setFormError(undefined);
    if (!pickupCoords || !dropoffCoords) {
      setFormError('Hãy chọn điểm đón và điểm đến từ gợi ý hoặc trên bản đồ.');
      return;
    }
    if (!estimate) {
      setFormError('Chưa thể xác nhận giá và lộ trình. Vui lòng thử lại.');
      return;
    }
    createMutation.mutate();
  };

  const vehicleOptions = useMemo(() => [
    { type: 'BIKE' as const, label: 'Xe máy', Icon: Bike },
    { type: 'CAR' as const, label: 'Ô tô', Icon: Car },
  ], []);

  return (
    <View style={styles.screen}>
      <ActiveRideMap
        ref={mapRef}
        originCoords={mapOrigin}
        destinationCoords={mapDestination}
        routeCoords={mapRoute}
        originLabel={pickup || 'Điểm đón'}
        destinationLabel={dropoff || 'Điểm đến'}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đưa bản đồ về vị trí hiện tại"
        onPress={() => mapRef.current?.recenter(currentLocation)}
        style={({ pressed }) => [styles.recenter, pressed && styles.pressed]}
      >
        <LocateFixed size={22} color={colors.primary} />
      </Pressable>

      <DraggableBottomSheet
        initialSnapIndex={1}
        snapPoints={[0.4, 0.72, 0.94]}
        footer={(
          <AppButton
            title="TÌM TÀI XẾ"
            variant="passenger"
            disabled={!canSubmit}
            isLoading={createMutation.isPending}
            onPress={submit}
          />
        )}
      >
        <View style={styles.content}>
          <View>
            <AppText variant="h2" weight="semibold">Bạn muốn đi đâu?</AppText>
            <AppText variant="bodySmall" style={styles.subtitle}>Chọn chính xác hai điểm để hệ thống tìm tài xế thuận tuyến.</AppText>
          </View>

          <LocationPicker
            label="Điểm đón"
            placeholder="Vị trí hiện tại hoặc địa chỉ đón"
            value={pickup}
            selected={Boolean(pickupCoords)}
            locationBias={locationBias}
            onChangeText={(value) => { setPickup(value); setPickupCoords(undefined); }}
            onSelectCoords={(latitude, longitude, description) => {
              setPickup(description);
              setPickupCoords({ latitude, longitude });
            }}
          />
          <LocationPicker
            label="Điểm đến"
            placeholder="Bạn muốn đến đâu?"
            value={dropoff}
            selected={Boolean(dropoffCoords)}
            locationBias={locationBias}
            onChangeText={(value) => { setDropoff(value); setDropoffCoords(undefined); }}
            onSelectCoords={(latitude, longitude, description) => {
              setDropoff(description);
              setDropoffCoords({ latitude, longitude });
            }}
          />

          <View>
            <AppText variant="bodySmall" weight="semibold" style={styles.sectionLabel}>PHƯƠNG TIỆN</AppText>
            <View style={styles.vehicleRow}>
              {vehicleOptions.map(({ type, label, Icon }) => {
                const selected = vehicleType === type;
                return (
                  <Pressable
                    key={type}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setVehicleType(type)}
                    style={({ pressed }) => [styles.vehicle, selected && styles.vehicleSelected, pressed && styles.pressed]}
                  >
                    <Icon size={24} color={selected ? colors.primary : colors.textSecondary} />
                    <AppText weight="semibold" style={selected ? styles.selectedText : undefined}>{label}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {pickupCoords && dropoffCoords ? (
            <View style={styles.summary}>
              <View style={styles.summaryTitle}>
                <Route size={20} color={colors.primary} />
                <AppText weight="semibold">Đi ngay</AppText>
              </View>
              {estimateQuery.isLoading ? (
                <View style={styles.inlineState}><ActivityIndicator color={colors.primary} /><AppText variant="bodySmall">Đang tính tuyến và giá…</AppText></View>
              ) : estimateQuery.isError ? (
                <View>
                  <AppText accessibilityRole="alert" variant="bodySmall" style={styles.error}>Không thể tính giá hoặc lộ trình.</AppText>
                  <Pressable accessibilityRole="button" onPress={() => void estimateQuery.refetch()} style={styles.retry}><AppText weight="semibold" style={styles.selectedText}>Thử lại</AppText></Pressable>
                </View>
              ) : estimate ? (
                <View style={styles.estimateRow}>
                  <View><AppText variant="caption">Quãng đường</AppText><AppText weight="semibold">{estimate.estimatedDistance.toFixed(1)} km · {estimate.estimatedDuration} phút</AppText></View>
                  <View style={styles.price}><AppText variant="caption">Giá dự kiến</AppText><AppText variant="h3" weight="semibold" style={styles.selectedText}>{estimate.estimatedPrice.toLocaleString('vi-VN')}đ</AppText></View>
                </View>
              ) : null}
              {routeError ? <AppText variant="caption" style={styles.warning}>{routeError}</AppText> : null}
            </View>
          ) : null}
          {formError ? <AppText accessibilityRole="alert" style={styles.error}>{formError}</AppText> : null}
        </View>
      </DraggableBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  recenter: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.full, borderWidth: 1, height: layout.minTouchTarget, justifyContent: 'center', position: 'absolute', right: spacing.md, top: spacing.md, width: layout.minTouchTarget },
  content: { gap: spacing.md, paddingHorizontal: layout.screenGutter, paddingTop: spacing.sm },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs },
  sectionLabel: { color: colors.textSecondary, letterSpacing: 0.6, marginBottom: spacing.sm },
  vehicleRow: { flexDirection: 'row', gap: spacing.sm },
  vehicle: { alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderRadius: radius.input, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md },
  vehicleSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  selectedText: { color: colors.primary },
  summary: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.card, gap: spacing.sm, padding: spacing.md },
  summaryTitle: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  inlineState: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 44 },
  estimateRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  price: { alignItems: 'flex-end' },
  retry: { alignItems: 'center', alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  warning: { color: colors.warning },
  error: { color: colors.danger },
  pressed: { opacity: 0.72 },
});
