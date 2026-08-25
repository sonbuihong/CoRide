import React, { useEffect, useMemo, useRef, useState } from "react";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import type {
  CreateRideInput,
  CreateRideScheduleInput,
  GoongRoute,
  GoongRouteLeg,
  RideStopInput,
  PlaceSearchResult,
} from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths, format, getDaysInMonth, startOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bike,
  CalendarDays,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Cigarette,
  Clock3,
  GripVertical,
  Info,
  Luggage,
  LocateFixed,
  MapPin,
  MapPinned,
  Minus,
  PawPrint,
  Plus,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from "lucide-react-native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationPicker } from "../../src/components/LocationPicker";
import { PlaceSelectionMapModal } from "../../src/components/PlaceSelectionMapModal";
import { RoutePreviewMap } from "../../src/components/RoutePreviewMap";
import {
  StartLocationMap,
  type MapCoordinates,
} from "../../src/components/StartLocationMap";
import { AppButton } from "../../src/components/ui/AppButton";
import { AppText } from "../../src/components/ui/AppText";
import { IconButton } from "../../src/components/ui/IconButton";
import {
  getDirectionsMobile,
  getReverseGeocodeMobile,
  reversePlacesMobile,
} from "../../src/services/goong.service";
import { pricingService } from "../../src/services/pricing.service";
import {
  rideDraftService,
  type RideDraftExtras,
} from "../../src/services/ride-draft.service";
import { rideService } from "../../src/services/ride.service";
import {
  vehicleService,
  type DriverVehicle,
} from "../../src/services/vehicle.service";
import { colors, layout, radius, spacing } from "../../src/theme/tokens";
import { resolveMapCandidate } from "../../src/utils/place-selection";

const STEPS = [
  "Hành trình",
  "Xác nhận điểm đi",
  "Chọn lộ trình",
  "Điểm dừng",
  "Ngày đi",
  "Giờ đi",
  "Chỗ & quy định",
  "Đặt chỗ",
  "Giá mỗi ghế",
  "Hoàn tất",
];
const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const initialDeparture = () => {
  const value = new Date(Date.now() + 60 * 60 * 1000);
  value.setSeconds(0, 0);
  return value;
};
const dateKey = (value: Date) => format(value, "yyyy-MM-dd");
const initialClock = () => format(initialDeparture(), "HH:mm");
const createDefaults = (): CreateRideInput => ({
  origin: "",
  destination: "",
  originProvince: "",
  destProvince: "",
  departureTime: initialDeparture().toISOString(),
  availableSeats: 4,
  pricePerSeat: 0,
  description: "",
  allowRoutePickup: true,
  allowSmoking: false,
  allowPets: false,
  allowLuggage: true,
  bookingPolicy: "DRIVER_APPROVAL",
  stops: [],
});
const provinceFromAddress = (address: string) => {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.at(-2) || parts.at(-1) || address;
};
const shortPlaceName = (address?: string) =>
  address?.split(",")[0]?.trim() || "Vị trí đã chọn";
const routeMetrics = (route: GoongRoute) => ({
  distance: route.legs.reduce(
    (sum: number, leg: GoongRouteLeg) => sum + leg.distance.value,
    0,
  ),
  duration: route.legs.reduce(
    (sum: number, leg: GoongRouteLeg) => sum + leg.duration.value,
    0,
  ),
});
const vehicleSeatLimit = (vehicle?: DriverVehicle) =>
  vehicle?.type === "BIKE" ? 1 : 4;
const messageOf = (error: unknown, fallback: string) =>
  error &&
  typeof error === "object" &&
  "message" in error &&
  typeof error.message === "string"
    ? error.message
    : fallback;
const toDepartureIso = (day: string, clock: string) =>
  new Date(`${day}T${clock}:00+07:00`).toISOString();
const sameStops = (stops: RideStopInput[]) =>
  stops.map((stop) => `${stop.latitude},${stop.longitude}`).join("|");

export default function CreateRideScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const routeRequest = useRef(0);
  const mapResolveRequest = useRef(0);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateRideInput>(createDefaults);
  const [selectedDates, setSelectedDates] = useState<string[]>([
    dateKey(initialDeparture()),
  ]);
  const [departureClock, setDepartureClock] = useState(initialClock);
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));
  const [stops, setStops] = useState<RideStopInput[]>([]);
  const [routes, setRoutes] = useState<GoongRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string>();
  const [locationAttempt, setLocationAttempt] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string>();
  const [mapCenter, setMapCenter] = useState<MapCoordinates>();
  const [mapPlace, setMapPlace] = useState<PlaceSearchResult>();
  const [mapResolving, setMapResolving] = useState(false);
  const [mapMoving, setMapMoving] = useState(false);
  const [mapCameraTarget, setMapCameraTarget] = useState<MapCoordinates>();
  const [confirmingStart, setConfirmingStart] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [screenError, setScreenError] = useState<string>();
  const [draftReady, setDraftReady] = useState(false);
  const [created, setCreated] = useState(false);

  const setField = <K extends keyof CreateRideInput>(
    key: K,
    value: CreateRideInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const vehiclesQuery = useQuery({
    queryKey: ["active-vehicles"],
    queryFn: vehicleService.getActiveVehicles,
    retry: 1,
  });
  const selectedVehicle = useMemo(
    () => vehiclesQuery.data?.find((vehicle) => vehicle.id === form.vehicleId),
    [form.vehicleId, vehiclesQuery.data],
  );
  const maxSeats = vehicleSeatLimit(selectedVehicle);
  const stopSignature = sameStops(stops);

  const pricingQuery = useQuery({
    queryKey: [
      "carpool-price-route",
      form.originLat,
      form.originLng,
      form.destinationLat,
      form.destinationLng,
      form.routePolyline,
      selectedVehicle?.type,
      form.availableSeats,
      stopSignature,
    ],
    enabled:
      step >= 8 &&
      Boolean(
        form.routePolyline &&
        selectedVehicle &&
        form.originLat != null &&
        form.originLng != null &&
        form.destinationLat != null &&
        form.destinationLng != null,
      ),
    retry: false,
    queryFn: () =>
      pricingService.estimateCarpool({
        originLat: form.originLat!,
        originLng: form.originLng!,
        destLat: form.destinationLat!,
        destLng: form.destinationLng!,
        vehicleType: selectedVehicle!.type,
        offeredSeats: form.availableSeats,
        routePolyline: form.routePolyline,
        waypoints: stops.map((stop) => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
      }),
  });

  const mutation = useMutation({
    mutationFn: (data: CreateRideScheduleInput) =>
      rideService.createRideSchedule(data),
    onMutate: () => setScreenError(undefined),
    onSuccess: async (result) => {
      setCreated(true);
      await rideDraftService.clear();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rides"] }),
        queryClient.invalidateQueries({ queryKey: ["my-driver-rides"] }),
        queryClient.invalidateQueries({ queryKey: ["driver-home"] }),
        queryClient.invalidateQueries({ queryKey: ["driver-bookings"] }),
      ]);
      const firstRide = result.rides[0];
      if (firstRide) router.replace(`/ride/${firstRide.id}` as never);
    },
    onError: (error) =>
      setScreenError(
        messageOf(
          error,
          "Không thể đăng lịch chuyến. Dữ liệu vẫn được giữ để bạn thử lại.",
        ),
      ),
  });

  useEffect(() => {
    if (!pricingQuery.data) return;
    setForm((current) => {
      const inRange =
        current.pricePerSeat >= pricingQuery.data.minimumPricePerSeat &&
        current.pricePerSeat <= pricingQuery.data.maximumPricePerSeat;
      return inRange
        ? current
        : {
            ...current,
            pricePerSeat: pricingQuery.data.recommendedPricePerSeat,
          };
    });
  }, [pricingQuery.data]);

  useEffect(() => {
    let mounted = true;
    rideDraftService.load().then((draft) => {
      if (!mounted) return;
      if (draft) {
        const restored = {
          ...createDefaults(),
          ...draft.form,
          stops: draft.extras.stops,
        };
        setForm(restored);
        setStops(draft.extras.stops);
        setSelectedDates(
          draft.extras.selectedDates.length
            ? draft.extras.selectedDates
            : [dateKey(initialDeparture())],
        );
        setDepartureClock(draft.extras.departureClock);
        setSelectedRouteIndex(draft.extras.selectedRouteIndex);
        setStep(draft.step >= 2 ? 2 : draft.step);
        setRoutes([]);
        setDraftReady(true);
        if (restored.originLat == null) setLocationAttempt(0);
      } else {
        setDraftReady(true);
        setLocationAttempt(0);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!draftReady || created || (!form.origin && !form.destination)) return;
    const extras: RideDraftExtras = {
      selectedDates,
      departureClock,
      stops,
      selectedRouteIndex,
    };
    const timer = setTimeout(
      () =>
        rideDraftService
          .save(step, { ...form, stops }, extras)
          .catch(() => undefined),
      600,
    );
    return () => clearTimeout(timer);
  }, [
    created,
    departureClock,
    draftReady,
    form,
    selectedDates,
    selectedRouteIndex,
    step,
    stops,
  ]);

  useEffect(() => {
    const vehicles = vehiclesQuery.data;
    if (!vehicles?.length) return;
    const current =
      vehicles.find((vehicle) => vehicle.id === form.vehicleId) || vehicles[0];
    setForm((value) => ({
      ...value,
      vehicleId: current.id,
      availableSeats: Math.min(value.availableSeats, vehicleSeatLimit(current)),
    }));
  }, [form.vehicleId, vehiclesQuery.data]);

  useEffect(() => {
    if (locationAttempt == null || form.originLat != null) return;
    let mounted = true;
    const locate = async () => {
      setLocationLoading(true);
      setLocationError(undefined);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted")
          throw new Error(
            "Chưa có quyền vị trí. Bạn vẫn có thể chọn điểm đi thủ công.",
          );
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = current.coords;
        const goong = await getReverseGeocodeMobile(latitude, longitude, "v2");
        const fallback = !goong?.address
          ? (await Location.reverseGeocodeAsync({ latitude, longitude }))[0]
          : undefined;
        const address =
          goong?.address ||
          [
            fallback?.name,
            fallback?.street,
            fallback?.district,
            fallback?.city,
            fallback?.region,
          ]
            .filter(Boolean)
            .join(", ");
        if (!address)
          throw new Error(
            "Không đọc được địa chỉ hiện tại. Hãy chọn điểm đi thủ công.",
          );
        if (!mounted) return;
        setForm((value) => ({
          ...value,
          origin: address,
          originProvince: provinceFromAddress(address),
          originLat: latitude,
          originLng: longitude,
        }));
        setMapCenter({ latitude, longitude });
      } catch (error) {
        if (mounted)
          setLocationError(messageOf(error, "Không thể lấy vị trí hiện tại."));
      } finally {
        if (mounted) setLocationLoading(false);
      }
    };
    locate();
    return () => {
      mounted = false;
    };
  }, [form.originLat, locationAttempt]);

  const invalidateRoute = () => {
    routeRequest.current += 1;
    setRoutes([]);
    setSelectedRouteIndex(0);
    setRouteError(undefined);
    setForm((value) => ({
      ...value,
      routePolyline: undefined,
      distance: undefined,
      duration: undefined,
      pricePerSeat: 0,
    }));
  };
  const applyRoute = (route: GoongRoute, index: number) => {
    const metrics = routeMetrics(route);
    setSelectedRouteIndex(index);
    setForm((value) => ({
      ...value,
      distance: metrics.distance / 1000,
      duration: Math.ceil(metrics.duration / 60),
      routePolyline: route.overview_polyline.points,
      pricePerSeat: 0,
    }));
  };
  const loadRoutes = async (routeStops = stops) => {
    if (
      form.originLat == null ||
      form.originLng == null ||
      form.destinationLat == null ||
      form.destinationLng == null
    ) {
      setRouteError("Chọn điểm đi và điểm đến từ gợi ý trước khi tính tuyến.");
      return false;
    }
    if (!selectedVehicle) {
      setRouteError("Bạn cần một phương tiện đang hoạt động.");
      return false;
    }
    const requestId = ++routeRequest.current;
    setRouteLoading(true);
    setRouteError(undefined);
    try {
      const result = await getDirectionsMobile(
        `${form.originLat},${form.originLng}`,
        `${form.destinationLat},${form.destinationLng}`,
        selectedVehicle.type === "BIKE" ? "bike" : "car",
        routeStops.length === 0,
        routeStops.map((stop) => `${stop.latitude},${stop.longitude}`),
      );
      if (requestId !== routeRequest.current) return false;
      const nextRoutes = result?.routes?.slice(0, 5) ?? [];
      if (!nextRoutes.length)
        throw new Error(
          "Không tìm thấy tuyến phù hợp giữa các địa điểm đã chọn.",
        );
      setRoutes(nextRoutes);
      applyRoute(nextRoutes[0], 0);
      return true;
    } catch (error) {
      if (requestId === routeRequest.current)
        setRouteError(
          messageOf(
            error,
            "Không tải được lộ trình. Kiểm tra kết nối và thử lại.",
          ),
        );
      return false;
    } finally {
      if (requestId === routeRequest.current) setRouteLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2 && routes.length === 0 && !routeLoading)
      loadRoutes([]).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== 1 || !mapCenter || mapMoving) return;
    const timer = setTimeout(() => {
      const requestId = ++mapResolveRequest.current;
      setMapResolving(true);
      setMapPlace(undefined);
      void reversePlacesMobile(mapCenter.latitude, mapCenter.longitude, 5, "v2")
        .then((results) => {
          if (requestId !== mapResolveRequest.current) return;
          const resolution = resolveMapCandidate(mapCenter, results, undefined, false);
          if (!resolution.selected) throw new Error("missing map candidate");
          setMapPlace(resolution.selected);
        })
        .catch(() => {
          if (requestId === mapResolveRequest.current) setScreenError("Không đọc được địa chỉ tại vị trí này. Hãy di chuyển bản đồ và thử lại.");
        })
        .finally(() => {
          if (requestId === mapResolveRequest.current) setMapResolving(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [mapCenter, mapMoving, step]);

  const handleMapCenterChange = (next: MapCoordinates) => {
    setMapCameraTarget(undefined);
    setMapCenter(next);
  };

  const handleMapMovingChange = (moving: boolean) => {
    setMapMoving(moving);
    if (moving) {
      mapResolveRequest.current += 1;
      setMapPlace(undefined);
      setScreenError(undefined);
    }
  };

  const confirmStart = async () => {
    if (!mapCenter || !mapPlace || mapPlace.latitude == null || mapPlace.longitude == null || mapResolving || mapMoving) {
      setScreenError("Hãy chờ hệ thống xác định xong địa chỉ tại điểm ghim.");
      return;
    }
    setConfirmingStart(true);
    setScreenError(undefined);
    try {
      const address = mapPlace.address;
      setForm((value) => ({
        ...value,
        origin: address,
        originProvince: provinceFromAddress(address || ""),
        originLat: mapPlace.latitude,
        originLng: mapPlace.longitude,
      }));
      invalidateRoute();
      setStep(2);
    } finally {
      setConfirmingStart(false);
    }
  };

  const departures = useMemo(
    () => selectedDates.map((day) => toDepartureIso(day, departureClock)),
    [departureClock, selectedDates],
  );
  const departuresValid =
    departures.length > 0 &&
    departures.every((value) => new Date(value).getTime() > Date.now());

  const continueFlow = async () => {
    setScreenError(undefined);
    if (step === 0) {
      if (
        !form.origin ||
        form.originLat == null ||
        form.originLng == null ||
        !form.destination ||
        form.destinationLat == null ||
        form.destinationLng == null
      ) {
        setScreenError(
          "Chọn cả điểm đi và điểm đến từ danh sách gợi ý để có tọa độ chính xác.",
        );
        return;
      }
      const initialMapCenter = { latitude: form.originLat, longitude: form.originLng };
      setMapCenter(initialMapCenter);
      setMapCameraTarget(initialMapCenter);
      setMapPlace(undefined);
      setStep(1);
      return;
    }
    if (step === 1) {
      await confirmStart();
      return;
    }
    if (step === 2) {
      if (!form.routePolyline && !(await loadRoutes([]))) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      if (
        stops.some(
          (stop) =>
            !stop.address ||
            !Number.isFinite(stop.latitude) ||
            !Number.isFinite(stop.longitude),
        )
      ) {
        setScreenError("Hoàn tất hoặc xóa điểm dừng chưa được chọn.");
        return;
      }
      if (stops.length && !(await loadRoutes(stops))) return;
      setStep(4);
      return;
    }
    if (step === 4) {
      if (!selectedDates.length) {
        setScreenError("Chọn ít nhất một ngày khởi hành.");
        return;
      }
      setStep(5);
      return;
    }
    if (step === 5) {
      if (!departuresValid) {
        setScreenError("Giờ khởi hành của ngày hôm nay phải ở tương lai.");
        return;
      }
      setStep(6);
      return;
    }
    if (step === 6) {
      if (!selectedVehicle) {
        setScreenError("Chọn phương tiện đang hoạt động.");
        return;
      }
      setStep(7);
      return;
    }
    if (step === 7) {
      setStep(8);
      return;
    }
    if (step === 8) {
      const estimate = pricingQuery.data;
      if (!estimate) {
        setScreenError("Chờ CoRide tính khoảng giá trước khi tiếp tục.");
        return;
      }
      if (
        form.pricePerSeat < estimate.minimumPricePerSeat ||
        form.pricePerSeat > estimate.maximumPricePerSeat
      ) {
        setScreenError("Giá đã nhập nằm ngoài khoảng CoRide cho phép.");
        return;
      }
      setStep(9);
    }
  };

  const submit = () => {
    if (mutation.isPending || !departuresValid || !form.routePolyline) return;
    mutation.mutate({
      ...form,
      originProvince:
        form.originProvince || provinceFromAddress(form.origin || ""),
      destProvince:
        form.destProvince || provinceFromAddress(form.destination || ""),
      departureTimes: departures,
      timezone: "Asia/Ho_Chi_Minh",
      stops,
    });
  };

  const originCoordinates =
    form.originLat != null && form.originLng != null
      ? { latitude: form.originLat, longitude: form.originLng }
      : undefined;
  const destinationCoordinates =
    form.destinationLat != null && form.destinationLng != null
      ? { latitude: form.destinationLat, longitude: form.destinationLng }
      : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <IconButton
          tone="ghost"
          icon={<ArrowLeft size={22} color={colors.textPrimary} />}
          accessibilityLabel={
            step > 0 ? "Quay lại bước trước" : "Thoát đăng chuyến"
          }
          onPress={() =>
            step > 0 ? setStep((value) => value - 1) : router.back()
          }
        />
        <View style={styles.headerCopy}>
          <AppText variant="h3" weight="semibold">
            Đăng chuyến
          </AppText>
          <AppText variant="caption" style={styles.secondary}>
            Bước {step + 1}/10 · {STEPS[step]}
          </AppText>
        </View>
      </View>
      <View style={styles.progressTrack}>
        {STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressSegment,
              index <= step && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {step === 1 && originCoordinates && destinationCoordinates ? (
          <View style={styles.mapFlowContent}>
            <StartConfirmStep
              origin={originCoordinates}
              center={mapCenter || originCoordinates}
              place={mapPlace}
              resolving={mapResolving}
              cameraTarget={mapCameraTarget}
              onCenterChange={handleMapCenterChange}
              onMovingChange={handleMapMovingChange}
              onLocate={(coordinates) => {
                setMapCenter(coordinates);
                setMapCameraTarget(coordinates);
              }}
              onLocateError={setScreenError}
            />
          </View>
        ) : step === 2 && originCoordinates && destinationCoordinates ? (
          <View style={styles.mapFlowContent}>
            <RouteStep
              origin={originCoordinates}
              destination={destinationCoordinates}
              routes={routes}
              selectedIndex={selectedRouteIndex}
              selectedPolyline={form.routePolyline}
              loading={routeLoading}
              error={routeError}
              onSelect={applyRoute}
              onRetry={() => loadRoutes([])}
            />
          </View>
        ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <JourneyStep
              form={form}
              setForm={setForm}
              invalidateRoute={invalidateRoute}
              locationBias={
                mapCenter
                  ? `${mapCenter.latitude},${mapCenter.longitude}`
                  : undefined
              }
              locationLoading={locationLoading}
              locationError={locationError}
              retryLocation={() =>
                setLocationAttempt((value) => (value ?? 0) + 1)
              }
            />
          )}
          {step === 3 && (
            <StopsStep
              stops={stops}
              setStops={(next) => {
                setStops(next);
                invalidateRoute();
              }}
            />
          )}
          {step === 4 && (
            <DatesStep
              selectedDates={selectedDates}
              setSelectedDates={setSelectedDates}
              month={calendarMonth}
              setMonth={setCalendarMonth}
            />
          )}
          {step === 5 && (
            <TimeStep
              clock={departureClock}
              setClock={setDepartureClock}
              pickerOpen={timePickerOpen}
              setPickerOpen={setTimePickerOpen}
              valid={departuresValid}
            />
          )}
          {step === 6 && (
            <VehicleRulesStep
              form={form}
              setForm={setForm}
              vehicles={vehiclesQuery.data ?? []}
              loading={vehiclesQuery.isLoading}
              error={vehiclesQuery.isError}
              retry={() => vehiclesQuery.refetch()}
              maxSeats={maxSeats}
              invalidateRoute={invalidateRoute}
            />
          )}
          {step === 7 && (
            <BookingPolicyStep
              value={form.bookingPolicy ?? "DRIVER_APPROVAL"}
              onChange={(value) => setField("bookingPolicy", value)}
            />
          )}
          {step === 8 && (
            <PriceStep
              value={form.pricePerSeat}
              onChange={(value) => setField("pricePerSeat", value)}
              query={pricingQuery}
            />
          )}
          {step === 9 && originCoordinates && destinationCoordinates && (
            <ReviewStep
              form={form}
              dates={selectedDates}
              clock={departureClock}
              stops={stops}
              vehicle={selectedVehicle}
              origin={originCoordinates}
              destination={destinationCoordinates}
              routes={routes}
              selectedRouteIndex={selectedRouteIndex}
            />
          )}
          {(screenError || (routeError && step !== 2)) && (
            <InlineError
              message={screenError || routeError!}
              onRetry={
                step === 8
                  ? () => pricingQuery.refetch()
                  : () => setScreenError(undefined)
              }
            />
          )}
        </ScrollView>
        )}
        <View style={styles.footer}>
          {step > 0 && (
            <AppButton
              title="Quay lại"
              variant="ghost"
              onPress={() => setStep((value) => value - 1)}
              style={styles.backButton}
            />
          )}
          <AppButton
            title={
              step === 9
                ? `Đăng ${selectedDates.length} chuyến`
                : step === 1
                  ? "Xác nhận điểm đi"
                  : "Tiếp tục"
            }
            variant="driver"
            onPress={step === 9 ? submit : continueFlow}
            isLoading={mutation.isPending || routeLoading || confirmingStart}
            disabled={(step === 8 && pricingQuery.isFetching) || (step === 1 && (!mapPlace || mapResolving || mapMoving))}
            style={styles.nextButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function JourneyStep({
  form,
  setForm,
  invalidateRoute,
  locationBias,
  locationLoading,
  locationError,
  retryLocation,
}: {
  form: CreateRideInput;
  setForm: React.Dispatch<React.SetStateAction<CreateRideInput>>;
  invalidateRoute: () => void;
  locationBias?: string;
  locationLoading: boolean;
  locationError?: string;
  retryLocation: () => void;
}) {
  const [activeLocationKind, setActiveLocationKind] = useState<"origin" | "destination">("origin");
  const [mapSelectionOpen, setMapSelectionOpen] = useState(false);

  const biasCoordinates = useMemo(() => {
    if (!locationBias) return undefined;
    const [latitude, longitude] = locationBias.split(",").map(Number);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
    return { latitude, longitude };
  }, [locationBias]);

  const mapInitialCoordinates = useMemo(() => {
    if (activeLocationKind === "origin") {
      return form.originLat != null && form.originLng != null
        ? { latitude: form.originLat, longitude: form.originLng }
        : biasCoordinates;
    }
    if (form.destinationLat != null && form.destinationLng != null) {
      return { latitude: form.destinationLat, longitude: form.destinationLng };
    }
    return form.originLat != null && form.originLng != null
      ? { latitude: form.originLat, longitude: form.originLng }
      : biasCoordinates;
  }, [activeLocationKind, biasCoordinates, form.destinationLat, form.destinationLng, form.originLat, form.originLng]);

  const updateLocation = (kind: "origin" | "destination", text: string) => {
    setForm((value) => ({
      ...value,
      [kind]: text,
      ...(kind === "origin"
        ? { originLat: undefined, originLng: undefined, originProvince: "" }
        : {
            destinationLat: undefined,
            destinationLng: undefined,
            destProvince: "",
          }),
    }));
    invalidateRoute();
  };
  return (
    <View>
      <StepHeading
        title="Bạn sẽ đi đâu?"
        copy="Điểm đi đã được lấy tự động nếu bạn cho phép vị trí. Cả hai địa điểm vẫn có thể thay đổi."
      />
      {locationLoading && <StatusRow text="Đang xác định vị trí hiện tại…" />}
      <LocationPicker
        tone="driver"
        label="Điểm đi"
        placeholder="Chọn điểm bắt đầu"
        value={form.origin || ""}
        selected={form.originLat != null && form.originLng != null}
        locationBias={locationBias}
        showMapAction={false}
        onInputFocus={() => setActiveLocationKind("origin")}
        onChangeText={(text) => updateLocation("origin", text)}
        onSelectCoords={(lat, lng, description) =>
          setForm((value) => ({
            ...value,
            origin: description,
            originLat: lat,
            originLng: lng,
            originProvince: provinceFromAddress(description),
          }))
        }
        error={locationError}
      />
      <LocationPicker
        tone="driver"
        label="Điểm đến"
        placeholder="Bạn muốn đến đâu?"
        value={form.destination || ""}
        selected={form.destinationLat != null && form.destinationLng != null}
        locationBias={
          form.originLat != null && form.originLng != null
            ? `${form.originLat},${form.originLng}`
            : locationBias
        }
        showMapAction={false}
        onInputFocus={() => setActiveLocationKind("destination")}
        onChangeText={(text) => updateLocation("destination", text)}
        onSelectCoords={(lat, lng, description) =>
          setForm((value) => ({
            ...value,
            destination: description,
            destinationLat: lat,
            destinationLng: lng,
            destProvince: provinceFromAddress(description),
          }))
        }
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Chọn ${activeLocationKind === "origin" ? "điểm đi" : "điểm đến"} trên bản đồ`}
        onPress={() => setMapSelectionOpen(true)}
        style={({ pressed }) => [
          styles.sharedMapAction,
          pressed && styles.sharedMapActionPressed,
        ]}
      >
        <View style={styles.sharedMapActionIcon}>
          <MapPinned size={21} color={colors.driverAccent} />
        </View>
        <View style={styles.sharedMapActionCopy}>
          <AppText variant="bodySmall" weight="semibold" style={styles.sharedMapActionTitle}>
            Chọn vị trí trên bản đồ
          </AppText>
          <AppText variant="caption" style={styles.sharedMapActionHint}>
            Áp dụng cho {activeLocationKind === "origin" ? "điểm đi" : "điểm đến"}
          </AppText>
        </View>
      </Pressable>
      {locationError && (
        <Pressable
          accessibilityRole="button"
          onPress={retryLocation}
          style={styles.textAction}
        >
          <RefreshCw size={17} color={colors.primary} />
          <AppText
            variant="bodySmall"
            weight="semibold"
            style={styles.primaryText}
          >
            Thử lại vị trí hiện tại
          </AppText>
        </Pressable>
      )}
      <PlaceSelectionMapModal
        visible={mapSelectionOpen}
        title={`Chọn ${activeLocationKind === "origin" ? "điểm đi" : "điểm đến"}`}
        initialCoordinates={mapInitialCoordinates}
        onClose={() => setMapSelectionOpen(false)}
        onConfirm={(place) => {
          if (place.latitude == null || place.longitude == null) return;
          const address = place.address || place.name;
          setForm((value) =>
            activeLocationKind === "origin"
              ? {
                  ...value,
                  origin: address,
                  originLat: place.latitude,
                  originLng: place.longitude,
                  originProvince: provinceFromAddress(address),
                }
              : {
                  ...value,
                  destination: address,
                  destinationLat: place.latitude,
                  destinationLng: place.longitude,
                  destProvince: provinceFromAddress(address),
                },
          );
          invalidateRoute();
          setMapSelectionOpen(false);
        }}
      />
    </View>
  );
}

function StartConfirmStep({
  origin,
  center,
  place,
  resolving,
  cameraTarget,
  onCenterChange,
  onMovingChange,
  onLocate,
  onLocateError,
}: {
  origin: MapCoordinates;
  center: MapCoordinates;
  place?: PlaceSearchResult;
  resolving: boolean;
  cameraTarget?: MapCoordinates;
  onCenterChange: (value: MapCoordinates) => void;
  onMovingChange: (moving: boolean) => void;
  onLocate: (value: MapCoordinates) => void;
  onLocateError: (message: string) => void;
}) {
  const [locating, setLocating] = useState(false);

  const locateUser = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        onLocateError("Cần quyền vị trí để trở về vị trí hiện tại.");
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      onLocate({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch {
      onLocateError("Không thể lấy vị trí hiện tại. Hãy kiểm tra GPS và thử lại.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.mapStage}>
      <StartLocationMap origin={origin} cameraTarget={cameraTarget} onCenterChange={onCenterChange} onMovingChange={onMovingChange} />
      <Pressable
        accessibilityLabel="Trở về vị trí hiện tại"
        accessibilityRole="button"
        disabled={locating}
        onPress={() => void locateUser()}
        style={({ pressed }) => [
          styles.mapLocateButton,
          pressed && styles.mapLocateButtonPressed,
        ]}
      >
        {locating ? (
          <ActivityIndicator size="small" color={colors.driverAccent} />
        ) : (
          <LocateFixed size={22} color={colors.driverAccent} />
        )}
      </Pressable>
      <MapBottomSheet
        title="Xác nhận điểm bắt đầu"
        copy="Di chuyển bản đồ để ghim nằm đúng nơi bạn có thể đón khách."
        summary={
          <AppText numberOfLines={1} weight="semibold" style={styles.sheetSummaryText}>
            {resolving ? "Đang xác định địa chỉ…" : shortPlaceName(place?.address)}
          </AppText>
        }
      >
        <View style={styles.sheetLocationRow}>
          <View style={styles.sheetLocationIcon}>
            <MapPin size={20} color={colors.navigationDriver} />
          </View>
          <View style={styles.flex}>
            <AppText variant="caption" style={styles.secondary}>Điểm đang xác nhận</AppText>
            <AppText weight="semibold" numberOfLines={2}>
              {resolving ? "Đang xác định địa chỉ…" : place?.name || "Thả bản đồ để chọn vị trí"}
            </AppText>
            {place?.address && <AppText variant="caption" numberOfLines={2} style={styles.secondary}>{place.address}</AppText>}
            <AppText variant="caption" style={styles.secondary}>
              {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}
            </AppText>
          </View>
        </View>
      </MapBottomSheet>
    </View>
  );
}

function RouteStep({
  origin,
  destination,
  routes,
  selectedIndex,
  selectedPolyline,
  loading,
  error,
  onSelect,
  onRetry,
}: {
  origin: MapCoordinates;
  destination: MapCoordinates;
  routes: GoongRoute[];
  selectedIndex: number;
  selectedPolyline?: string;
  loading: boolean;
  error?: string;
  onSelect: (route: GoongRoute, index: number) => void;
  onRetry: () => void;
}) {
  return (
    <View style={styles.mapStage}>
      <RoutePreviewMap
        origin={origin}
        destination={destination}
        encodedPolyline={selectedPolyline}
        routes={routes}
        routeIndex={selectedIndex}
        fill
      />
      <MapBottomSheet
        initialExpanded
        title="Lộ trình của bạn"
        copy="Chọn một phương án bên dưới. Tuyến đang chọn được hiển thị đậm trên bản đồ."
        summary={routes[selectedIndex] ? (
          <AppText numberOfLines={1} weight="semibold" style={styles.sheetSummaryText}>
            Tuyến {selectedIndex + 1} · {(routeMetrics(routes[selectedIndex]).distance / 1000).toFixed(1)} km
          </AppText>
        ) : undefined}
      >
        {loading && <StatusRow text="Đang tìm các tuyến phù hợp…" />}
        {error && <InlineError message={error} onRetry={onRetry} />}
        <ScrollView contentContainerStyle={styles.sheetRouteList} showsVerticalScrollIndicator={false}>
        {routes.map((route, index) => {
        const metrics = routeMetrics(route);
        const selected = selectedIndex === index;
        return (
          <Pressable
            key={`${route.overview_polyline.points.slice(0, 18)}-${index}`}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onSelect(route, index)}
            style={({ pressed }) => [
              styles.routeOption,
              selected && styles.routeOptionSelected,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.routeNumber,
                selected && styles.routeNumberSelected,
              ]}
            >
              <AppText
                weight="semibold"
                style={selected ? styles.routeNumberTextSelected : undefined}
              >
                {index + 1}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText weight="semibold">
                {index === 0 ? "Goong đề xuất" : `Phương án ${index + 1}`}
              </AppText>
              <AppText variant="bodySmall" style={styles.secondary}>
                {(metrics.distance / 1000).toFixed(1)} km · khoảng{" "}
                {Math.ceil(metrics.duration / 60)} phút
              </AppText>
            </View>
            {selected && <Check size={20} color={colors.primary} />}
          </Pressable>
        );
        })}
        </ScrollView>
      </MapBottomSheet>
    </View>
  );
}

function MapBottomSheet({ title, copy, summary, children, initialExpanded = false }: {
  title: string;
  copy: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
  initialExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -24) setExpanded(true);
      if (gesture.dy > 24) setExpanded(false);
    },
  }), []);
  return (
    <View style={[styles.mapSheet, expanded ? styles.mapSheetExpanded : styles.mapSheetCollapsed]}>
      <Pressable
        {...panResponder.panHandlers}
        accessibilityHint={expanded ? "Thu gọn để xem bản đồ lớn hơn" : "Mở rộng để xem thêm thông tin"}
        accessibilityLabel={expanded ? "Thu gọn bảng thông tin" : "Mở rộng bảng thông tin"}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.sheetHandleArea, pressed && styles.pressed]}
      >
        <View style={styles.sheetHandle} />
        <AppText style={styles.sheetTitle}>{title}</AppText>
        {!expanded && summary}
      </Pressable>
      {expanded && (
        <View style={styles.sheetBody}>
          <AppText variant="bodySmall" style={styles.sheetCopy}>{copy}</AppText>
          {children}
        </View>
      )}
    </View>
  );
}

function StopsStep({
  stops,
  setStops,
}: {
  stops: RideStopInput[];
  setStops: (stops: RideStopInput[]) => void;
}) {
  const addStop = () =>
    setStops([
      ...stops,
      { name: "", address: "", latitude: Number.NaN, longitude: Number.NaN },
    ]);
  const updateStop = (index: number, patch: Partial<RideStopInput>) =>
    setStops(
      stops.map((stop, current) =>
        current === index ? { ...stop, ...patch } : stop,
      ),
    );
  const moveStop = (from: number, to: number) => {
    if (to < 0 || to >= stops.length || from === to) return;
    const next = [...stops];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setStops(next);
  };
  return (
    <View>
      <StepHeading
        title="Thêm điểm đón dọc đường"
        copy="Không bắt buộc. Hành khách sẽ có thể chọn các điểm này khi đặt chỗ."
      />
      {stops.length === 0 && (
        <View style={styles.emptyStops}>
          <MapPinned size={28} color={colors.textTertiary} />
          <AppText weight="semibold">Chưa có điểm dừng</AppText>
          <AppText variant="bodySmall" style={styles.centerSecondary}>
            Bạn có thể tiếp tục với lộ trình ban đầu.
          </AppText>
        </View>
      )}
      {stops.map((stop, index) => (
        <StopEditor
          key={index}
          stop={stop}
          index={index}
          count={stops.length}
          onChange={(patch) => updateStop(index, patch)}
          onDelete={() =>
            setStops(stops.filter((_, current) => current !== index))
          }
          onMove={moveStop}
        />
      ))}
      {stops.length < 3 && (
        <AppButton
          title="Thêm điểm dừng"
          variant="ghost"
          onPress={addStop}
          leftIcon={<Plus size={18} color={colors.primary} />}
          style={styles.addStopButton}
        />
      )}
      <AppText variant="caption" style={styles.helper}>
        Tối đa 3 điểm. Kéo biểu tượng tay cầm hoặc dùng nút lên/xuống để sắp
        xếp.
      </AppText>
    </View>
  );
}

function StopEditor({
  stop,
  index,
  count,
  onChange,
  onDelete,
  onMove,
}: {
  stop: RideStopInput;
  index: number;
  count: number;
  onChange: (patch: Partial<RideStopInput>) => void;
  onDelete: () => void;
  onMove: (from: number, to: number) => void;
}) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderRelease: (_, gesture) => {
          const offset = Math.round(gesture.dy / 76);
          if (offset !== 0)
            onMove(index, Math.max(0, Math.min(count - 1, index + offset)));
        },
      }),
    [count, index, onMove],
  );
  return (
    <View style={styles.stopEditor}>
      <View style={styles.stopToolbar}>
        <View
          {...panResponder.panHandlers}
          accessibilityLabel={`Kéo để sắp xếp điểm dừng ${index + 1}`}
          style={styles.dragHandle}
        >
          <GripVertical size={20} color={colors.textSecondary} />
        </View>
        <AppText weight="semibold" style={styles.flex}>
          Điểm đón {index + 1}
        </AppText>
        <IconButton
          tone="ghost"
          icon={<ArrowUp size={18} color={colors.textSecondary} />}
          accessibilityLabel="Di chuyển lên"
          disabled={index === 0}
          onPress={() => onMove(index, index - 1)}
        />
        <IconButton
          tone="ghost"
          icon={<ArrowDown size={18} color={colors.textSecondary} />}
          accessibilityLabel="Di chuyển xuống"
          disabled={index === count - 1}
          onPress={() => onMove(index, index + 1)}
        />
        <IconButton
          tone="ghost"
          icon={<Trash2 size={18} color={colors.danger} />}
          accessibilityLabel="Xóa điểm dừng"
          onPress={onDelete}
        />
      </View>
      <LocationPicker
        tone="driver"
        label="Địa điểm"
        placeholder="Chọn điểm đón công khai"
        value={stop.address}
        selected={
          Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)
        }
        onChangeText={(address) =>
          onChange({
            address,
            name: shortPlaceName(address),
            latitude: Number.NaN,
            longitude: Number.NaN,
          })
        }
        onSelectCoords={(latitude, longitude, description) =>
          onChange({
            address: description,
            latitude,
            longitude,
            name: shortPlaceName(description),
          })
        }
      />
    </View>
  );
}

function DatesStep({
  selectedDates,
  setSelectedDates,
  month,
  setMonth,
}: {
  selectedDates: string[];
  setSelectedDates: (dates: string[]) => void;
  month: Date;
  setMonth: (month: Date) => void;
}) {
  const today = dateKey(new Date());
  const maximum = dateKey(addMonths(new Date(), 6));
  const days = getDaysInMonth(month);
  const blanks = startOfMonth(month).getDay();
  const cells = Array.from({ length: blanks + days }, (_, index) =>
    index < blanks ? null : index - blanks + 1,
  );
  const monthKey = format(month, "yyyy-MM");
  const maxMonth = maximum.slice(0, 7);
  const minMonth = today.slice(0, 7);
  const toggle = (key: string) => {
    if (selectedDates.includes(key))
      setSelectedDates(selectedDates.filter((item) => item !== key));
    else if (selectedDates.length < 30)
      setSelectedDates([...selectedDates, key].sort());
  };
  return (
    <View>
      <StepHeading
        title="Chọn ngày khởi hành"
        copy="Chọn tối đa 30 ngày trong 6 tháng tới. Tất cả ngày dùng chung một giờ khởi hành."
      />
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <IconButton
            tone="ghost"
            icon={<ChevronLeft size={21} color={colors.textPrimary} />}
            accessibilityLabel="Tháng trước"
            disabled={monthKey <= minMonth}
            onPress={() => setMonth(addMonths(month, -1))}
          />
          <AppText weight="semibold">
            {format(month, "MMMM yyyy", { locale: vi })}
          </AppText>
          <IconButton
            tone="ghost"
            icon={<ChevronRight size={21} color={colors.textPrimary} />}
            accessibilityLabel="Tháng sau"
            disabled={monthKey >= maxMonth}
            onPress={() => setMonth(addMonths(month, 1))}
          />
        </View>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((day) => (
            <AppText
              key={day}
              variant="caption"
              weight="semibold"
              style={styles.weekday}
            >
              {day}
            </AppText>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {cells.map((day, index) => {
            if (!day)
              return <View key={`blank-${index}`} style={styles.dayCell} />;
            const key = `${monthKey}-${String(day).padStart(2, "0")}`;
            const disabled = key < today || key > maximum;
            const selected = selectedDates.includes(key);
            return (
              <Pressable
                key={key}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled }}
                disabled={disabled}
                onPress={() => toggle(key)}
                style={({ pressed }) => [
                  styles.dayCell,
                  selected && styles.daySelected,
                  disabled && styles.dayDisabled,
                  pressed && !disabled && styles.pressed,
                ]}
              >
                <AppText
                  variant="bodySmall"
                  weight={selected ? "semibold" : "normal"}
                  style={selected ? styles.daySelectedText : undefined}
                >
                  {day}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.selectionCount}>
        <CalendarDays size={19} color={colors.primary} />
        <AppText weight="semibold">
          Đã chọn {selectedDates.length}/30 ngày
        </AppText>
      </View>
      {selectedDates.length === 30 && (
        <AppText variant="caption" style={styles.helper}>
          Bạn đã đạt số ngày tối đa.
        </AppText>
      )}
    </View>
  );
}

function TimeStep({
  clock,
  setClock,
  pickerOpen,
  setPickerOpen,
  valid,
}: {
  clock: string;
  setClock: (clock: string) => void;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  valid: boolean;
}) {
  const [hours, minutes] = clock.split(":").map(Number);
  const selected = new Date();
  selected.setHours(hours, minutes, 0, 0);
  const onChange = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === "android" || event.type === "dismissed")
      setPickerOpen(false);
    if (event.type !== "dismissed" && value) setClock(format(value, "HH:mm"));
  };
  return (
    <View>
      <StepHeading
        title="Chọn giờ khởi hành"
        copy="Giờ này áp dụng cho toàn bộ ngày bạn vừa chọn."
      />
      {Platform.OS === "web" ? (
        React.createElement("input", {
          type: "time",
          value: clock,
          "aria-label": "Giờ khởi hành",
          onChange: (event: { target: { value: string } }) =>
            setClock(event.target.value),
          style: webTimeStyle,
        })
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [
              styles.timeHero,
              pressed && styles.pressed,
            ]}
          >
            <Clock3 size={28} color={colors.driverAccent} />
            <View>
              <AppText variant="caption" style={styles.secondary}>
                Giờ khởi hành chung
              </AppText>
              <AppText variant="h1" weight="semibold" style={styles.timeValue}>
                {clock}
              </AppText>
            </View>
          </Pressable>
          {pickerOpen && (
            <View style={styles.nativePicker}>
              <DateTimePicker
                value={selected}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChange}
              />
              {Platform.OS === "ios" && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPickerOpen(false)}
                  style={styles.pickerDone}
                >
                  <AppText weight="semibold" style={styles.primaryText}>
                    Hoàn tất
                  </AppText>
                </Pressable>
              )}
            </View>
          )}
        </>
      )}
      {!valid && (
        <AppText accessibilityRole="alert" style={styles.errorText}>
          Nếu chọn hôm nay, giờ khởi hành phải ở tương lai.
        </AppText>
      )}
    </View>
  );
}

function VehicleRulesStep({
  form,
  setForm,
  vehicles,
  loading,
  error,
  retry,
  maxSeats,
  invalidateRoute,
}: {
  form: CreateRideInput;
  setForm: React.Dispatch<React.SetStateAction<CreateRideInput>>;
  vehicles: DriverVehicle[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  maxSeats: number;
  invalidateRoute: () => void;
}) {
  const set = <K extends keyof CreateRideInput>(
    key: K,
    value: CreateRideInput[K],
  ) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <View>
      <StepHeading
        title="Chỗ ngồi và quy định"
        copy="Chọn xe, số khách có thể chở và những điều hành khách cần biết."
      />
      {loading ? (
        <StatusRow text="Đang tải phương tiện…" />
      ) : error ? (
        <InlineError message="Không tải được phương tiện." onRetry={retry} />
      ) : (
        <View style={styles.optionStack}>
          {vehicles.map((vehicle) => {
            const selected = form.vehicleId === vehicle.id;
            const Icon = vehicle.type === "BIKE" ? Bike : Car;
            return (
              <Pressable
                key={vehicle.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  set("vehicleId", vehicle.id);
                  set(
                    "availableSeats",
                    Math.min(form.availableSeats, vehicleSeatLimit(vehicle)),
                  );
                  invalidateRoute();
                }}
                style={({ pressed }) => [
                  styles.choiceRow,
                  selected && styles.choiceRowSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.choiceIcon,
                    selected && styles.choiceIconSelected,
                  ]}
                >
                  <Icon
                    size={22}
                    color={selected ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={styles.flex}>
                  <AppText weight="semibold">{vehicle.licensePlate}</AppText>
                  <AppText variant="caption" style={styles.secondary}>
                    {vehicle.type === "BIKE"
                      ? "Xe máy · tối đa 1 khách"
                      : "Ô tô · tối đa 4 khách"}
                  </AppText>
                </View>
                {selected && <Check size={20} color={colors.primary} />}
              </Pressable>
            );
          })}
        </View>
      )}
      <SectionLabel>Số khách có thể chở</SectionLabel>
      <View style={styles.seatControl}>
        <View style={styles.seatCopy}>
          <Users size={20} color={colors.primary} />
          <AppText weight="semibold">Ghế mở bán</AppText>
        </View>
        <View style={styles.counter}>
          <CounterButton
            disabled={form.availableSeats <= 1}
            label="Giảm số ghế"
            onPress={() =>
              set("availableSeats", Math.max(1, form.availableSeats - 1))
            }
          >
            <Minus size={18} color={colors.textPrimary} />
          </CounterButton>
          <AppText variant="h3" weight="semibold" style={styles.counterValue}>
            {form.availableSeats}
          </AppText>
          <CounterButton
            disabled={form.availableSeats >= maxSeats}
            label="Tăng số ghế"
            onPress={() =>
              set("availableSeats", Math.min(maxSeats, form.availableSeats + 1))
            }
          >
            <Plus size={18} color={colors.textPrimary} />
          </CounterButton>
        </View>
      </View>
      <SectionLabel>Tùy chọn chuyến đi</SectionLabel>
      <View style={styles.rules}>
        <RuleToggle
          icon={<Route size={20} color={colors.primary} />}
          label="Đón khách dọc đường"
          value={form.allowRoutePickup !== false}
          onChange={(value) => set("allowRoutePickup", value)}
        />
        <RuleToggle
          icon={<Luggage size={20} color={colors.primary} />}
          label="Cho phép hành lý"
          value={form.allowLuggage !== false}
          onChange={(value) => set("allowLuggage", value)}
        />
        <RuleToggle
          icon={<PawPrint size={20} color={colors.primary} />}
          label="Cho phép thú cưng"
          value={form.allowPets === true}
          onChange={(value) => set("allowPets", value)}
        />
        <RuleToggle
          icon={<Cigarette size={20} color={colors.primary} />}
          label="Cho phép hút thuốc"
          value={form.allowSmoking === true}
          onChange={(value) => set("allowSmoking", value)}
          last
        />
      </View>
      <SectionLabel>Ghi chú</SectionLabel>
      <TextInput
        accessibilityLabel="Ghi chú cho hành khách"
        multiline
        maxLength={1000}
        placeholder="Ví dụ: Có mặt trước 10 phút, hành lý gọn nhẹ…"
        placeholderTextColor={colors.textTertiary}
        value={form.description || ""}
        onChangeText={(value) => set("description", value)}
        style={styles.noteInput}
        textAlignVertical="top"
      />
    </View>
  );
}

function BookingPolicyStep({
  value,
  onChange,
}: {
  value: "INSTANT" | "DRIVER_APPROVAL";
  onChange: (value: "INSTANT" | "DRIVER_APPROVAL") => void;
}) {
  const options = [
    {
      value: "INSTANT" as const,
      icon: Zap,
      title: "Đặt chỗ ngay",
      copy: "Hành khách được xác nhận ngay khi còn đủ ghế.",
    },
    {
      value: "DRIVER_APPROVAL" as const,
      icon: ShieldCheck,
      title: "Tài xế duyệt yêu cầu",
      copy: "Giữ ghế 15 phút để bạn chấp nhận hoặc từ chối.",
    },
  ];
  return (
    <View>
      <StepHeading
        title="Cách hành khách đặt chỗ"
        copy="Chính sách này áp dụng riêng cho từng chuyến trong lịch."
      />
      <View style={styles.policyStack}>
        {options.map((option) => {
          const selected = value === option.value;
          const Icon = option.icon;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.policyOption,
                selected && styles.policyOptionSelected,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.policyIcon,
                  selected && styles.policyIconSelected,
                ]}
              >
                <Icon
                  size={24}
                  color={selected ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.flex}>
                <AppText variant="h3" weight="semibold">
                  {option.title}
                </AppText>
                <AppText variant="bodySmall" style={styles.secondary}>
                  {option.copy}
                </AppText>
              </View>
              {selected && <Check size={22} color={colors.primary} />}
            </Pressable>
          );
        })}
      </View>
      <Notice
        message={
          value === "DRIVER_APPROVAL"
            ? "Yêu cầu hết hạn sẽ tự trả ghế cho chuyến, tránh giữ chỗ quá lâu."
            : "Ghế được trừ atomically để tránh hai hành khách đặt vượt số chỗ."
        }
      />
    </View>
  );
}

function PriceStep({
  value,
  onChange,
  query,
}: {
  value: number;
  onChange: (value: number) => void;
  query: ReturnType<typeof useQuery<any>>;
}) {
  const estimate = query.data as
    Awaited<ReturnType<typeof pricingService.estimateCarpool>> | undefined;
  return (
    <View>
      <StepHeading
        title="Thiết lập giá mỗi ghế"
        copy="CoRide tính mức chia chi phí phù hợp; bạn có thể điều chỉnh trong biên độ ±20%."
      />
      {query.isFetching && (
        <StatusRow text="Đang tính giá theo tuyến đã chọn…" />
      )}
      {query.isError && (
        <InlineError
          message="Không tính được giá lúc này."
          onRetry={() => query.refetch()}
        />
      )}
      {estimate && (
        <>
          <View style={styles.priceGuide}>
            <Sparkles size={22} color={colors.primary} />
            <View style={styles.flex}>
              <AppText variant="caption" style={styles.secondary}>
                CoRide đề xuất
              </AppText>
              <AppText variant="h2" weight="semibold" style={styles.priceValue}>
                {estimate.recommendedPricePerSeat.toLocaleString("vi-VN")}đ
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => onChange(estimate.recommendedPricePerSeat)}
              style={styles.useSuggested}
            >
              <AppText
                variant="bodySmall"
                weight="semibold"
                style={styles.primaryText}
              >
                Dùng mức này
              </AppText>
            </Pressable>
          </View>
          <SectionLabel>Giá bạn chọn</SectionLabel>
          <View style={styles.priceInputWrap}>
            <TextInput
              accessibilityLabel="Giá mỗi ghế"
              keyboardType="number-pad"
              value={value ? String(value) : ""}
              onChangeText={(text) =>
                onChange(Number(text.replace(/\D/g, "")) || 0)
              }
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              style={styles.priceInput}
            />
            <AppText weight="semibold">đ / ghế</AppText>
          </View>
          <View style={styles.rangeRow}>
            <AppText variant="caption" style={styles.secondary}>
              Tối thiểu {estimate.minimumPricePerSeat.toLocaleString("vi-VN")}đ
            </AppText>
            <AppText variant="caption" style={styles.secondary}>
              Tối đa {estimate.maximumPricePerSeat.toLocaleString("vi-VN")}đ
            </AppText>
          </View>
        </>
      )}
    </View>
  );
}

function ReviewStep({
  form,
  dates,
  clock,
  stops,
  vehicle,
  origin,
  destination,
  routes,
  selectedRouteIndex,
}: {
  form: CreateRideInput;
  dates: string[];
  clock: string;
  stops: RideStopInput[];
  vehicle?: DriverVehicle;
  origin: MapCoordinates;
  destination: MapCoordinates;
  routes: GoongRoute[];
  selectedRouteIndex: number;
}) {
  return (
    <View>
      <StepHeading
        title="Sẵn sàng đăng lịch"
        copy="Kiểm tra lần cuối. Mỗi ngày sẽ tạo một chuyến có ghế và booking độc lập."
      />
      <RoutePreviewMap
        origin={origin}
        destination={destination}
        encodedPolyline={form.routePolyline}
        routes={routes}
        routeIndex={selectedRouteIndex}
        stops={stops.map((stop, index) => ({ ...stop, id: String(index) }))}
      />
      <View style={styles.reviewSection}>
        <ReviewRow
          label="Hành trình"
          value={`${shortPlaceName(form.origin)} → ${shortPlaceName(form.destination)}`}
        />
        <ReviewRow
          label="Ngày khởi hành"
          value={`${dates.length} ngày · ${format(new Date(`${dates[0]}T00:00:00`), "dd/MM/yyyy")} – ${format(new Date(`${dates.at(-1)}T00:00:00`), "dd/MM/yyyy")}`}
        />
        <ReviewRow label="Giờ chung" value={clock} />
        <ReviewRow
          label="Điểm dừng"
          value={
            stops.length ? `${stops.length} điểm đón công khai` : "Không có"
          }
        />
        <ReviewRow
          label="Phương tiện"
          value={vehicle?.licensePlate || "Chưa chọn"}
        />
        <ReviewRow
          label="Ghế mỗi chuyến"
          value={`${form.availableSeats} ghế`}
        />
        <ReviewRow
          label="Đặt chỗ"
          value={
            form.bookingPolicy === "INSTANT"
              ? "Xác nhận ngay"
              : "Tài xế duyệt trong 15 phút"
          }
        />
        <ReviewRow
          label="Giá mỗi ghế"
          value={`${form.pricePerSeat.toLocaleString("vi-VN")}đ`}
          last
        />
      </View>
      <Notice
        message={`CoRide sẽ tạo ${dates.length} chuyến và mở chi tiết chuyến gần nhất sau khi hoàn tất.`}
      />
    </View>
  );
}

function StepHeading({ title, copy }: { title: string; copy: string }) {
  return (
    <View style={styles.stepHeading}>
      <AppText variant="h1" weight="semibold">
        {title}
      </AppText>
      <AppText style={styles.intro}>{copy}</AppText>
    </View>
  );
}
function Notice({ message }: { message: string }) {
  return (
    <View style={styles.notice}>
      <Info size={19} color={colors.primary} />
      <AppText variant="bodySmall" style={styles.noticeText}>
        {message}
      </AppText>
    </View>
  );
}
function StatusRow({ text }: { text: string }) {
  return (
    <View style={styles.statusRow}>
      <ActivityIndicator color={colors.primary} />
      <AppText variant="bodySmall" style={styles.secondary}>
        {text}
      </AppText>
    </View>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <AppText weight="semibold" style={styles.sectionLabel}>
      {children}
    </AppText>
  );
}
function CounterButton({
  children,
  disabled,
  label,
  onPress,
}: {
  children: React.ReactNode;
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.counterButton, disabled && styles.disabled]}
    >
      {children}
    </Pressable>
  );
}
function RuleToggle({
  icon,
  label,
  value,
  onChange,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [
        styles.ruleRow,
        last && styles.ruleRowLast,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.ruleIcon}>{icon}</View>
      <AppText style={styles.flex} weight="medium">
        {label}
      </AppText>
      <View style={[styles.switchTrack, value && styles.switchTrackOn]}>
        <View style={[styles.switchThumb, value && styles.switchThumbOn]}>
          {value && <Check size={13} color={colors.success} />}
        </View>
      </View>
    </Pressable>
  );
}
function ReviewRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.reviewRow, last && styles.reviewRowLast]}>
      <AppText variant="bodySmall" style={styles.secondary}>
        {label}
      </AppText>
      <AppText variant="bodySmall" weight="semibold" style={styles.reviewValue}>
        {value}
      </AppText>
    </View>
  );
}
function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View accessibilityRole="alert" style={styles.inlineError}>
      <AppText variant="bodySmall" style={styles.inlineErrorText}>
        {message}
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={styles.inlineRetry}
      >
        <RefreshCw size={16} color={colors.danger} />
        <AppText
          variant="bodySmall"
          weight="semibold"
          style={styles.dangerText}
        >
          Thử lại
        </AppText>
      </Pressable>
    </View>
  );
}

const webTimeStyle = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: radius.input,
  boxSizing: "border-box" as const,
  color: colors.textPrimary,
  fontSize: 28,
  fontWeight: 600,
  height: 72,
  padding: "0 16px",
  width: "100%",
};

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    flexDirection: "row",
    minHeight: 64,
    paddingHorizontal: spacing.sm,
  },
  headerCopy: { flex: 1, marginLeft: spacing.xs, minWidth: 0 },
  secondary: { color: colors.textSecondary },
  primaryText: { color: colors.primary },
  dangerText: { color: colors.danger },
  progressTrack: {
    backgroundColor: colors.surface,
    flexDirection: "row",
    gap: 3,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  progressSegment: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    flex: 1,
    height: 4,
  },
  progressSegmentActive: { backgroundColor: colors.driverAccent },
  content: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: layout.maxContentWidth,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    width: "100%",
  },
  mapFlowContent: {
    alignSelf: "center",
    flex: 1,
    maxWidth: layout.maxContentWidth,
    overflow: "hidden",
    width: "100%",
  },
  mapStage: { flex: 1, overflow: "hidden" },
  mapLocateButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 4,
    height: 46,
    justifyContent: "center",
    position: "absolute",
    right: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    top: spacing.md,
    width: 46,
    zIndex: 3,
  },
  mapLocateButtonPressed: {
    backgroundColor: colors.navigationDriverSoft,
    transform: [{ scale: 0.96 }],
  },
  mapSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    bottom: 0,
    elevation: 12,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  mapSheetCollapsed: { height: 112 },
  mapSheetExpanded: { height: "58%" },
  sheetHandleArea: { minHeight: 88, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  sheetHandle: { alignSelf: "center", backgroundColor: colors.borderStrong, borderRadius: radius.pill, height: 5, marginBottom: spacing.md, width: 42 },
  sheetTitle: { color: colors.textPrimary, fontSize: 23, fontWeight: "600", letterSpacing: -0.35, lineHeight: 29 },
  sheetSummaryText: { color: colors.textSecondary, marginTop: spacing.xxs },
  sheetBody: { flex: 1, paddingBottom: spacing.md, paddingHorizontal: spacing.lg },
  sheetCopy: { color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.sm },
  sheetLocationRow: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.input, flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, padding: spacing.md },
  sheetLocationIcon: { alignItems: "center", backgroundColor: colors.navigationDriverSoft, borderRadius: radius.pill, height: 44, justifyContent: "center", width: 44 },
  sheetRouteList: { paddingBottom: spacing.lg },
  stepHeading: { marginBottom: spacing.lg },
  intro: { color: colors.textSecondary, marginTop: spacing.xs },
  notice: {
    alignItems: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  noticeText: { color: colors.primaryPressed, flex: 1 },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: layout.minTouchTarget,
  },
  textAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: layout.minTouchTarget,
  },
  sharedMapAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 62,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sharedMapActionPressed: {
    backgroundColor: colors.navigationDriverSoft,
    borderColor: colors.driverAccent,
  },
  sharedMapActionIcon: {
    alignItems: "center",
    backgroundColor: colors.navigationDriverSoft,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  sharedMapActionCopy: { flex: 1 },
  sharedMapActionTitle: { color: colors.driverAccent },
  sharedMapActionHint: { color: colors.textSecondary, marginTop: 2 },
  routeOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    minHeight: 72,
    padding: spacing.md,
  },
  routeOptionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  routeNumber: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  routeNumberSelected: { backgroundColor: colors.primary },
  routeNumberTextSelected: { color: colors.surface },
  emptyStops: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
  },
  centerSecondary: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  stopEditor: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  stopToolbar: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: layout.minTouchTarget,
  },
  dragHandle: {
    alignItems: "center",
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: 36,
  },
  addStopButton: { marginTop: spacing.sm },
  helper: { color: colors.textSecondary, marginTop: spacing.sm },
  calendar: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.sm,
  },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekRow: { flexDirection: "row", marginTop: spacing.xs },
  weekday: {
    color: colors.textSecondary,
    textAlign: "center",
    width: "14.2857%",
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.xs },
  dayCell: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: "14.2857%",
  },
  daySelected: { backgroundColor: colors.primary },
  daySelectedText: { color: colors.surface },
  dayDisabled: { opacity: 0.25 },
  selectionCount: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  timeHero: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 96,
    padding: spacing.lg,
  },
  timeValue: {
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
    marginTop: spacing.xxs,
  },
  nativePicker: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    marginTop: spacing.md,
    overflow: "hidden",
    padding: spacing.sm,
  },
  pickerDone: {
    alignItems: "flex-end",
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
  },
  errorText: { color: colors.danger, marginTop: spacing.sm },
  optionStack: { gap: spacing.sm },
  choiceRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 68,
    padding: spacing.sm,
  },
  choiceRowSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  choiceIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  choiceIconSelected: { backgroundColor: colors.surface },
  sectionLabel: { marginBottom: spacing.sm, marginTop: spacing.xl },
  seatControl: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 64,
    paddingLeft: spacing.md,
  },
  seatCopy: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
  },
  counter: { alignItems: "center", flexDirection: "row" },
  counterButton: {
    alignItems: "center",
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: layout.minTouchTarget,
  },
  counterValue: { minWidth: 28, textAlign: "center" },
  disabled: { opacity: 0.28 },
  rules: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    overflow: "hidden",
  },
  ruleRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 62,
    paddingHorizontal: spacing.md,
  },
  ruleRowLast: { borderBottomWidth: 0 },
  ruleIcon: { alignItems: "center", justifyContent: "center", width: 28 },
  switchTrack: {
    backgroundColor: colors.borderStrong,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 54,
  },
  switchTrackOn: {
    alignItems: "flex-end",
    backgroundColor: colors.driverAccent,
  },
  switchThumb: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  switchThumbOn: { backgroundColor: colors.surface },
  noteInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 23,
    minHeight: 112,
    padding: spacing.md,
  },
  policyStack: { gap: spacing.md },
  policyOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 104,
    padding: spacing.md,
  },
  policyOptionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  policyIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  policyIconSelected: { backgroundColor: colors.surface },
  priceGuide: {
    alignItems: "center",
    backgroundColor: colors.driverAccentSoft,
    borderRadius: radius.card,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  priceValue: {
    color: colors.success,
    fontVariant: ["tabular-nums"],
    marginTop: spacing.xxs,
  },
  useSuggested: {
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.xs,
  },
  priceInputWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.input,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
  },
  priceInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    minHeight: 64,
  },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  reviewSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  reviewRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  reviewRowLast: { borderBottomWidth: 0 },
  reviewValue: { color: colors.textPrimary },
  inlineError: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  inlineErrorText: { color: colors.danger },
  inlineRetry: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: layout.minTouchTarget,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  backButton: { flex: 0.42, minHeight: layout.minTouchTarget },
  nextButton: { flex: 1, minHeight: layout.minTouchTarget },
  pressed: { opacity: 0.72 },
});
