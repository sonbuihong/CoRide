import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
} from 'react-native';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SocketEvents } from '@repo/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  LocateFixed,
  Luggage,
  MapPin,
  MessageCircle,
  MoreVertical,
  Navigation,
  Minus,
  PawPrint,
  Phone,
  Plus,
  Route,
  Star,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { BottomSheetSurface } from '../../src/components/ui/BottomSheetSurface';
import { MatchExplanation } from '../../src/components/MatchExplanation';
import { bookingService, type DriverBookingSummary } from '../../src/services/booking.service';
import { rideService } from '../../src/services/ride.service';
import { paymentService } from '../../src/services/payment.service';
import { useAuth } from '../../src/hooks/useAuth';
import { colors, layout, radius, spacing } from '../../src/theme/tokens';
import { decodePolyline, getDirections } from '../../src/services/direction.service';
import { socketService } from '../../src/services/socket.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
              style={StyleSheet.absoluteFill}
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
        <View style={styles.menuBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng tùy chọn"
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuVisible(false)}
          />
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
        </View>
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

type PassengerRideParams = {
  id: string;
  context?: string;
  passengerOrigin?: string;
  passengerDestination?: string;
  passengerOriginLat?: string;
  passengerOriginLng?: string;
  passengerDestinationLat?: string;
  passengerDestinationLng?: string;
  passengerDate?: string;
  seats?: string;
  matchType?: 'DIRECT' | 'NEARBY' | 'ON_ROUTE';
  matchScore?: string;
  pickupDistanceKm?: string;
  dropoffDistanceKm?: string;
  detourKm?: string;
  routeOverlap?: string;
  sharedDistanceKm?: string;
  pickupRoutePosition?: string;
  dropoffRoutePosition?: string;
  expectedPickupTime?: string;
  estimatedDetourMinutes?: string;
  passengerFare?: string;
  passengerPricePerSeat?: string;
};

type MapPoint = { latitude: number; longitude: number };

const routeParamNumber = (value?: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseStoredRoute = (polyline: string | null | undefined, fallback: MapPoint[]): MapPoint[] => {
  if (!polyline) return fallback;
  try {
    const parsed = JSON.parse(polyline) as { coordinates?: unknown } | unknown[];
    const coordinates = Array.isArray(parsed) ? parsed : parsed.coordinates;
    if (Array.isArray(coordinates)) {
      const points = coordinates
        .filter((item): item is [number, number] => Array.isArray(item) && item.length >= 2 && Number.isFinite(item[0]) && Number.isFinite(item[1]))
        .map(([longitude, latitude]) => ({ latitude, longitude }));
      if (points.length > 1) return points;
    }
  } catch {
    const decoded = decodePolyline(polyline);
    if (decoded.length > 1) return decoded;
  }
  return fallback;
};

const nearestRoutePosition = (point: MapPoint | undefined, route: MapPoint[]) => {
  if (!point || route.length < 2) return undefined;
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  route.forEach((candidate, index) => {
    const distance = (candidate.latitude - point.latitude) ** 2 + (candidate.longitude - point.longitude) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex / Math.max(1, route.length - 1);
};

function PassengerRideView() {
  const params = useLocalSearchParams<PassengerRideParams>();
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const mapRef = useRef<MapView>(null);
  const initialSeats = Math.max(1, routeParamNumber(params.seats) ?? 1);
  const [seats, setSeats] = useState(initialSeats);
  const [pickupStopId, setPickupStopId] = useState<string>();
  const [sheetState, setSheetState] = useState<'confirm' | 'success' | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'WALLET' | 'CASH'>('WALLET');

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: () => paymentService.getWallet(),
  });
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [bookingError, setBookingError] = useState<string>();
  const [createdBooking, setCreatedBooking] = useState<{ id?: string; status?: string; totalPrice?: number }>();
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number; heading?: number } | null>(null);

  const rideQuery = useQuery({
    queryKey: ['ride', id],
    queryFn: () => rideService.getRideById(id),
    enabled: Boolean(id),
  });
  const baseRide = rideQuery.data;

  const passengerOrigin = useMemo<MapPoint | undefined>(() => {
    const latitude = routeParamNumber(params.passengerOriginLat);
    const longitude = routeParamNumber(params.passengerOriginLng);
    if (latitude != null && longitude != null) return { latitude, longitude };
    const userBooking = baseRide?.bookings?.find((b: any) => b.passengerId === user?.id);
    if (userBooking?.pickupLat != null && userBooking?.pickupLng != null) {
      return { latitude: userBooking.pickupLat, longitude: userBooking.pickupLng };
    }
    return undefined;
  }, [params.passengerOriginLat, params.passengerOriginLng, baseRide?.bookings, user?.id]);
  const passengerDestination = useMemo<MapPoint | undefined>(() => {
    const latitude = routeParamNumber(params.passengerDestinationLat);
    const longitude = routeParamNumber(params.passengerDestinationLng);
    if (latitude != null && longitude != null) return { latitude, longitude };
    const userBooking = baseRide?.bookings?.find((b: any) => b.passengerId === user?.id);
    if (userBooking?.dropoffLat != null && userBooking?.dropoffLng != null) {
      return { latitude: userBooking.dropoffLat, longitude: userBooking.dropoffLng };
    }
    return undefined;
  }, [params.passengerDestinationLat, params.passengerDestinationLng, baseRide?.bookings, user?.id]);
  const hasSearchContext = params.context === 'search' && Boolean(passengerOrigin && passengerDestination);
  const selectedPickupStop = useMemo(
    () => pickupStopId ? baseRide?.stops?.find((stop) => stop.id === pickupStopId) : undefined,
    [baseRide?.stops, pickupStopId],
  );
  const quoteOrigin = passengerOrigin ?? (selectedPickupStop ? {
    latitude: selectedPickupStop.latitude,
    longitude: selectedPickupStop.longitude,
  } : undefined);
  const quoteDestination = passengerDestination ?? baseRide?.destinationCoords;
  const hasQuoteContext = Boolean((hasSearchContext || selectedPickupStop) && quoteOrigin && quoteDestination);

  const offerQuery = useQuery({
    queryKey: ['ride-offer', id, params.passengerDate, quoteOrigin?.latitude, quoteOrigin?.longitude, quoteDestination?.latitude, quoteDestination?.longitude, seats],
    enabled: hasQuoteContext,
    queryFn: async () => {
      const offers = await rideService.getRides({
        origin: params.passengerOrigin,
        destination: params.passengerDestination,
        originLat: quoteOrigin?.latitude,
        originLng: quoteOrigin?.longitude,
        destinationLat: quoteDestination?.latitude,
        destinationLng: quoteDestination?.longitude,
        date: params.passengerDate,
        seats,
      });
      return offers.find((offer) => offer.id === id);
    },
    retry: 1,
  });

  const ride = useMemo(() => baseRide ? {
    ...baseRide,
    matchType: params.matchType,
    matchScore: routeParamNumber(params.matchScore),
    pickupDistanceKm: routeParamNumber(params.pickupDistanceKm),
    dropoffDistanceKm: routeParamNumber(params.dropoffDistanceKm),
    detourKm: routeParamNumber(params.detourKm),
    routeOverlap: routeParamNumber(params.routeOverlap),
    sharedDistanceKm: routeParamNumber(params.sharedDistanceKm),
    pickupRoutePosition: routeParamNumber(params.pickupRoutePosition),
    dropoffRoutePosition: routeParamNumber(params.dropoffRoutePosition),
    expectedPickupTime: params.expectedPickupTime,
    estimatedDetourMinutes: routeParamNumber(params.estimatedDetourMinutes),
    passengerFare: routeParamNumber(params.passengerFare),
    passengerPricePerSeat: routeParamNumber(params.passengerPricePerSeat),
    ...(offerQuery.data ?? {}),
  } : undefined, [baseRide, offerQuery.data, params.dropoffDistanceKm, params.dropoffRoutePosition, params.estimatedDetourMinutes, params.expectedPickupTime, params.matchScore, params.matchType, params.passengerFare, params.passengerPricePerSeat, params.pickupDistanceKm, params.pickupRoutePosition, params.routeOverlap, params.sharedDistanceKm, params.detourKm]);

  const fallbackRoute = useMemo(
    () => [baseRide?.departureCoords, baseRide?.destinationCoords].filter(Boolean) as MapPoint[],
    [baseRide?.departureCoords, baseRide?.destinationCoords],
  );
  const driverRoute = useMemo(
    () => parseStoredRoute(baseRide?.routePolyline, fallbackRoute),
    [baseRide?.routePolyline, fallbackRoute],
  );
  const pickupPosition = ride?.pickupRoutePosition ?? nearestRoutePosition(passengerOrigin, driverRoute);
  const dropoffPosition = ride?.dropoffRoutePosition ?? nearestRoutePosition(passengerDestination, driverRoute);
  const sharedRoute = useMemo(() => {
    if (pickupPosition == null || dropoffPosition == null || driverRoute.length < 2) return [];
    const from = Math.max(0, Math.floor(pickupPosition * (driverRoute.length - 1)));
    const to = Math.min(driverRoute.length - 1, Math.ceil(dropoffPosition * (driverRoute.length - 1)));
    return to > from ? driverRoute.slice(from, to + 1) : [];
  }, [driverRoute, dropoffPosition, pickupPosition]);

  const relevantCoordinates = useMemo(
    () => [...driverRoute, ...(passengerOrigin ? [passengerOrigin] : []), ...(passengerDestination ? [passengerDestination] : [])],
    [driverRoute, passengerDestination, passengerOrigin],
  );
  const fitRelevantRoute = useCallback(() => {
    if (relevantCoordinates.length < 2) return;
    mapRef.current?.fitToCoordinates(relevantCoordinates, {
      animated: false,
      edgePadding: { top: 42, right: 32, bottom: 42, left: 32 },
    });
  }, [relevantCoordinates]);

  const timeline = useMemo(() => {
    if (!ride) return [];
    const pickup = pickupPosition;
    const dropoff = dropoffPosition;
    const items = [
      { key: 'driver-origin', position: 0, title: ride.departure, kind: 'driver' as const },
      ...(ride.stops ?? []).map((stop, index) => ({
        key: stop.id,
        position: nearestRoutePosition({ latitude: stop.latitude, longitude: stop.longitude }, driverRoute) ?? (index + 1) / ((ride.stops?.length ?? 0) + 1),
        title: stop.name || stop.address,
        kind: 'stop' as const,
      })),
      ...(hasSearchContext && pickup != null ? [{ key: 'passenger-pickup', position: pickup, title: params.passengerOrigin || 'Điểm đón của bạn', kind: 'pickup' as const }] : []),
      ...(hasSearchContext && dropoff != null ? [{ key: 'passenger-dropoff', position: dropoff, title: params.passengerDestination || 'Điểm xuống của bạn', kind: 'dropoff' as const }] : []),
      { key: 'driver-destination', position: 1, title: ride.destination, kind: 'driver' as const },
    ];
    return items.sort((left, right) => left.position - right.position);
  }, [driverRoute, dropoffPosition, hasSearchContext, params.passengerDestination, params.passengerOrigin, pickupPosition, ride]);

  // Khởi tạo vị trí tài xế từ API ban đầu nếu có
  useEffect(() => {
    if (baseRide && (baseRide as any).currentDriverLat != null && (baseRide as any).currentDriverLng != null) {
      setDriverLocation((prev) => prev || {
        latitude: (baseRide as any).currentDriverLat,
        longitude: (baseRide as any).currentDriverLng,
      });
    }
  }, [baseRide]);

  useEffect(() => {
    if (!id) return;
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['ride', id] });
      void queryClient.invalidateQueries({ queryKey: ['ride-offer', id] });
    };
    
    const handleDriverLocation = (payload: any) => {
      if (payload && payload.latitude && payload.longitude) {
        setDriverLocation({
          latitude: payload.latitude,
          longitude: payload.longitude,
          heading: payload.heading,
        });
      }
    };

    const events = [
      SocketEvents.RIDE_UPDATED,
      SocketEvents.RIDE_STATUS_UPDATED,
      SocketEvents.RIDE_SEATS_UPDATED,
      SocketEvents.RIDE_FULL,
      SocketEvents.BOOKING_CONFIRMED,
      SocketEvents.BOOKING_REJECTED,
      SocketEvents.BOOKING_CANCELLED,
    ];
    void socketService.connect();
    socketService.emit(SocketEvents.RIDE_JOIN_ROOM, id);
    events.forEach((event) => socketService.on(event, refresh));
    socketService.on(SocketEvents.DRIVER_LOCATION, handleDriverLocation);
    
    return () => {
      socketService.emit(SocketEvents.RIDE_LEAVE_ROOM, id);
      events.forEach((event) => socketService.off(event, refresh));
      socketService.off(SocketEvents.DRIVER_LOCATION, handleDriverLocation);
    };
  }, [id, queryClient]);

  const bookingMutation = useMutation({
    mutationFn: () => bookingService.createBooking(id, seats, {
      pickupStopId,
      passengerLat: passengerOrigin?.latitude,
      passengerLng: passengerOrigin?.longitude,
      pickupAddress: params.passengerOrigin,
      dropoffLat: passengerDestination?.latitude,
      dropoffLng: passengerDestination?.longitude,
      dropoffAddress: params.passengerDestination,
      paymentMethod: selectedPaymentMethod,
    }),
    onSuccess: async (result) => {
      const booking = result.booking ?? result;
      setCreatedBooking({ id: booking.id, status: booking.status, totalPrice: booking.totalPrice });
      setBookingError(undefined);
      setSheetState(null); // Close confirmation sheet
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ride', id] }),
        queryClient.invalidateQueries({ queryKey: ['ride-search'] }),
        queryClient.invalidateQueries({ queryKey: ['activities'] }),
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['active-booking'] }),
      ]);

      if (booking.id) {
        if (booking.status === 'CONFIRMED') {
          router.replace({ pathname: '/booking/[id]', params: { id: booking.id } } as any);
        } else {
          router.replace({ pathname: '/booking/waiting', params: { id: booking.id } } as any);
        }
      } else {
        router.replace('/(passenger-tabs)/my-rides' as any);
      }
    },
    onError: (error: any) => {
      const message = error.message || error.response?.data?.message || 'Không thể thực hiện đặt chỗ. Vui lòng thử lại.';
      const stale = error.status === 409 || error.response?.status === 409 || /không còn đủ ghế|hết chỗ/i.test(message);
      setBookingError(stale ? 'Chuyến này vừa hết chỗ. Hãy quay lại danh sách để chọn chuyến khác.' : message);
    },
  });

  if (rideQuery.isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.navigationPassenger} /></View>;
  }
  if (rideQuery.isError || !ride) {
    return (
      <View style={styles.centeredPad}>
        <AppText variant="h3" weight="semibold">Không thể tải chuyến đi</AppText>
        <AppText variant="bodySmall" style={styles.passengerMuted}>Kiểm tra kết nối rồi thử lại.</AppText>
        <AppButton title="Quay lại" variant="outline" onPress={() => router.back()} style={styles.mt4} />
      </View>
    );
  }

  const offerUnavailable = hasQuoteContext && !offerQuery.isPending && !offerQuery.data;
  const canBookStatus = ride.status === 'SCHEDULED' || ride.status === 'ONGOING';
  const canBook = canBookStatus && !offerUnavailable && ride.availableSeats >= seats && (ride.status !== 'ONGOING' || hasSearchContext);
  const isInstant = ride.bookingPolicy === 'INSTANT';
  const pricePerSeat = offerQuery.data?.passengerPricePerSeat ?? ride.passengerPricePerSeat ?? ride.price;
  const totalFare = hasQuoteContext
    ? (offerQuery.data?.passengerFare ?? pricePerSeat * seats)
    : pricePerSeat * seats;
  const walletData = (walletQuery.data as any)?.wallet ?? walletQuery.data;
  const walletBalance = Number(walletData?.rideBalance ?? walletData?.balance ?? 0);
  const isWalletInsufficient = selectedPaymentMethod === 'WALLET' && walletBalance < totalFare;
  const pickupLabel = hasSearchContext
    ? params.passengerOrigin || ride.departure
    : selectedPickupStop?.address || ride.departure;
  const dropoffLabel = hasSearchContext ? params.passengerDestination || ride.destination : ride.destination;
  const driverName = [ride.driver?.firstName, ride.driver?.lastName].filter(Boolean).join(' ') || 'Tài xế CoRide';
  const vehicle = ride.driver?.vehicle ?? ride.vehicle ?? undefined;
  const vehicleText = [vehicle?.type === 'CAR' ? 'Ô tô' : vehicle?.type === 'BIKE' ? 'Xe máy' : undefined, vehicle?.color, vehicle?.licensePlate].filter(Boolean).join(' · ');
  const dateText = format(new Date(ride.departureTime), 'HH:mm · EEEE, dd/MM', { locale: vi });
  const ctaTitle = canBook ? (isInstant ? 'Đặt chỗ' : 'Yêu cầu đặt chỗ') : offerUnavailable || ride.availableSeats < seats ? 'Chuyến vừa hết chỗ' : 'Không thể đặt chỗ';

  return (
    <View style={styles.passengerScreen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.passengerScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.passengerScrollContent, { paddingBottom: 132 + insets.bottom }]}
      >
        <View style={styles.passengerMap}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={ride.departureCoords ? { ...ride.departureCoords, latitudeDelta: 0.08, longitudeDelta: 0.08 } : { latitude: 21.0285, longitude: 105.8542, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
            onMapReady={fitRelevantRoute}
            toolbarEnabled={false}
            showsUserLocation
            showsMyLocationButton={false}
            accessibilityLabel="Bản đồ tuyến tài xế và đoạn đi chung của bạn"
          >
            {driverRoute.length > 1 ? <Polyline coordinates={driverRoute} strokeColor="#CBD5E1" strokeWidth={10} zIndex={1} /> : null}
            {sharedRoute.length > 1 ? <Polyline coordinates={sharedRoute} strokeColor={colors.primary} strokeWidth={6} zIndex={2} /> : null}
            {ride.departureCoords ? <Marker coordinate={ride.departureCoords} title="Điểm đầu tuyến tài xế" pinColor="#94A3B8" /> : null}
            {ride.destinationCoords ? <Marker coordinate={ride.destinationCoords} title="Điểm cuối tuyến tài xế" pinColor="#475569" /> : null}
            {passengerOrigin ? <Marker coordinate={passengerOrigin} title="Điểm đón của bạn" pinColor={colors.mapPickup} /> : null}
            {passengerDestination ? <Marker coordinate={passengerDestination} title="Điểm xuống của bạn" pinColor={colors.mapDestination} /> : null}
            {driverLocation ? (
              <Marker
                coordinate={driverLocation}
                title={driverName || 'Tài xế'}
                anchor={{ x: 0.5, y: 0.5 }}
                rotation={driverLocation.heading ?? 0}
                flat={true}
                zIndex={3}
              >
                <View style={styles.driverMarkerOuter}>
                  <View style={styles.driverMarkerInner}>
                    <Navigation size={12} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
                  </View>
                </View>
              </Marker>
            ) : null}
          </MapView>
          <View style={[styles.passengerMapHeader, { top: insets.top + spacing.xs }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={({ pressed }) => [styles.passengerMapButton, pressed && styles.passengerMapButtonPressed]}>
              <ArrowLeft color={colors.textPrimary} size={23} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Căn giữa toàn bộ hành trình" onPress={fitRelevantRoute} style={({ pressed }) => [styles.passengerMapButton, pressed && styles.passengerMapButtonPressed]}>
              <LocateFixed color={colors.primary} size={21} />
            </Pressable>
          </View>
          <View pointerEvents="none" style={styles.mapLegend}>
            <View style={styles.legendItem}><View style={styles.driverLegendLine} /><AppText variant="caption">Tuyến tài xế</AppText></View>
            {sharedRoute.length > 1 ? <View style={styles.legendItem}><View style={styles.sharedLegendLine} /><AppText variant="caption" weight="semibold">Đoạn bạn đi chung</AppText></View> : null}
            <View style={styles.legendItem}><View style={styles.driverLegendMarker} /><AppText variant="caption">Vị trí tài xế</AppText></View>
          </View>
        </View>

        <View style={styles.passengerBody}>
          <View style={styles.passengerHero}>
            <View style={styles.passengerHeroTopRow}>
              <View style={styles.passengerDatePill}>
                <CalendarClock size={15} color={colors.primary} />
                <AppText variant="caption" weight="semibold" style={[styles.capitalize, styles.passengerDateText]}>{dateText}</AppText>
              </View>
              <View style={styles.passengerAvailabilityPill}>
                <View style={styles.passengerAvailabilityDot} />
                <AppText variant="caption" weight="semibold" style={styles.passengerAvailabilityText}>Còn {ride.availableSeats} ghế</AppText>
              </View>
            </View>
            <View style={styles.passengerRouteRow}>
              <View style={styles.passengerRouteRail}><View style={styles.passengerPickupDot} /><View style={styles.passengerRouteLine} /><View style={styles.passengerDropoffDot} /></View>
              <View style={styles.passengerRouteCopy}>
                <View>
                  <AppText variant="caption" style={styles.passengerRouteLabel}>Điểm đón</AppText>
                  <AppText variant="body" weight="semibold">{pickupLabel}</AppText>
                </View>
                <View>
                  <AppText variant="caption" style={styles.passengerRouteLabel}>Điểm đến</AppText>
                  <AppText variant="body" weight="semibold">{dropoffLabel}</AppText>
                </View>
              </View>
            </View>
            <View style={styles.passengerTripFacts}>
              <View style={styles.passengerTripFact}><Route size={15} color={colors.textSecondary} /><AppText variant="caption" weight="semibold">{ride.distance ? `${ride.distance.toFixed(1).replace('.', ',')} km` : 'Đang cập nhật'}</AppText></View>
              <View style={styles.passengerTripFact}><CalendarClock size={15} color={colors.textSecondary} /><AppText variant="caption" weight="semibold">{ride.duration ? `Khoảng ${Math.round(ride.duration)} phút` : 'Chưa có thời lượng'}</AppText></View>
              <View style={styles.passengerTripFact}><BadgeCheck size={15} color={colors.textSecondary} /><AppText variant="caption" weight="semibold">{isInstant ? 'Xác nhận tức thì' : 'Tài xế duyệt'}</AppText></View>
            </View>
          </View>

          {hasSearchContext && ride.matchScore != null ? (
            <View style={styles.passengerSection}>
              <MatchExplanation ride={ride} featured />
            </View>
          ) : null}

          <View style={styles.passengerSectionCompact}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={timelineExpanded ? 'Thu gọn chi tiết tuyến đường' : 'Xem chi tiết tuyến đường'}
              accessibilityState={{ expanded: timelineExpanded }}
              onPress={() => setTimelineExpanded((value) => !value)}
              style={({ pressed }) => [styles.passengerSectionToggle, pressed && styles.passengerPressed]}
            >
              <View style={styles.flex1}>
                <AppText accessibilityRole="header" variant="h3" weight="semibold">Chi tiết tuyến đường</AppText>
                <AppText variant="caption" style={styles.passengerMuted}>{timeline.length} điểm trên hành trình</AppText>
              </View>
              <View style={styles.passengerToggleIcon}>
                <ChevronDown size={19} color={colors.primary} style={{ transform: [{ rotate: timelineExpanded ? '180deg' : '0deg' }] }} />
              </View>
            </Pressable>
            {timelineExpanded ? (
              <View style={styles.passengerTimeline}>
                {timeline.map((item, index) => (
                  <View key={item.key} style={styles.passengerTimelineItem}>
                    <View style={styles.passengerTimelineRail}>
                      <View style={[
                        styles.passengerTimelineDot,
                        item.kind === 'pickup' && styles.passengerTimelinePickup,
                        item.kind === 'dropoff' && styles.passengerTimelineDropoff,
                      ]} />
                      {index < timeline.length - 1 ? <View style={styles.passengerTimelineLine} /> : null}
                    </View>
                    <View style={styles.passengerTimelineCopy}>
                      <AppText variant="bodySmall" weight={item.kind === 'pickup' || item.kind === 'dropoff' ? 'semibold' : 'normal'}>{item.title}</AppText>
                      {item.kind === 'pickup' ? <AppText variant="caption" style={styles.passengerAccent}>Điểm đón của bạn</AppText> : null}
                      {item.kind === 'dropoff' ? <AppText variant="caption" style={styles.passengerAccent}>Điểm xuống của bạn</AppText> : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.passengerSection}>
            <AppText accessibilityRole="header" variant="h3" weight="semibold">Tài xế</AppText>
            <View style={styles.passengerDriver}>
              {ride.driver?.avatar ? <Image source={{ uri: ride.driver.avatar }} style={styles.passengerDriverImage} /> : <View style={styles.passengerDriverFallback}><User size={23} color={colors.primary} /></View>}
              <View style={styles.passengerDriverCopy}>
                <View style={styles.passengerDriverNameRow}>
                  <AppText variant="body" weight="semibold">{driverName}</AppText>
                  {ride.driver?.isVerified ? <CheckCircle2 size={16} color={colors.primary} /> : null}
                </View>
                <View style={styles.passengerDriverMeta}>
                  {typeof ride.driver?.rating === 'number' && ride.driver.rating > 0 ? <><Star size={13} color="#D97706" fill="#D97706" /><AppText variant="caption" weight="semibold">{ride.driver.rating.toFixed(1)}{ride.driver.ratingCount ? ' · ' + ride.driver.ratingCount + ' đánh giá' : ''}</AppText></> : <AppText variant="caption">Chưa có đánh giá</AppText>}
                </View>
                {vehicleText ? <AppText variant="caption">{vehicleText}</AppText> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nhắn tin cho tài xế"
                onPress={() => router.push({
                  pathname: '/chat/[rideId]',
                  params: { rideId: ride.id, otherUserId: ride.driverId, otherUserName: driverName },
                } as any)}
                style={({ pressed }) => [styles.passengerChat, pressed && styles.passengerPressed]}
              >
                <MessageCircle size={20} color={colors.primary} />
              </Pressable>
            </View>
            <View style={styles.passengerRules}>
              <View style={styles.passengerRule}><CheckCircle2 size={15} color={colors.success} /><AppText variant="caption">{ride.allowSmoking ? 'Có thể hút thuốc' : 'Không hút thuốc'}</AppText></View>
              <View style={styles.passengerRule}>{ride.allowLuggage ? <Luggage size={15} color={colors.success} /> : <X size={15} color={colors.textTertiary} />}<AppText variant="caption">{ride.allowLuggage ? 'Có hành lý' : 'Không nhận hành lý'}</AppText></View>
              <View style={styles.passengerRule}>{ride.allowPets ? <PawPrint size={15} color={colors.success} /> : <X size={15} color={colors.textTertiary} />}<AppText variant="caption">{ride.allowPets ? 'Có thú cưng' : 'Không thú cưng'}</AppText></View>
            </View>
          </View>

          <View style={styles.passengerSection}>
            <View style={styles.seatPickerRow}>
              <View>
                <AppText accessibilityRole="header" variant="h3" weight="semibold">Đặt chỗ</AppText>
                <AppText variant="caption" style={styles.passengerMuted}>Chọn số ghế bạn cần</AppText>
              </View>
              <View style={styles.passengerSeatPicker}>
                <Pressable accessibilityRole="button" accessibilityLabel="Giảm số ghế" accessibilityState={{ disabled: seats <= 1 }} disabled={seats <= 1} onPress={() => setSeats((value) => Math.max(1, value - 1))} style={({ pressed }) => [styles.seatPickerButton, pressed && seats > 1 && styles.passengerPressed]}><Minus size={18} color={seats <= 1 ? colors.textTertiary : colors.textPrimary} /></Pressable>
                <AppText weight="semibold" style={styles.seatPickerValue}>{seats}</AppText>
                <Pressable accessibilityRole="button" accessibilityLabel="Tăng số ghế" accessibilityState={{ disabled: seats >= ride.availableSeats }} disabled={seats >= ride.availableSeats} onPress={() => setSeats((value) => Math.min(ride.availableSeats, value + 1))} style={({ pressed }) => [styles.seatPickerButton, pressed && seats < ride.availableSeats && styles.passengerPressed]}><Plus size={18} color={seats >= ride.availableSeats ? colors.textTertiary : colors.textPrimary} /></Pressable>
              </View>
            </View>
            <View style={styles.priceDivider} />
            {ride.sharedDistanceKm != null ? <View style={styles.priceRow}><AppText variant="bodySmall" style={styles.passengerMuted}>Đoạn đi chung</AppText><AppText variant="bodySmall" weight="semibold">{ride.sharedDistanceKm.toFixed(1).replace('.', ',')} km</AppText></View> : null}
            <View style={styles.priceRow}><AppText variant="bodySmall" style={styles.passengerMuted}>Giá mỗi ghế</AppText><AppText variant="bodySmall" weight="semibold">{formatVnd(pricePerSeat)}</AppText></View>
            <AppText variant="caption" style={styles.passengerMuted}>{ride.totalSeats ?? ride.availableSeats} ghế khách + 1 tài xế = chia {(ride.totalSeats ?? ride.availableSeats) + 1} phần. Ghế trống không làm tăng giá của bạn.</AppText>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}><AppText weight="semibold">Tổng thanh toán</AppText><AppText variant="h2" weight="semibold" style={styles.passengerPrice}>{formatVnd(totalFare)}</AppText></View>
          </View>

          {!hasSearchContext && ride.stops?.length ? (
            <View style={styles.passengerSection}>
              <AppText accessibilityRole="header" variant="h3" weight="semibold">Chọn điểm đón</AppText>
              <Pressable accessibilityRole="radio" accessibilityState={{ selected: pickupStopId == null }} onPress={() => setPickupStopId(undefined)} style={[styles.stopChoice, pickupStopId == null && styles.stopChoiceSelected]}><MapPin size={18} color={colors.primary} /><AppText variant="bodySmall" style={styles.flex1}>Điểm xuất phát của tài xế</AppText></Pressable>
              {ride.stops.map((stop) => <Pressable key={stop.id} accessibilityRole="radio" accessibilityState={{ selected: pickupStopId === stop.id }} onPress={() => setPickupStopId(stop.id)} style={[styles.stopChoice, pickupStopId === stop.id && styles.stopChoiceSelected]}><MapPin size={18} color={colors.primary} /><View style={styles.flex1}><AppText variant="bodySmall" weight="semibold">{stop.name || 'Điểm dừng'}</AppText><AppText variant="caption">{stop.address}</AppText></View></Pressable>)}
            </View>
          ) : null}

          {offerUnavailable ? (
            <View accessibilityRole="alert" style={styles.soldOutNotice}>
              <AppText variant="bodySmall" weight="semibold" style={styles.soldOutTitle}>Chuyến này vừa hết chỗ</AppText>
              <AppText variant="bodySmall" style={styles.passengerMuted}>Hãy quay lại danh sách để chọn chuyến khác.</AppText>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.passengerCtaBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <View style={styles.passengerCtaSummary}>
          <View><AppText variant="h3" weight="semibold" style={styles.passengerPrice}>{formatVnd(totalFare)}</AppText><AppText variant="caption">{seats} ghế</AppText></View>
          <AppButton title={ctaTitle} variant="passenger" disabled={!canBook || bookingMutation.isPending || offerQuery.isFetching} isLoading={bookingMutation.isPending || offerQuery.isFetching} onPress={() => { setBookingError(undefined); setSheetState('confirm'); }} style={styles.passengerCtaButton} />
        </View>
      </View>

      <Modal visible={sheetState != null} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setSheetState(null)}>
        <View style={styles.confirmModalContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng bảng xác nhận"
            style={styles.confirmBackdrop}
            onPress={() => setSheetState(null)}
          />
          <View style={styles.confirmSheetContainer}>
            <BottomSheetSurface style={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}>
              {sheetState === 'success' ? (
                <View style={styles.confirmContent}>
                  <View style={styles.successIcon}><CheckCircle2 size={30} color={colors.success} /></View>
                  <AppText accessibilityRole="header" variant="h2" weight="semibold" style={styles.confirmCentered}>{createdBooking?.status === 'CONFIRMED' ? 'Đã đặt chỗ' : 'Đã gửi yêu cầu'}</AppText>
                  <AppText variant="bodySmall" style={[styles.passengerMuted, styles.confirmCentered]}>{createdBooking?.status === 'CONFIRMED' ? 'Chỗ của bạn đã được xác nhận ngay.' : 'Đang chờ ' + driverName + ' xác nhận. Bạn sẽ nhận được thông báo khi tài xế phản hồi.'}</AppText>
                  {createdBooking?.totalPrice != null ? <AppText variant="h3" weight="semibold" style={[styles.passengerPrice, styles.confirmCentered]}>{formatVnd(createdBooking.totalPrice)}</AppText> : null}
                  <AppButton
                    title="Xem chuyến đi"
                    variant="passenger"
                    onPress={() => {
                      setSheetState(null);
                      if (createdBooking?.id) {
                        router.replace({
                          pathname: `/booking/[id]`,
                          params: { id: createdBooking.id },
                        } as any);
                      } else {
                        router.replace('/(passenger-tabs)/my-rides' as any);
                      }
                    }}
                  />
                </View>
              ) : (
                <View style={styles.confirmContent}>
                  <AppText accessibilityRole="header" variant="h2" weight="semibold">Xác nhận {isInstant ? 'đặt chỗ' : 'yêu cầu'}</AppText>
                  <View style={styles.confirmRoute}><AppText variant="bodySmall" weight="semibold">{pickupLabel}</AppText><ArrowRight size={18} color={colors.textTertiary} /><AppText variant="bodySmall" weight="semibold">{dropoffLabel}</AppText></View>
                  <View style={styles.confirmMeta}><AppText variant="bodySmall">{ride.expectedPickupTime ? format(new Date(ride.expectedPickupTime), 'HH:mm') : format(new Date(ride.departureTime), 'HH:mm')} · {seats} ghế</AppText><AppText variant="h3" weight="semibold" style={styles.passengerPrice}>{formatVnd(totalFare)}</AppText></View>
                  <AppText variant="bodySmall" style={styles.passengerMuted}>{isInstant ? 'Chỗ của bạn sẽ được xác nhận ngay nếu backend kiểm tra vẫn còn đủ ghế.' : 'Tài xế sẽ xác nhận yêu cầu của bạn trước khi chuyến được đặt.'}</AppText>

                  {/* ── Section: PHƯƠNG THỨC THANH TOÁN (Bắt buộc chọn trước khi xác nhận) ── */}
                  <View style={styles.paymentSection}>
                    <AppText variant="caption" weight="bold" style={styles.paymentSectionHeader}>
                      PHƯƠNG THỨC THANH TOÁN
                    </AppText>

                    {/* Lựa chọn 1: Ví CoRide */}
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected: selectedPaymentMethod === 'WALLET' }}
                      onPress={() => setSelectedPaymentMethod('WALLET')}
                      style={[
                        styles.paymentCard,
                        selectedPaymentMethod === 'WALLET' && styles.paymentCardSelected,
                      ]}
                    >
                      <View style={[styles.paymentIconWrap, selectedPaymentMethod === 'WALLET' && styles.paymentIconWrapSelected]}>
                        <Wallet size={20} color={selectedPaymentMethod === 'WALLET' ? colors.primary : colors.textSecondary} />
                      </View>
                      <View style={styles.flex1}>
                        <View style={styles.paymentTitleRow}>
                          <AppText variant="bodySmall" weight="semibold">Ví CoRide</AppText>
                          <AppText
                            variant="caption"
                            weight="bold"
                            style={walletBalance >= totalFare ? styles.balanceOk : styles.balanceWarning}
                          >
                            Số dư: {formatVnd(walletBalance)}
                          </AppText>
                        </View>
                        <AppText variant="caption" style={styles.passengerMuted}>
                          Trừ trực tiếp số dư ví CoRide ngay khi đặt chỗ
                        </AppText>
                        {isWalletInsufficient && (
                          <View style={styles.insufficientRow}>
                            <AlertTriangle size={13} color={colors.danger} />
                            <AppText variant="caption" style={styles.insufficientText}>
                              {`Số dư không đủ (${formatVnd(walletBalance)} < ${formatVnd(totalFare)}). Vui lòng nạp thêm hoặc chọn Tiền mặt.`}
                            </AppText>
                          </View>
                        )}
                      </View>
                    </Pressable>

                    {/* Lựa chọn 2: Tiền mặt */}
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected: selectedPaymentMethod === 'CASH' }}
                      onPress={() => setSelectedPaymentMethod('CASH')}
                      style={[
                        styles.paymentCard,
                        selectedPaymentMethod === 'CASH' && styles.paymentCardSelected,
                      ]}
                    >
                      <View style={[styles.paymentIconWrap, selectedPaymentMethod === 'CASH' && styles.paymentIconWrapSelected]}>
                        <Banknote size={20} color={selectedPaymentMethod === 'CASH' ? colors.primary : colors.textSecondary} />
                      </View>
                      <View style={styles.flex1}>
                        <AppText variant="bodySmall" weight="semibold">Tiền mặt</AppText>
                        <AppText variant="caption" style={styles.passengerMuted}>
                          Thanh toán trực tiếp cho tài xế khi kết thúc chuyến đi
                        </AppText>
                      </View>
                    </Pressable>
                  </View>

                  {bookingError ? <View accessibilityRole="alert" style={styles.bookingError}><AppText variant="bodySmall" style={styles.bookingErrorText}>{bookingError}</AppText></View> : null}
                  <View style={styles.confirmActions}>
                    <AppButton title="Quay lại" variant="outline" onPress={() => setSheetState(null)} style={styles.confirmAction} />
                    <AppButton
                      title={
                        isWalletInsufficient
                          ? 'Số dư ví không đủ'
                          : isInstant
                            ? 'Đặt chỗ'
                            : 'Gửi yêu cầu'
                      }
                      variant="passenger"
                      isLoading={bookingMutation.isPending}
                      disabled={bookingMutation.isPending || isWalletInsufficient}
                      onPress={() => bookingMutation.mutate()}
                      style={styles.confirmAction}
                    />
                  </View>
                </View>
              )}
            </BottomSheetSurface>
          </View>
        </View>
      </Modal>
    </View>
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
  mapOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: spacing.sm },
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

  // Passenger search-context detail
  passengerScreen: { backgroundColor: '#F4F7FB', flex: 1 },
  passengerScrollContent: { flexGrow: 1 },
  passengerMap: { backgroundColor: colors.surfaceMuted, height: 332, overflow: 'hidden' },
  passengerMapHeader: { flexDirection: 'row', justifyContent: 'space-between', left: spacing.md, position: 'absolute', right: spacing.md },
  passengerMapButton: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: radius.pill, elevation: 4, height: 48, justifyContent: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 10, width: 48 },
  passengerMapButtonPressed: { opacity: 0.72 },
  mapLegend: { backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: radius.pill, bottom: spacing.lg, flexDirection: 'row', gap: spacing.sm, left: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: 9, position: 'absolute', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  driverLegendLine: { backgroundColor: '#475569', borderRadius: radius.pill, height: 4, width: 22 },
  sharedLegendLine: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 7, width: 22 },
  driverMarkerOuter: { alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0, 113, 227, 0.25)' },
  driverMarkerInner: { alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 11, backgroundColor: colors.navigationPassenger || '#0071E3', borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  driverLegendMarker: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.navigationPassenger || '#0071E3', borderWidth: 2, borderColor: '#FFFFFF' },
  passengerBody: { alignSelf: 'center', gap: spacing.md, marginTop: -20, maxWidth: layout.maxContentWidth, paddingBottom: spacing.lg, paddingHorizontal: spacing.md, width: '100%', zIndex: 2 },
  passengerHero: { backgroundColor: colors.surface, borderRadius: 24, elevation: 5, gap: spacing.md, padding: spacing.lg, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20 },
  passengerHeroTopRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'space-between' },
  passengerDatePill: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, flexDirection: 'row', gap: 6, minHeight: 34, paddingHorizontal: 11 },
  passengerDateText: { color: colors.primary },
  passengerAvailabilityPill: { alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: radius.pill, flexDirection: 'row', gap: 6, minHeight: 34, paddingHorizontal: 10 },
  passengerAvailabilityDot: { backgroundColor: '#16A34A', borderRadius: radius.pill, height: 7, width: 7 },
  passengerAvailabilityText: { color: '#166534' },
  passengerRouteRow: { flexDirection: 'row', minHeight: 108 },
  passengerRouteRail: { alignItems: 'center', marginRight: spacing.sm, paddingVertical: 7, width: 18 },
  passengerPickupDot: { backgroundColor: colors.surface, borderColor: colors.mapPickup, borderRadius: radius.pill, borderWidth: 2, height: 12, width: 12 },
  passengerRouteLine: { backgroundColor: colors.primary, borderRadius: radius.pill, flex: 1, marginVertical: 4, width: 3 },
  passengerDropoffDot: { backgroundColor: colors.mapDestination, borderRadius: radius.pill, height: 11, width: 11 },
  passengerRouteCopy: { flex: 1, gap: spacing.lg, justifyContent: 'space-between', minWidth: 0 },
  passengerRouteLabel: { color: colors.textSecondary, marginBottom: 3 },
  passengerTripFacts: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingTop: spacing.sm },
  passengerTripFact: { alignItems: 'center', backgroundColor: '#F7F9FC', borderRadius: radius.pill, flexDirection: 'row', gap: 6, minHeight: 34, paddingHorizontal: 10 },
  passengerMuted: { color: colors.textSecondary },
  passengerAccent: { color: colors.primary, marginTop: 2 },
  capitalize: { textTransform: 'capitalize' },
  passengerSection: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, gap: spacing.md, padding: spacing.lg },
  passengerSectionCompact: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  passengerSectionToggle: { alignItems: 'center', flexDirection: 'row', minHeight: 72, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  passengerToggleIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: 40, justifyContent: 'center', width: 40 },
  passengerPressed: { opacity: 0.68 },
  passengerTimeline: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  passengerTimelineItem: { flexDirection: 'row', minHeight: 58 },
  passengerTimelineRail: { alignItems: 'center', marginRight: spacing.sm, width: 18 },
  passengerTimelineDot: { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radius.pill, borderWidth: 2, height: 11, marginTop: 3, width: 11 },
  passengerTimelinePickup: { backgroundColor: colors.mapPickup, borderColor: colors.mapPickup, height: 13, width: 13 },
  passengerTimelineDropoff: { backgroundColor: colors.mapDestination, borderColor: colors.mapDestination, height: 13, width: 13 },
  passengerTimelineLine: { backgroundColor: colors.borderStrong, flex: 1, marginVertical: 3, width: 2 },
  passengerTimelineCopy: { flex: 1, paddingBottom: spacing.md },
  passengerDriver: { alignItems: 'center', flexDirection: 'row' },
  passengerDriverImage: { backgroundColor: colors.surfaceMuted, borderRadius: 26, height: 52, width: 52 },
  passengerDriverFallback: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 26, height: 52, justifyContent: 'center', width: 52 },
  passengerDriverCopy: { flex: 1, gap: 3, marginLeft: spacing.sm, minWidth: 0 },
  passengerDriverNameRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  passengerDriverMeta: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  passengerChat: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 },
  passengerRules: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  passengerRule: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, minHeight: 36, paddingHorizontal: spacing.sm },
  priceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  priceDivider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth },
  seatPickerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  passengerSeatPicker: { alignItems: 'center', backgroundColor: '#F1F5F9', borderColor: colors.border, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  seatPickerButton: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  seatPickerValue: { minWidth: 36, textAlign: 'center' },
  stopChoice: { alignItems: 'center', borderRadius: radius.input, flexDirection: 'row', gap: spacing.sm, minHeight: 56, padding: spacing.sm },
  stopChoiceSelected: { backgroundColor: colors.primarySoft },
  soldOutNotice: { backgroundColor: colors.dangerSoft, borderRadius: radius.card, gap: spacing.xs, padding: spacing.md },
  soldOutTitle: { color: colors.danger },
  passengerCtaBar: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopWidth: StyleSheet.hairlineWidth, bottom: 0, elevation: 12, left: 0, paddingHorizontal: spacing.md, paddingTop: spacing.sm, position: 'absolute', right: 0, shadowColor: '#0F172A', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.1, shadowRadius: 18 },
  passengerCtaSummary: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: spacing.sm, maxWidth: layout.maxContentWidth, width: '100%' },
  passengerCtaButton: { flex: 1 },
  confirmModalContainer: { flex: 1, justifyContent: 'flex-end' },
  confirmBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim },
  confirmSheetContainer: { width: '100%' },
  confirmContent: { gap: spacing.lg, paddingBottom: spacing.sm },
  confirmCentered: { textAlign: 'center' },
  confirmRoute: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.input, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', padding: spacing.md },
  confirmMeta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  confirmActions: { flexDirection: 'row', gap: spacing.sm },
  confirmAction: { flex: 1 },
  bookingError: { backgroundColor: colors.dangerSoft, borderRadius: radius.input, padding: spacing.sm },
  bookingErrorText: { color: colors.danger },
  successIcon: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.successSoft, borderRadius: radius.pill, height: 64, justifyContent: 'center', width: 64 },
  paymentSection: { gap: spacing.xs, marginVertical: spacing.xs },
  paymentSectionHeader: { color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radius.card || 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  paymentCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0F7FF',
  },
  paymentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  paymentIconWrapSelected: {
    backgroundColor: '#DBEAFE',
  },
  paymentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  balanceOk: { color: colors.success },
  balanceWarning: { color: colors.danger },
  insufficientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  insufficientText: { color: colors.danger, flex: 1 },
});
