import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bike, Car, LocateFixed, Route } from 'lucide-react-native';

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
  const router = useRouter();
  const routeParams = useLocalSearchParams<{
    pickup?: string;
    dropoff?: string;
    pickupLat?: string;
    pickupLng?: string;
    dropoffLat?: string;
    dropoffLng?: string;
  }>();

  const mapRef = useRef<ActiveRideMapHandle>(null);
  const [pickup, setPickup] = useState(
    initialTrip?.originAddress ?? (typeof routeParams.pickup === 'string' ? routeParams.pickup : ''),
  );
  const [dropoff, setDropoff] = useState(
    initialTrip?.destAddress ?? (typeof routeParams.dropoff === 'string' ? routeParams.dropoff : ''),
  );

  const [pickupCoords, setPickupCoords] = useState<ActiveRideLatLng | undefined>(() => {
    if (initialTrip) return { latitude: initialTrip.originLat, longitude: initialTrip.originLng };
    const lat = Number(routeParams.pickupLat);
    const lng = Number(routeParams.pickupLng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : undefined;
  });

  const [dropoffCoords, setDropoffCoords] = useState<ActiveRideLatLng | undefined>(() => {
    if (initialTrip) return { latitude: initialTrip.destLat, longitude: initialTrip.destLng };
    const lat = Number(routeParams.dropoffLat);
    const lng = Number(routeParams.dropoffLng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : undefined;
  });

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
    if (!pickupCoords || !dropoffCoords) return;
    void getDirections(pickupCoords, dropoffCoords, vehicleType === 'CAR' ? 'car' : 'bike')
      .then((result) => {
        if (cancelled) return;
        setRouteError(result ? undefined : 'Không tải được đường đi chi tiết; hãy kiểm tra kết nối.');
        setRouteCoords(result?.polylineCoords.length
          ? result.polylineCoords
          : [pickupCoords, dropoffCoords]);
      });
    return () => { cancelled = true; };
  }, [dropoffCoords, pickupCoords, vehicleType]);

  const bikeEstimateQuery = useQuery({
    queryKey: [
      'ride-hailing-estimate',
      pickupCoords?.latitude,
      pickupCoords?.longitude,
      dropoffCoords?.latitude,
      dropoffCoords?.longitude,
      'BIKE',
    ],
    queryFn: () => pricingService.estimateRideHailing({
      originLat: pickupCoords!.latitude,
      originLng: pickupCoords!.longitude,
      destLat: dropoffCoords!.latitude,
      destLng: dropoffCoords!.longitude,
      vehicleType: 'BIKE',
    }),
    enabled: Boolean(pickupCoords && dropoffCoords),
    staleTime: 30_000,
    retry: 1,
  });

  const carEstimateQuery = useQuery({
    queryKey: [
      'ride-hailing-estimate',
      pickupCoords?.latitude,
      pickupCoords?.longitude,
      dropoffCoords?.latitude,
      dropoffCoords?.longitude,
      'CAR',
    ],
    queryFn: () => pricingService.estimateRideHailing({
      originLat: pickupCoords!.latitude,
      originLng: pickupCoords!.longitude,
      destLat: dropoffCoords!.latitude,
      destLng: dropoffCoords!.longitude,
      vehicleType: 'CAR',
    }),
    enabled: Boolean(pickupCoords && dropoffCoords),
    staleTime: 30_000,
    retry: 1,
  });

  const activeEstimateQuery = vehicleType === 'CAR' ? carEstimateQuery : bikeEstimateQuery;
  const estimate = activeEstimateQuery.data;

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
    estimate && !activeEstimateQuery.isError,
  );
  const mapOrigin = pickupCoords ?? currentLocation ?? DEFAULT_CENTER;
  const mapDestination = dropoffCoords ?? mapOrigin;
  const mapRoute = routeCoords.length > 1 ? routeCoords : pickupCoords && dropoffCoords
    ? [pickupCoords, dropoffCoords]
    : [];
  const locationBias = currentLocation
    ? `${currentLocation.latitude},${currentLocation.longitude}`
    : undefined;

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
    {
      type: 'BIKE' as const,
      name: 'CoBike',
      desc: 'Xe máy · 1 chỗ',
      Icon: Bike,
      price: bikeEstimateQuery.data?.estimatedPrice,
      loading: bikeEstimateQuery.isLoading,
    },
    {
      type: 'CAR' as const,
      name: 'CoCar',
      desc: 'Ô tô · 4 chỗ',
      Icon: Car,
      price: carEstimateQuery.data?.estimatedPrice,
      loading: carEstimateQuery.isLoading,
    },
  ], [
    bikeEstimateQuery.data?.estimatedPrice,
    bikeEstimateQuery.isLoading,
    carEstimateQuery.data?.estimatedPrice,
    carEstimateQuery.isLoading,
  ]);

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

      {/* Floating Back Button to return to search or home */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại tìm kiếm"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(passenger-tabs)' as never);
        }}
        style={({ pressed }) => [styles.floatingBack, pressed && styles.pressed]}
      >
        <ArrowLeft size={22} color={colors.textPrimary} />
      </Pressable>

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
        snapPoints={[0.42, 0.74, 0.95]}
        footer={(
          <AppButton
            title={
              createMutation.isPending
                ? 'ĐANG TÌM TÀI XẾ…'
                : vehicleType === 'BIKE'
                  ? 'TÌM TÀI XẾ COBIKE'
                  : 'TÌM TÀI XẾ COCAR'
            }
            variant="passenger"
            disabled={!canSubmit}
            isLoading={createMutation.isPending}
            onPress={submit}
          />
        )}
      >
        <View style={styles.content}>
          <View>
            <AppText variant="h2" weight="semibold">Đặt chuyến xe CoRide</AppText>
            <AppText variant="bodySmall" style={styles.subtitle}>Chọn loại phương tiện và điểm đón/trả phù hợp với bạn.</AppText>
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
            <AppText variant="bodySmall" weight="semibold" style={styles.sectionLabel}>LỰA CHỌN LOẠI XE</AppText>
            <View style={styles.vehicleRow}>
              {vehicleOptions.map(({ type, name, desc, Icon, price, loading }) => {
                const selected = vehicleType === type;
                return (
                  <Pressable
                    key={type}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setVehicleType(type)}
                    style={({ pressed }) => [
                      styles.vehicle,
                      selected && styles.vehicleSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.vehicleIconBox, selected && styles.vehicleIconBoxSelected]}>
                      <Icon size={24} color={selected ? colors.primary : colors.textSecondary} />
                    </View>
                    <View style={styles.vehicleInfo}>
                      <AppText weight="semibold" style={selected ? styles.selectedText : undefined}>{name}</AppText>
                      <AppText variant="caption" style={styles.vehicleDesc}>{desc}</AppText>
                      {loading ? (
                        <ActivityIndicator size="small" color={colors.primary} style={styles.priceLoader} />
                      ) : price ? (
                        <AppText weight="bold" style={styles.vehiclePrice}>
                          {price.toLocaleString('vi-VN')}đ
                        </AppText>
                      ) : (
                        <AppText variant="caption" style={styles.vehiclePriceEmpty}>--</AppText>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {pickupCoords && dropoffCoords ? (
            <View style={styles.summary}>
              <View style={styles.summaryTitle}>
                <Route size={20} color={colors.primary} />
                <AppText weight="semibold">Chi tiết hành trình</AppText>
              </View>
              {activeEstimateQuery.isLoading ? (
                <View style={styles.inlineState}><ActivityIndicator color={colors.primary} /><AppText variant="bodySmall">Đang tính tuyến và giá…</AppText></View>
              ) : activeEstimateQuery.isError ? (
                <View>
                  <AppText accessibilityRole="alert" variant="bodySmall" style={styles.error}>Không thể tính giá hoặc lộ trình.</AppText>
                  <Pressable accessibilityRole="button" onPress={() => void activeEstimateQuery.refetch()} style={styles.retry}><AppText weight="semibold" style={styles.selectedText}>Thử lại</AppText></Pressable>
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
  floatingBack: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    elevation: 4,
    height: layout.minTouchTarget,
    justifyContent: 'center',
    left: spacing.md,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    top: spacing.md,
    width: layout.minTouchTarget,
    zIndex: 10,
  },
  recenter: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    elevation: 4,
    height: layout.minTouchTarget,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    top: spacing.md,
    width: layout.minTouchTarget,
    zIndex: 10,
  },
  content: { gap: spacing.md, paddingHorizontal: layout.screenGutter, paddingTop: spacing.sm },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs },
  sectionLabel: { color: colors.textSecondary, letterSpacing: 0.6, marginBottom: spacing.sm },
  vehicleRow: { flexDirection: 'row', gap: spacing.sm },
  vehicle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 70,
    padding: spacing.sm,
  },
  vehicleSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  vehicleIconBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  vehicleIconBoxSelected: {
    backgroundColor: colors.surface,
  },
  vehicleInfo: {
    flex: 1,
    minWidth: 0,
  },
  vehicleDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  vehiclePrice: {
    color: colors.primary,
    fontSize: 13,
    marginTop: 2,
  },
  vehiclePriceEmpty: {
    color: colors.textTertiary,
    marginTop: 2,
  },
  priceLoader: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
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
