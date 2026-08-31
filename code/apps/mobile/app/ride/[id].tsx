import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  MoreVertical,
  Navigation,
  Phone,
  Route,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  X,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { DraggableBottomSheet, type DraggableBottomSheetRef } from '../../src/components/ui/DraggableBottomSheet';
import { FloatingMyLocation } from '../../src/components/ui/FloatingMyLocation';
import { bookingService, type DriverBookingSummary } from '../../src/services/booking.service';
import { rideService } from '../../src/services/ride.service';
import { useAuth } from '../../src/hooks/useAuth';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';
import { getDirections } from '../../src/services/direction.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SNAP_COLLAPSED = 0;
const SNAP_MEDIUM = 1;
const SNAP_EXPANDED = 2;
const SNAP_POINTS = [0.42, 0.65, 1];

const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
const currency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
  const rideStatusMeta = (status: string) => {
  switch (status) {
    case 'SCHEDULED': return { label: 'Sắp khởi hành', color: colors.warning, bg: '#FFFBEB' };
    case 'FULL': return { label: 'Đã đủ khách', color: colors.navigationDriver, bg: colors.driverAccentSoft };
    case 'ONGOING': return { label: 'Đang diễn ra', color: colors.navigationDriver, bg: colors.driverAccentSoft };
    case 'COMPLETED': return { label: 'Hoàn thành', color: colors.textTertiary, bg: colors.surfaceMuted };
    case 'CANCELLED': return { label: 'Đã hủy', color: colors.danger, bg: colors.dangerSoft };
    default: return { label: status, color: colors.textSecondary, bg: colors.surfaceMuted };
  }
};

const bookingStatusMeta = (booking: DriverBookingSummary) => {
  if (booking.status === 'CANCELLED') return { label: 'Đã hủy', color: colors.danger };
  if (booking.status === 'REJECTED') return { label: 'Đã từ chối', color: colors.danger };
  if (booking.isDroppedOff) return { label: 'Đã trả khách', color: colors.textTertiary };
  if (booking.isPickedUp) return { label: 'Đã đón', color: colors.navigationDriver };
  if (booking.status === 'CONFIRMED') return { label: 'Chờ đón', color: colors.warning };
  return { label: 'Chờ duyệt', color: colors.textSecondary };
};

// ─── Driver View ───────────────────────────────────────────────────────────────

interface DriverRideViewProps {
  rideId: string;
}

function DriverRideView({ rideId }: DriverRideViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [menuVisible, setMenuVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [mapRouteCoords, setMapRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Ride data
  const { data: ride, isLoading: isRideLoading } = useQuery({
    queryKey: ['ride', rideId],
    queryFn: () => rideService.getRideById(rideId),
    enabled: !!rideId,
  });

  // Bookings của ride này (dùng cached driver bookings)
  const { data: bookingsData } = useQuery({
    queryKey: ['driver-bookings'],
    queryFn: bookingService.getDriverBookings,
  });

  const rideBookings = useMemo(
    () => (bookingsData?.bookings ?? []).filter((b) => b.ride.id === rideId),
    [bookingsData, rideId],
  );

  const confirmedBookings = useMemo(
    () => rideBookings.filter((b) => b.status === 'CONFIRMED'),
    [rideBookings],
  );

  const estimatedEarnings = useMemo(
    () => confirmedBookings.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0),
    [confirmedBookings],
  );

  // Mutation cập nhật trạng thái ride
  const statusMutation = useMutation({
    mutationFn: (status: 'ONGOING' | 'COMPLETED' | 'CANCELLED') =>
      rideService.updateRideStatus(rideId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ride', rideId] });
      void queryClient.invalidateQueries({ queryKey: ['my-driver-rides'] });
      void queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message ?? 'Không thể cập nhật trạng thái');
    },
  });

  // Fetch directions cho map compact khi ride data sẵn sàng
  const fetchMapRoute = useCallback(async () => {
    if (!ride?.departureCoords || !ride?.destinationCoords) return;
    try {
      const result = await getDirections(
        { latitude: ride.departureCoords.latitude, longitude: ride.departureCoords.longitude },
        { latitude: ride.destinationCoords.latitude, longitude: ride.destinationCoords.longitude },
      );
      if (result?.polylineCoords) setMapRouteCoords(result.polylineCoords);
    } catch {
      // Map route không bắt buộc — bỏ qua lỗi
    }
  }, [ride?.departureCoords, ride?.destinationCoords]);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
    void fetchMapRoute();
  }, [fetchMapRoute]);

  const handleStartRide = () => {
    Alert.alert(
      'Bắt đầu hành trình?',
      'Hành trình sẽ được chuyển sang trạng thái Đang diễn ra. Hành khách sẽ nhận được thông báo.',
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Bắt đầu ngay',
          onPress: () => statusMutation.mutate('ONGOING'),
        },
      ],
    );
  };

  const handleCancelRide = () => {
    if (!cancelReason.trim()) {
      Alert.alert('Vui lòng nhập lý do hủy chuyến');
      return;
    }
    setCancelDialogVisible(false);
    statusMutation.mutate('CANCELLED');
  };

  const handleGoToMap = () => {
    router.push('/ride/active-ride' as never);
  };

  if (isRideLoading || !ride) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navigationDriver} />
        <AppText variant="bodySmall" style={styles.loadingText}>Đang tải thông tin chuyến...</AppText>
      </View>
    );
  }

  const statusMeta = rideStatusMeta(ride.status ?? '');
  const originCoords = ride.departureCoords;
  const destCoords = ride.destinationCoords;
  const hasCoords = originCoords && destCoords;

  const allStops: Array<{ id: string; name?: string | null; address: string; order: number; isOrigin?: boolean; isDest?: boolean }> = [
    { id: '__origin__', name: 'Điểm xuất phát', address: ride.departure ?? ride.origin ?? '', order: -1, isOrigin: true },
    ...(ride.stops ?? []).map((s) => ({ ...s })),
    { id: '__dest__', name: 'Điểm đến', address: ride.destination ?? '', order: 9999, isDest: true },
  ];

  return (
    <View style={styles.driverContainer}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerIconBtn, pressed && styles.pressed]}
        >
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>

        <View style={styles.headerCenter}>
          <AppText weight="semibold" style={styles.headerTitle}>Chi tiết chuyến đi</AppText>
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
            <AppText variant="caption" weight="semibold" style={{ color: statusMeta.color }}>
              {statusMeta.label}
            </AppText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tùy chọn chuyến đi"
          onPress={() => setMenuVisible(true)}
          style={({ pressed }) => [styles.headerIconBtn, pressed && styles.pressed]}
        >
          <MoreVertical size={20} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Map compact */}
        {hasCoords ? (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFillObject}
              onMapReady={handleMapReady}
              initialRegion={{
                latitude: (originCoords.latitude + destCoords.latitude) / 2,
                longitude: (originCoords.longitude + destCoords.longitude) / 2,
                latitudeDelta: Math.abs(originCoords.latitude - destCoords.latitude) * 2 + 0.05,
                longitudeDelta: Math.abs(originCoords.longitude - destCoords.longitude) * 2 + 0.05,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={false}
              showsScale={false}
              toolbarEnabled={false}
            >
              {mapRouteCoords.length > 0 && (
                <Polyline
                  coordinates={mapRouteCoords}
                  strokeColor={colors.navigationDriver}
                  strokeWidth={4}
                />
              )}
              <Marker coordinate={originCoords} pinColor="#22C55E" title={ride.departure ?? 'Điểm đi'} />
              <Marker coordinate={destCoords} pinColor="#EF4444" title={ride.destination ?? 'Điểm đến'} />
            </MapView>

            {/* Tap overlay — mở bản đồ fullscreen khi ONGOING */}
            {(ride.status === 'ONGOING') && (
              <Pressable
                style={styles.mapOverlay}
                onPress={handleGoToMap}
                accessibilityRole="button"
                accessibilityLabel="Mở bản đồ điều hành"
              >
                <View style={styles.mapOverlayPill}>
                  <Navigation size={15} color={colors.surface} strokeWidth={2.2} />
                  <AppText variant="caption" weight="semibold" style={styles.mapOverlayText}>
                    Mở bản đồ điều hành
                  </AppText>
                  <ArrowRight size={14} color={colors.surface} strokeWidth={2.2} />
                </View>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Route size={28} color={colors.textTertiary} strokeWidth={1.5} />
            <AppText variant="caption" style={styles.mapPlaceholderText}>Không có dữ liệu định vị</AppText>
          </View>
        )}

        {/* ── Card thông tin chuyến ─────────────────────────────────────── */}
        <View style={styles.card}>
          {/* Route: origin → destination */}
          <View style={styles.routeRow}>
            <View style={styles.routeRail}>
              <View style={styles.originDot} />
              <View style={styles.routeLine} />
              <View style={styles.destDot} />
            </View>
            <View style={styles.routeLabels}>
              <View style={styles.routeStop}>
                <AppText variant="caption" style={styles.routeStopLabel}>Điểm xuất phát</AppText>
                <AppText weight="semibold" numberOfLines={1}>{ride.departure ?? ride.origin ?? '—'}</AppText>
              </View>
              <View style={styles.routeStop}>
                <AppText variant="caption" style={styles.routeStopLabel}>Điểm đến</AppText>
                <AppText weight="semibold" numberOfLines={1}>{ride.destination ?? '—'}</AppText>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

            {/* Thông số nhanh */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <CalendarClock size={17} color={colors.navigationDriver} strokeWidth={2} />
              <View>
                <AppText variant="caption" style={styles.statLabel}>Khởi hành</AppText>
                <AppText weight="semibold" style={styles.statValue}>
                  {format(new Date(ride.departureTime), 'HH:mm · EEE dd/MM', { locale: vi })}
                </AppText>
              </View>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Users size={17} color={colors.navigationDriver} strokeWidth={2} />
              <View>
                <AppText variant="caption" style={styles.statLabel}>Ghế mở bán</AppText>
                <AppText weight="semibold" style={styles.statValue}>
                  {ride.availableSeats} / {ride.totalSeats ?? ride.availableSeats}
                </AppText>
              </View>
            </View>
            <View style={styles.statItem}>
              <Wallet size={17} color={colors.navigationDriver} strokeWidth={2} />
              <View>
                <AppText variant="caption" style={styles.statLabel}>Giá/ghế</AppText>
                <AppText weight="semibold" style={styles.statValue}>
                  {currency(ride.price ?? 0)}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* ── Timeline waypoints ────────────────────────────────────────── */}
        {allStops.length > 2 && (
          <View style={styles.sectionHeader}>
            <AppText weight="semibold" style={styles.sectionTitle}>Lịch trình dọc đường</AppText>
          </View>
        )}
        {allStops.length > 2 && (
          <View style={styles.card}>
            {allStops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === allStops.length - 1;
              const isStop = !stop.isOrigin && !stop.isDest;
              return (
                <View key={stop.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isFirst && styles.timelineDotOrigin,
                      isLast && styles.timelineDotDest,
                      isStop && styles.timelineDotStop,
                    ]} />
                    {!isLast && <View style={styles.timelineConnector} />}
                  </View>
                  <View style={[styles.timelineBody, !isLast && styles.timelineBodyBorder]}>
                    <AppText variant="caption" style={styles.routeStopLabel}>
                      {isFirst ? 'Xuất phát' : isLast ? 'Điểm đến' : `Điểm dừng ${stop.order + 1}`}
                    </AppText>
                    <AppText weight="medium" numberOfLines={2} style={styles.timelineAddress}>
                      {stop.name && stop.name !== stop.address ? `${stop.name} — ` : ''}{stop.address}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Danh sách hành khách ──────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <AppText weight="semibold" style={styles.sectionTitle}>
            Hành khách
            {rideBookings.length > 0
              ? ` (${confirmedBookings.length} xác nhận / ${rideBookings.length})`
              : ''}
          </AppText>
        </View>

        {rideBookings.length === 0 ? (
          <View style={[styles.card, styles.emptyState]}>
            <Users size={32} color={colors.textTertiary} strokeWidth={1.5} />
            <AppText variant="bodySmall" style={styles.emptyText}>
              Chưa có hành khách đặt chỗ
            </AppText>
          </View>
        ) : (
          <View style={styles.card}>
            {rideBookings.map((booking, index) => {
              const name = [booking.passenger.firstName, booking.passenger.lastName]
                .filter(Boolean).join(' ') || 'Hành khách CoRide';
              const statusInfo = bookingStatusMeta(booking);
              const isLast = index === rideBookings.length - 1;
              return (
                <View
                  key={booking.id}
                  style={[styles.bookingRow, !isLast && styles.bookingRowBorder]}
                >
                  {/* Avatar */}
                  <View style={[
                    styles.passengerAvatar,
                    booking.isPickedUp && styles.passengerAvatarPickedUp,
                  ]}>
                    <AppText weight="semibold" style={[
                      styles.passengerInitial,
                      booking.isPickedUp && styles.passengerInitialPickedUp,
                    ]}>
                      {name.charAt(0).toUpperCase()}
                    </AppText>
                  </View>

                  {/* Info */}
                  <View style={styles.bookingInfo}>
                    <View style={styles.bookingNameRow}>
                      <AppText weight="semibold" numberOfLines={1} style={styles.bookingName}>
                        {name}
                      </AppText>
                      <View style={[styles.bookingStatusBadge, { backgroundColor: `${statusInfo.color}18` }]}>
                        <AppText variant="caption" weight="semibold" style={{ color: statusInfo.color }}>
                          {statusInfo.label}
                        </AppText>
                      </View>
                    </View>
                    <AppText variant="caption" style={styles.bookingMeta}>
                      {booking.seats} ghế · {currency(booking.totalPrice ?? 0)}
                    </AppText>
                    {booking.pickupAddress ? (
                      <View style={styles.bookingAddressRow}>
                        <MapPin size={12} color={colors.mapPickup} strokeWidth={2} />
                        <AppText variant="caption" numberOfLines={1} style={styles.bookingAddress}>
                          Đón: {booking.pickupAddress}
                        </AppText>
                      </View>
                    ) : null}
                    {booking.dropoffAddress ? (
                      <View style={styles.bookingAddressRow}>
                        <MapPin size={12} color={colors.mapDestination} strokeWidth={2} />
                        <AppText variant="caption" numberOfLines={1} style={styles.bookingAddress}>
                          Trả: {booking.dropoffAddress}
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  {/* Gọi điện */}
                  {booking.passenger.phone ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Gọi điện cho ${name}`}
                      onPress={() => Linking.openURL(`tel:${booking.passenger.phone}`)}
                      style={({ pressed }) => [styles.callBtn, pressed && styles.pressed]}
                    >
                      <Phone size={17} color={colors.navigationDriver} strokeWidth={2.2} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* ── Card thu nhập ─────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <AppText weight="semibold" style={styles.sectionTitle}>Thu nhập dự kiến</AppText>
        </View>
        <View style={[styles.card, styles.earningsCard]}>
          <View>
            <AppText variant="caption" style={styles.earningsLabel}>Tổng thu từ khách đã xác nhận</AppText>
            <AppText style={styles.earningsAmount}>{currency(estimatedEarnings)}</AppText>
          </View>
          <View style={styles.earningsMeta}>
            <CheckCircle2 size={16} color={colors.navigationDriver} strokeWidth={2} />
            <AppText variant="caption" style={styles.earningsMetaText}>
              {confirmedBookings.length} hành khách xác nhận
            </AppText>
          </View>
        </View>

      </ScrollView>

      {/* ── CTA Bar ─────────────────────────────────────────────────────── */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
        {ride.status === 'SCHEDULED' || ride.status === 'FULL' ? (
          <AppButton
            title="Bắt đầu hành trình"
            variant="driver"
            isLoading={statusMutation.isPending}
            onPress={handleStartRide}
            style={styles.ctaButton}
          />
        ) : ride.status === 'ONGOING' ? (
          <AppButton
            title="Mở bản đồ điều hành"
            variant="driver"
            onPress={handleGoToMap}
            style={styles.ctaButton}
          />
        ) : ride.status === 'COMPLETED' ? (
          <View style={styles.ctaCompleted}>
            <CheckCircle2 size={20} color={colors.success} strokeWidth={2.2} />
            <AppText weight="semibold" style={styles.ctaCompletedText}>Chuyến đã hoàn thành</AppText>
          </View>
        ) : ride.status === 'CANCELLED' ? (
          <View style={styles.ctaCancelled}>
            <AppText weight="semibold" style={styles.ctaCancelledText}>Chuyến đã hủy</AppText>
          </View>
        ) : null}
      </View>

      {/* ── Menu ⋯ ──────────────────────────────────────────────────────── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuSheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.menuHandle} />
            <AppText weight="semibold" style={styles.menuTitle}>Tùy chọn</AppText>

            {/* Chỉnh sửa — chỉ khi SCHEDULED */}
            {(ride.status === 'SCHEDULED') && (
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
                onPress={() => {
                  setMenuVisible(false);
                  // TODO: điều hướng đến màn hình chỉnh sửa chuyến
                  Alert.alert('Sắp có', 'Tính năng chỉnh sửa chuyến sẽ được thêm sớm.');
                }}
              >
                <Route size={19} color={colors.textPrimary} strokeWidth={2} />
                <AppText style={styles.menuItemText}>Chỉnh sửa chuyến</AppText>
                <ChevronRight size={17} color={colors.textTertiary} />
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('Sắp có', 'Tính năng báo cáo sự cố sẽ được thêm sớm.');
              }}
            >
              <BadgeCheck size={19} color={colors.textPrimary} strokeWidth={2} />
              <AppText style={styles.menuItemText}>Báo cáo sự cố</AppText>
              <ChevronRight size={17} color={colors.textTertiary} />
            </Pressable>

            {/* Hủy chuyến — chỉ khi SCHEDULED */}
            {(ride.status === 'SCHEDULED' || ride.status === 'FULL') && (
              <>
                <View style={styles.menuDivider} />
                <Pressable
                  style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
                  onPress={() => {
                    setMenuVisible(false);
                    setCancelDialogVisible(true);
                  }}
                >
                  <X size={19} color={colors.danger} strokeWidth={2} />
                  <AppText style={[styles.menuItemText, styles.menuItemDanger]}>Hủy chuyến</AppText>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* ── Dialog xác nhận hủy ─────────────────────────────────────────── */}
      <Modal
        visible={cancelDialogVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setCancelDialogVisible(false)}
      >
        <View style={styles.menuBackdrop}>
          <View style={[styles.cancelDialog, { paddingBottom: insets.bottom + 16 }]}>
            <AppText weight="semibold" style={styles.cancelDialogTitle}>Hủy chuyến này?</AppText>
            <AppText variant="bodySmall" style={styles.cancelDialogBody}>
              {confirmedBookings.length > 0
                ? `${confirmedBookings.length} hành khách đã đặt chỗ sẽ nhận thông báo hủy. Hệ thống sẽ tự động hoàn ghế cho họ.`
                : 'Hành trình sẽ bị xóa khỏi danh sách tìm kiếm của hành khách.'}
            </AppText>
            <AppText variant="caption" weight="semibold" style={styles.cancelReasonLabel}>
              Lý do hủy (bắt buộc)
            </AppText>
            {/* Lý do đặt sẵn */}
            {['Kế hoạch thay đổi', 'Phương tiện gặp sự cố', 'Lý do cá nhân'].map((reason) => (
              <Pressable
                key={reason}
                style={({ pressed }) => [
                  styles.cancelReasonOption,
                  cancelReason === reason && styles.cancelReasonSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => setCancelReason(reason)}
              >
                <View style={[
                  styles.cancelReasonRadio,
                  cancelReason === reason && styles.cancelReasonRadioSelected,
                ]}>
                  {cancelReason === reason && <View style={styles.cancelReasonRadioDot} />}
                </View>
                <AppText variant="bodySmall" style={cancelReason === reason ? styles.cancelReasonTextSelected : undefined}>
                  {reason}
                </AppText>
              </Pressable>
            ))}
            <View style={styles.cancelActions}>
              <AppButton
                title="Giữ chuyến"
                variant="outline"
                onPress={() => { setCancelDialogVisible(false); setCancelReason(''); }}
                style={styles.cancelActionBtn}
              />
              <AppButton
                title="Hủy chuyến"
                variant="ghost"
                isLoading={statusMutation.isPending}
                onPress={handleCancelRide}
                style={[styles.cancelActionBtn, styles.cancelActionDanger]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Passenger View (giữ nguyên logic cũ) ─────────────────────────────────────

function PassengerRideView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [seats, setSeats] = useState(1);
  const [pickupStopId, setPickupStopId] = useState<string | undefined>();
  const [snapIndex, setSnapIndex] = useState(SNAP_COLLAPSED);
  const [mapRoute, setMapRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  
  const sheetRef = useRef<DraggableBottomSheetRef>(null);
  const mapRef = useRef<MapView>(null);
  
  const [topContentHeight, setTopContentHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const { bottom: safeBottom } = useSafeAreaInsets();
  
  const computedSnapPoints = useMemo(() => {
    const s0 = (topContentHeight > 0 && footerHeight > 0) 
      ? topContentHeight + footerHeight + safeBottom + 32 // Add 32 for some breathing room
      : 0.45; // Default fallback
    return [s0, 0.65, 1];
  }, [topContentHeight, footerHeight, safeBottom]);

  const { height: screenHeight } = useWindowDimensions();
  const animatedPosition = useSharedValue(screenHeight);

  // Lazy import
  const { MatchExplanation } = require('../../src/components/MatchExplanation');

  const { data: ride, isLoading } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => rideService.getRideById(id as string),
    enabled: !!id,
  });

  const fetchRoute = useCallback(async () => {
    if (!ride?.departureCoords || !ride?.destinationCoords) return;
    try {
      const result = await getDirections(
        { latitude: ride.departureCoords.latitude, longitude: ride.departureCoords.longitude },
        { latitude: ride.destinationCoords.latitude, longitude: ride.destinationCoords.longitude },
      );
      if (result?.polylineCoords) {
        setMapRoute(result.polylineCoords);
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(result.polylineCoords, {
            edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
            animated: true
          });
        }, 500);
      }
    } catch {
      // ignore
    }
  }, [ride?.departureCoords, ride?.destinationCoords]);

  React.useEffect(() => {
    void fetchRoute();
  }, [fetchRoute]);

  const bookingMutation = useMutation({
    mutationFn: () => bookingService.createBooking(id as string, seats, pickupStopId),
    onSuccess: (result) => {
      const confirmed = result.booking?.status === 'CONFIRMED';
      Alert.alert(
        confirmed ? 'Đã đặt chỗ' : 'Đã gửi yêu cầu',
        confirmed
          ? 'Chỗ của bạn đã được xác nhận ngay.'
          : 'Ghế được giữ trong 15 phút để tài xế phản hồi.',
        [{ text: 'OK', onPress: () => router.replace('/(passenger-tabs)/my-rides' as any) }],
      );
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thực hiện đặt chỗ');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navigationPassenger} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.centeredPad}>
        <AppText variant="body">Không tìm thấy thông tin chuyến đi</AppText>
        <AppButton title="Quay lại" variant="outline" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const isOngoing = ride.status === 'ONGOING';
  const departureDateFormatted = format(new Date(ride.departureTime), "HH:mm • EEEE, dd/MM", { locale: vi });
  const pricePerSeat = (ride as any).pricePerSeat;
  const totalPrice = pricePerSeat * seats;
  const canBook = ride.status === 'SCHEDULED' && ride.availableSeats >= seats;
  const ctaLabel = canBook ? ((ride as any).autoApprove ? 'Đặt ngay' : 'Gửi yêu cầu') : 'Không thể đặt';

  const mapRegion = ride.departureCoords && ride.destinationCoords
    ? {
        latitude: (ride.departureCoords.latitude + ride.destinationCoords.latitude) / 2,
        longitude: (ride.departureCoords.longitude + ride.destinationCoords.longitude) / 2,
        latitudeDelta: Math.abs(ride.departureCoords.latitude - ride.destinationCoords.latitude) * 2 + 0.05,
        longitudeDelta: Math.abs(ride.departureCoords.longitude - ride.destinationCoords.longitude) * 2 + 0.05,
      }
    : { latitude: 21.0285, longitude: 105.8542, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  const sheetFooter = (
    <View style={styles.ctaContainer} onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
      <View style={styles.ctaPriceRow}>
        <AppText variant="caption" style={styles.ctaTotalLabel}>Tổng cộng</AppText>
        <AppText weight="bold" style={styles.ctaTotal}>{formatVnd(totalPrice)}</AppText>
      </View>
      <AppButton
        title={ctaLabel}
        variant="passenger"
        onPress={() => bookingMutation.mutate()}
        isLoading={bookingMutation.isPending}
        disabled={bookingMutation.isPending || !canBook}
        style={styles.ctaBtn}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={StyleSheet.absoluteFill}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={mapRegion}
          mapPadding={{ bottom: screenHeight * SNAP_POINTS[0] + 40, top: insets.top + 60, left: 24, right: 24 }}
          toolbarEnabled={false}
          showsUserLocation={true}
          showsMyLocationButton={false}
          accessibilityLabel="Bản đồ hành trình"
          onMapReady={() => {
            if (ride?.departureCoords && ride?.destinationCoords) {
              mapRef.current?.fitToCoordinates([ride.departureCoords, ride.destinationCoords], {
                edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                animated: true
              });
            }
          }}
        >
          {mapRoute.length > 1 && (
            <Polyline
              coordinates={mapRoute}
              strokeColor={colors.navigationPassenger || '#0071E3'}
              strokeWidth={4}
            />
          )}
          {ride.departureCoords && ride.destinationCoords && (
            <>
              <Marker coordinate={ride.departureCoords} title="Điểm đi" pinColor="#0F766E" />
              <Marker coordinate={ride.destinationCoords} title="Điểm đến" pinColor="#DC2626" />
            </>
          )}
        </MapView>
      </View>
      <FloatingMyLocation 
        animatedPosition={animatedPosition} 
        onRecenter={(loc) => {
          mapRef.current?.animateCamera({ center: loc });
        }} 
      />

      <View style={[styles.floatHeader, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.floatBtn, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.textPrimary} size={24} />
        </Pressable>
      </View>

      <DraggableBottomSheet
        ref={sheetRef}
        snapPoints={computedSnapPoints}
        initialSnapIndex={SNAP_COLLAPSED}
        onSnapChange={(idx) => setSnapIndex(idx)}
        footer={sheetFooter}
        animatedPosition={animatedPosition}
      >
        <View onLayout={(e) => setTopContentHeight(e.nativeEvent.layout.height)}>
            <View style={styles.sheetPadding}>
          
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Navigation size={18} color={colors.navigationPassenger || '#0071E3'} />
              <AppText weight="bold" style={styles.statusText}>
                {rideStatusMeta(ride.status).label || 'Thông tin chuyến đi'}
              </AppText>
            </View>
            <AppText variant="caption" style={styles.statusRight}>
              {departureDateFormatted}
            </AppText>
          </View>

          <View style={styles.summaryCard}>
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#0F766E', marginRight: 12 }} />
                <AppText style={{ flex: 1, fontSize: 14, color: '#111827' }} numberOfLines={1}>{ride.departure}</AppText>
              </View>
              <View style={{ width: 2, height: 16, backgroundColor: '#E5E7EB', marginLeft: 5, marginVertical: 2 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#DC2626', marginRight: 12 }} />
                <AppText style={{ flex: 1, fontSize: 14, color: '#111827' }} numberOfLines={1}>{ride.destination}</AppText>
              </View>
            </View>
            
            <View style={styles.summaryCardDivider} />
            
            <View style={styles.cardTagsRow}>
              <View style={styles.cardTag}>
                <View style={styles.cardTagIcon}>
                  <Users size={16} color={colors.navigationPassenger || '#0071E3'} strokeWidth={2} />
                </View>
                <AppText variant="caption" weight="medium" style={styles.cardTagText}>
                  {ride.availableSeats} khách
                </AppText>
              </View>
              
              {ride.originDistanceKm ? (
                <View style={styles.cardTag}>
                  <View style={styles.cardTagIcon}>
                    <MapPin size={16} color={colors.navigationPassenger || '#0071E3'} strokeWidth={2} />
                  </View>
                  <AppText variant="caption" weight="medium" style={styles.cardTagText}>
                    {ride.originDistanceKm} km
                  </AppText>
                </View>
              ) : null}

              <View style={styles.cardTag}>
                <View style={styles.cardTagIcon}>
                  <Wallet size={16} color={colors.navigationPassenger || '#0071E3'} strokeWidth={2} />
                </View>
                <AppText variant="caption" weight="medium" style={styles.cardTagText}>
                  {formatVnd(pricePerSeat)}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />
          </View>

          {snapIndex > SNAP_COLLAPSED && (
          <View style={styles.sheetPadding}>
            <AppText variant="caption" weight="semibold" style={styles.sectionLabel}>THÔNG TIN TÀI XẾ</AppText>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <Image source={{ uri: ((ride.driver as any)?.avatarUrl || ride.driver?.avatar) || 'https://via.placeholder.com/150' }} style={styles.driverAvatarImg} />
              </View>
              <View style={styles.driverInfo}>
                <AppText weight="semibold" style={styles.driverName}>{((ride.driver as any)?.fullName || (ride.driver?.firstName + ' ' + ride.driver?.lastName)) || 'Tài xế'}</AppText>
                <View style={styles.driverMeta}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <AppText variant="caption" style={styles.ratingText}>{ride.driver?.rating?.toFixed(1) || '5.0'}</AppText>
                  <AppText variant="caption" style={{ color: '#9CA3AF' }}>•</AppText>
                  <ShieldCheck size={14} color="#16A34A" />
                  <AppText variant="caption" style={styles.verifiedText}>Đã xác minh</AppText>
                </View>
              </View>
              <Pressable style={styles.chatBtn} onPress={() => router.push(`/chat/${ride.id}` as any)}>
                <MessageCircle size={20} color={colors.navigationPassenger || '#0071E3'} />
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.divider} />

          {snapIndex > SNAP_COLLAPSED && (
            <View style={styles.sheetPadding}>
              <AppText variant="caption" weight="semibold" style={styles.sectionLabel}>THÔNG TIN ĐẶT CHỖ</AppText>
            
            <View style={styles.seatRow}>
              <View style={styles.seatLabelCol}>
                <AppText weight="medium" style={styles.seatLabelText}>Số ghế cần đặt</AppText>
                <AppText variant="caption" style={styles.seatHint}>Tối đa {ride.availableSeats} ghế</AppText>
              </View>
              <View style={styles.seatPicker}>
                <Pressable
                  onPress={() => setSeats(Math.max(1, seats - 1))}
                  style={styles.seatBtn}
                  disabled={seats <= 1}
                >
                  <AppText style={[styles.seatBtnText, seats <= 1 && styles.seatBtnDisabled]}>-</AppText>
                </Pressable>
                <AppText weight="bold" style={styles.seatCount}>{seats}</AppText>
                <Pressable
                  onPress={() => setSeats(Math.min(ride.availableSeats, seats + 1))}
                  style={styles.seatBtn}
                  disabled={seats >= ride.availableSeats}
                >
                  <AppText style={[styles.seatBtnText, seats >= ride.availableSeats && styles.seatBtnDisabled]}>+</AppText>
                </Pressable>
              </View>
            </View>
            
            {ride.stops && ride.stops.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <AppText variant="caption" style={styles.stopHint}>Chọn điểm đón trên tuyến (Tùy chọn):</AppText>
                <View style={styles.stopsCard}>
                  <PickupChoice
                    title="Điểm xuất phát của tài xế"
                    address={(ride.departure ?? '') as string}
                    selected={pickupStopId === undefined}
                    onPress={() => setPickupStopId(undefined)}
                  />
                  {ride.stops.map(stop => (
                    <PickupChoice
                      key={stop.id}
                      title={stop.name || 'Điểm dừng'}
                      address={(stop.address ?? '') as string}
                      selected={pickupStopId === stop.id}
                      onPress={() => setPickupStopId(stop.id)}
                    />
                  ))}
                </View>
              </View>
            )}
            
            {(ride as any).notes && (
              <View style={{ marginTop: 16 }}>
                <AppText variant="caption" weight="semibold" style={styles.sectionLabel}>GHI CHÚ CỦA TÀI XẾ</AppText>
                <AppText variant="bodySmall" style={{ color: '#4B5563' }}>{(ride as any).notes}</AppText>
              </View>
            )}
          </View>
        )}

      </DraggableBottomSheet>
    </View>
  );
}

function PickupChoice({ title, address, selected, onPress }: {
  title: string; address: string; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}, ${address}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pickupChoice,
        selected && styles.pickupChoiceSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.pickupChoiceIcon, selected && styles.pickupChoiceIconSelected]}>
        {selected ? <CircleDot size={20} color="#FFFFFF" /> : <MapPin size={20} color="#64748B" />}
      </View>
      <View style={styles.flex1}>
        <AppText variant="bodySmall" weight="semibold" numberOfLines={1}
          style={selected ? styles.pickupChoiceTitleSelected : styles.textPrimary}>
          {title}
        </AppText>
        <AppText variant="caption" numberOfLines={2}
          style={selected ? styles.pickupChoiceAddrSelected : styles.passengerInfoLabel}>
          {address}
        </AppText>
      </View>
    </Pressable>
  );
}

// ─── Root Screen (phân nhánh Driver / Passenger) ───────────────────────────────

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const { data: ride, isLoading } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => rideService.getRideById(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navigationDriver} />
      </View>
    );
  }

  // Role check: so sánh driverId của ride với user hiện tại
  // ride.driverId đến trực tiếp từ backend response (normalizeRide giữ lại field này)
  const isDriver = !!user?.id && !!(ride as any)?.driverId && (ride as any).driverId === user.id;

  if (isDriver) {
    return <Redirect href={`/driver/trips/${id}`} />;
  }

  return <PassengerRideView />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E7EB' },
  sheetPadding: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border || '#E5E7EB', marginVertical: spacing.xs },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusText: { color: colors.navigationPassenger || '#0071E3', fontSize: 16 },
  statusRight: { color: colors.textTertiary },
  summaryCard: { backgroundColor: colors.surface || '#FFFFFF', borderRadius: radius.card || 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border || '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryCardDivider: { height: 1, backgroundColor: colors.border || '#F3F4F6', marginVertical: spacing.sm },
  cardTagsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  cardTag: { alignItems: 'center', flex: 1 },
  cardTagIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  cardTagText: { color: colors.textSecondary || '#6B7280', fontSize: 11 },
  sectionLabel: { color: colors.textTertiary || '#9CA3AF', fontSize: 11, letterSpacing: 0.5, marginBottom: spacing.sm },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EAF4FF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  driverAvatarImg: { width: '100%', height: '100%' },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, color: colors.textPrimary || '#111827' },
  driverMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ratingText: { color: '#F59E0B' },
  verifiedText: { color: colors.success || '#16A34A', fontSize: 12 },
  chatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EAF4FF', alignItems: 'center', justifyContent: 'center' },
  seatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  seatLabelCol: { flex: 1 },
  seatLabelText: { fontSize: 14, color: colors.textPrimary || '#111827' },
  seatHint: { color: colors.textTertiary || '#9CA3AF', marginTop: 2 },
  seatPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted || '#F8FAFC', borderRadius: radius.input || 8, overflow: 'hidden' },
  seatBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  seatBtnText: { fontSize: 20, color: colors.textPrimary || '#111827' },
  seatBtnDisabled: { color: colors.textTertiary || '#9CA3AF' },
  seatCount: { minWidth: 36, textAlign: 'center', fontSize: 16, color: colors.textPrimary || '#111827' },
  stopHint: { color: colors.textTertiary || '#9CA3AF', marginBottom: spacing.sm },
  stopsCard: { backgroundColor: colors.surface || '#FFFFFF', borderRadius: radius.card || 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border || '#E5E7EB', overflow: 'hidden' },
  ctaContainer: { gap: spacing.xs },
  ctaPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs, marginBottom: spacing.xxs },
  ctaTotalLabel: { color: colors.textSecondary || '#6B7280' },
  ctaTotal: { fontSize: 18, color: '#10B981' },
  ctaBtn: { width: '100%' },
  floatHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  floatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },

  // ── Common
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  centeredPad: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: spacing.sm },
  pressed: { opacity: 0.7 },
  flex1: { flex: 1 },
  w100: { width: '100%' },
  mt4: { marginTop: spacing.md },

  // ── Driver View
  driverContainer: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm, backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  headerIconBtn: {
    width: 44, height: 44, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 17, color: colors.textPrimary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.xs },

  // Map compact
  mapContainer: { height: 196, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  mapOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: spacing.sm },
  mapOverlayPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.navigationDriver, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  mapOverlayText: { color: colors.surface },
  mapPlaceholder: { height: 100, borderRadius: radius.card, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  mapPlaceholderText: { color: colors.textTertiary },

  // Card
  card: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    padding: spacing.md, marginBottom: spacing.xs,
  },

  // Route row inside card
  routeRow: { flexDirection: 'row', gap: spacing.sm },
  routeRail: { alignItems: 'center', width: 14, paddingTop: 3 },
  originDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.mapPickup },
  routeLine: { width: 1.5, flex: 1, backgroundColor: colors.border, marginVertical: 3 },
  destDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.mapDestination },
  routeLabels: { flex: 1, gap: spacing.md },
  routeStop: { gap: 2 },
  routeStopLabel: { color: colors.textTertiary, fontSize: 11 },

  // Stats row
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  statBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border, paddingLeft: spacing.sm },
  statLabel: { color: colors.textTertiary, fontSize: 11 },
  statValue: { color: colors.textPrimary, fontSize: 13, lineHeight: 18 },

  // Section header
  sectionHeader: { paddingTop: spacing.sm, paddingHorizontal: 2 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, lineHeight: 22 },

  // Timeline
  timelineItem: { flexDirection: 'row', minHeight: 52 },
  timelineLeft: { width: 28, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.borderStrong, marginTop: 4 },
  timelineDotOrigin: { backgroundColor: colors.mapPickup },
  timelineDotDest: { backgroundColor: colors.mapDestination },
  timelineDotStop: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: colors.navigationDriver, backgroundColor: colors.surface },
  timelineConnector: { width: 1.5, flex: 1, backgroundColor: colors.border, marginVertical: 3 },
  timelineBody: { flex: 1, paddingBottom: spacing.md, paddingTop: 2 },
  timelineBodyBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  timelineAddress: { color: colors.textPrimary, fontSize: 14, lineHeight: 20, marginTop: 2 },

  // Bookings
  emptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyText: { color: colors.textTertiary },
  bookingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
  bookingRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  passengerAvatar: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.navigationDriverSoft,
  },
  passengerAvatarPickedUp: { backgroundColor: colors.successSoft },
  passengerInitial: { color: colors.navigationDriver, fontSize: 16, fontWeight: '600' },
  passengerInitialPickedUp: { color: colors.success },
  bookingInfo: { flex: 1, gap: 2 },
  bookingNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  bookingName: { color: colors.textPrimary, fontSize: 14, flexShrink: 1 },
  bookingStatusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill },
  bookingMeta: { color: colors.textSecondary },
  bookingAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  bookingAddress: { color: colors.textTertiary, flex: 1 },
  callBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.driverAccentSoft },

  // Earnings
  earningsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  earningsLabel: { color: colors.textTertiary },
  earningsAmount: { fontSize: 22, fontWeight: '700', color: colors.navigationDriver, lineHeight: 28, marginTop: 2 },
  earningsMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  earningsMetaText: { color: colors.navigationDriver },

  // CTA bar
  ctaBar: {
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  ctaButton: { width: '100%' },
  ctaCompleted: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, minHeight: 52 },
  ctaCompletedText: { color: colors.success, fontSize: 16 },
  ctaCancelled: { alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  ctaCancelledText: { color: colors.textTertiary, fontSize: 16 },

  // Menu
  menuBackdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet,
    padding: spacing.md, paddingTop: spacing.sm,
  },
  menuHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.md },
  menuTitle: { color: colors.textPrimary, fontSize: 17, marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.xs, paddingVertical: spacing.sm,
    borderRadius: radius.input, minHeight: 52,
  },
  menuItemText: { flex: 1, color: colors.textPrimary, fontSize: 16 },
  menuItemDanger: { color: colors.danger },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs },

  // Cancel dialog
  cancelDialog: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet,
    padding: spacing.xl,
  },
  cancelDialogTitle: { fontSize: 19, color: colors.textPrimary, marginBottom: spacing.sm },
  cancelDialogBody: { color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg },
  cancelReasonLabel: { color: colors.textSecondary, marginBottom: spacing.xs },
  cancelReasonOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
    borderRadius: radius.input, marginBottom: spacing.xs,
  },
  cancelReasonSelected: { backgroundColor: colors.driverAccentSoft },
  cancelReasonRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
    borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center',
  },
  cancelReasonRadioSelected: { borderColor: colors.navigationDriver },
  cancelReasonRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navigationDriver },
  cancelReasonTextSelected: { color: colors.navigationDriver, fontWeight: '600' },
  cancelActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelActionBtn: { flex: 1 },
  cancelActionDanger: { borderColor: colors.danger },

  // ── Passenger View (preserve original logic)
  passengerContainer: { flex: 1, backgroundColor: colors.background },
  passengerHeaderFloat: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, alignItems: 'center',
  },
  passengerFloatBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: `${colors.border}4D`,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  passengerScroll: { flex: 1 },
  passengerMapWrap: { overflow: 'hidden' },
  passengerContent: { padding: 24, marginTop: -24, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  passengerRouteCard: {
    backgroundColor: colors.surface, padding: 20, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: `${colors.border}66`, marginBottom: 24,
  },
  passengerRouteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  passengerDest: { color: colors.textPrimary, marginBottom: 4 },
  passengerDepText: { color: colors.textSecondary },
  textPrimary: { color: colors.textPrimary },
  passengerPrice: { color: '#3B82F6' },
  passengerDate: { color: colors.textSecondary },
  mb6: { marginBottom: 24 },
  sectionTitlePassenger: { color: colors.textPrimary, marginBottom: 12 },
  passengerHint: { color: colors.textSecondary, marginBottom: 12 },
  passengerStopsCard: {
    backgroundColor: colors.surface, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.border}66`, overflow: 'hidden',
  },
  passengerInfoGrid: {
    flexDirection: 'row', backgroundColor: colors.surface, padding: 16, borderRadius: 24,
    marginBottom: 24, justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth, borderColor: `${colors.border}66`,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  passengerInfoCell: { alignItems: 'center', flex: 1 },
  passengerInfoCellBorder: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#F1F5F9' },
  passengerInfoLabel: { color: colors.textSecondary, marginTop: 4 },
  passengerSafeText: { color: '#16A34A', marginTop: 2 },
  passengerDriverLabel: { color: colors.textPrimary, marginBottom: 12 },
  passengerDriverCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: `${colors.border}66`,
    padding: 16, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
    marginBottom: 40,
  },
  passengerDriverAvatar: {
    width: 56, height: 56, backgroundColor: '#EFF6FF', borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#3B82F610', overflow: 'hidden',
  },
  passengerAvatarImg: { width: '100%', height: '100%' },
  passengerAvatarInitial: { color: '#3B82F6' },
  passengerRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  passengerRatingText: { color: '#15803D', marginLeft: 4, marginRight: 8 },
  passengerVerifiedText: { color: '#16A34A', marginLeft: 2, fontWeight: '600', fontSize: 11 },
  passengerChatBtn: { padding: 12, backgroundColor: '#EFF6FF', borderRadius: 9999, borderWidth: StyleSheet.hairlineWidth, borderColor: '#3B82F610' },
  passengerCta: {
    padding: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: `${colors.border}66`,
    backgroundColor: colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 8,
  },
  passengerSeatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  passengerSeatsHint: { color: colors.textSecondary, marginTop: 2 },
  passengerSeatsPicker: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9',
    borderRadius: 12, padding: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: `${colors.border}66`,
  },
  passengerSeatsBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  passengerSeatsCount: { paddingHorizontal: 16, color: colors.textPrimary, fontSize: 15 },

  // PickupChoice
  pickupChoice: {
    minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: `${colors.border}4D`,
    backgroundColor: colors.surface,
  },
  pickupChoiceSelected: { backgroundColor: '#EFF6FF' },
  pickupChoiceIcon: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    marginRight: 12, backgroundColor: colors.background,
  },
  pickupChoiceIconSelected: { backgroundColor: '#3B82F6' },
  pickupChoiceTitleSelected: { color: '#3B82F6' },
  pickupChoiceAddrSelected: { color: '#2563EB' },
});
