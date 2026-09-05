import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  MapPin,
  MessageCircle,
  MoreVertical,
  Navigation,
  Phone,
  Route,
  Users,
  Wallet,
  X,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { AppButton } from '../../../src/components/ui/AppButton';
import { AppText } from '../../../src/components/ui/AppText';
import { RideMap } from '../../../src/components/RideMap';
import { bookingService } from '../../../src/services/booking.service';
import { rideService } from '../../../src/services/ride.service';
import { socketService } from '../../../src/services/socket.service';
import { colors, radius, spacing, typography } from '../../../src/theme/tokens';
import { SocketEvents } from '@repo/shared';
import { showInfoDialog } from '../../../src/utils/dialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const currency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

const rideStatusMeta = (status: string) => {
  switch (status) {
    case 'SCHEDULED': return { label: 'Sắp diễn ra', color: colors.warning, bg: '#FFFBEB' };
    case 'FULL': return { label: 'Đã đủ khách', color: colors.navigationDriver, bg: colors.driverAccentSoft };
    case 'ONGOING': return { label: 'Đang di chuyển', color: colors.navigationDriver, bg: colors.driverAccentSoft };
    case 'COMPLETED': return { label: 'Hoàn thành', color: colors.textTertiary, bg: colors.surfaceMuted };
    case 'CANCELLED': return { label: 'Đã hủy', color: colors.danger, bg: colors.dangerSoft };
    default: return { label: status, color: colors.textSecondary, bg: colors.surfaceMuted };
  }
};

const passengerStatusMeta = (booking: any) => {
  if (booking.status === 'CANCELLED') return { label: 'Đã hủy', color: colors.danger };
  if (booking.isDroppedOff) return { label: 'Đã trả', color: colors.textTertiary };
  if (booking.isPickedUp) return { label: 'Đã đón', color: colors.success };
  if (booking.status === 'CONFIRMED') return { label: 'Chờ đón', color: colors.warning };
  return { label: 'Chờ duyệt', color: colors.textSecondary };
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DriverTripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [menuVisible, setMenuVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Queries
  const { data: ride, isLoading: isRideLoading } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => rideService.getRideById(id as string),
    enabled: !!id,
  });

  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['driver-bookings'],
    queryFn: bookingService.getDriverBookings,
  });

  // Derived State
  const rideBookings = useMemo(
    () => (bookingsData?.bookings ?? []).filter((b) => b.ride.id === id),
    [bookingsData, id],
  );

  const confirmedBookings = useMemo(
    () => rideBookings.filter((b) => b.status === 'CONFIRMED'),
    [rideBookings],
  );

  const estimatedEarnings = useMemo(
    () => confirmedBookings.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0),
    [confirmedBookings],
  );

  const allStops = useMemo(() => {
    if (!ride) return [];
    return [
      { id: '__origin__', name: 'Điểm xuất phát', address: ride.departure ?? ride.origin ?? '', order: -1, type: 'ORIGIN' },
      ...(ride.stops ?? []).map(s => ({ ...s, type: 'WAYPOINT' })),
      { id: '__dest__', name: 'Điểm đến', address: ride.destination ?? '', order: 9999, type: 'DESTINATION' },
    ].sort((a, b) => a.order - b.order);
  }, [ride]);

  const nextStop = useMemo(() => {
    if (ride?.status !== 'ONGOING') return null;
    for (const stop of allStops) {
      // Is this stop a pending pickup?
      const pickupsHere = confirmedBookings.filter(b => !b.isPickedUp && (b.pickupAddress === stop.address || (stop.type === 'ORIGIN' && !b.pickupAddress)));
      if (pickupsHere.length > 0) return { ...stop, action: 'PICKUP', passengers: pickupsHere };
      
      // Is this stop a pending dropoff?
      const dropoffsHere = confirmedBookings.filter(b => b.isPickedUp && !b.isDroppedOff && (b.dropoffAddress === stop.address || (stop.type === 'DESTINATION' && !b.dropoffAddress)));
      if (dropoffsHere.length > 0) return { ...stop, action: 'DROPOFF', passengers: dropoffsHere };
    }
    // If all passengers dropped off but ride still ONGOING, next stop is destination
    return { ...allStops[allStops.length - 1], action: 'FINISH', passengers: [] };
  }, [allStops, confirmedBookings, ride?.status]);

  // Mutations
  const statusMutation = useMutation({
    mutationFn: (status: 'ONGOING' | 'COMPLETED' | 'CANCELLED') =>
      rideService.updateRideStatus(id as string, status, cancelReason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ride', id] });
      void queryClient.invalidateQueries({ queryKey: ['my-driver-rides'] });
      void queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message ?? 'Không thể cập nhật trạng thái');
    },
  });

  const confirmPickupMutation = useMutation({
    mutationFn: (bookingId: string) => bookingService.confirmPickup(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message ?? 'Không thể xác nhận đón khách');
    }
  });

  const dropoffMutation = useMutation({
    mutationFn: (bookingId: string) => bookingService.dropoffPassenger(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message ?? 'Không thể xác nhận trả khách');
    }
  });

  // Effects
  useEffect(() => {
    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ['ride', id] });
      void queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
    };

    socketService.on(SocketEvents.RIDE_STATUS_UPDATED, handleUpdate);
    socketService.on(SocketEvents.BOOKING_PICKED_UP, handleUpdate);
    socketService.on(SocketEvents.RIDE_UPDATED, handleUpdate);

    return () => {
      socketService.off(SocketEvents.RIDE_STATUS_UPDATED, handleUpdate);
      socketService.off(SocketEvents.BOOKING_PICKED_UP, handleUpdate);
      socketService.off(SocketEvents.RIDE_UPDATED, handleUpdate);
    };
  }, [id, queryClient]);

  // Handlers
  const handleStartRide = () => {
    statusMutation.mutate('ONGOING');
  };

  const handleCompleteRide = () => {
    statusMutation.mutate('COMPLETED');
  };

  const handleCancelRide = () => {
    if (!cancelReason.trim()) {
      Alert.alert('Vui lòng nhập lý do hủy chuyến');
      return;
    }
    setCancelDialogVisible(false);
    statusMutation.mutate('CANCELLED');
  };

  const openNavigation = (address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  // Render
  if (isRideLoading || !ride) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navigationDriver} />
        <AppText variant="bodySmall" style={styles.loadingText}>Đang tải thông tin chuyến...</AppText>
      </View>
    );
  }

  const statusMeta = rideStatusMeta(ride.status ?? '');
  const hasCoords = ride.departureCoords && ride.destinationCoords;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <AppText weight="semibold" style={styles.headerTitle}>Chi tiết chuyến đi</AppText>
        <Pressable onPress={() => setMenuVisible(true)} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
          <MoreVertical size={20} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        
        {/* TRIP STATUS / NEXT STOP */}
        {ride.status === 'ONGOING' && nextStop ? (
          <View style={styles.nextStopCard}>
            <AppText variant="caption" weight="bold" className="text-white/70" style={styles.nextStopHeader}>ĐIỂM TIẾP THEO</AppText>
            <View style={styles.nextStopContent}>
              <View style={styles.nextStopIcon}>
                <Navigation size={24} color={colors.surface} strokeWidth={2} />
              </View>
              <View style={styles.nextStopInfo}>
                <AppText weight="bold" className="text-white" style={styles.nextStopTitle}>
                  {nextStop.action === 'PICKUP' ? 'Đón khách' : nextStop.action === 'DROPOFF' ? 'Trả khách' : 'Điểm đến cuối'}
                </AppText>
                <AppText variant="bodySmall" numberOfLines={2} className="text-white/90" style={styles.nextStopAddress}>
                  {nextStop.name && nextStop.name !== nextStop.address ? `${nextStop.name} — ` : ''}{nextStop.address}
                </AppText>
              </View>
            </View>
            <View style={styles.nextStopActions}>
              <AppButton 
                title="Mở chỉ đường" 
                variant="outline" 
                size="sm"
                onPress={() => openNavigation(nextStop.address)}
                style={styles.btnFlex}
              />
              {nextStop.passengers.length > 0 && nextStop.passengers.map(p => (
                <AppButton 
                  key={p.id}
                  title={nextStop.action === 'PICKUP' ? `Đã đón ${p.passenger.firstName}` : `Đã trả ${p.passenger.firstName}`}
                  variant="driver" 
                  size="sm"
                  onPress={() => nextStop.action === 'PICKUP' ? confirmPickupMutation.mutate(p.id) : dropoffMutation.mutate(p.id)}
                  style={styles.btnFlex}
                  isLoading={confirmPickupMutation.isPending || dropoffMutation.isPending}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.statusSection}>
            <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
              <AppText weight="semibold" style={{ color: statusMeta.color }}>
                {statusMeta.label}
              </AppText>
            </View>
            {(ride.status === 'SCHEDULED' || ride.status === 'FULL') && (
              <AppText variant="bodySmall" weight="medium" style={styles.timeText}>
                {format(new Date(ride.departureTime), 'HH:mm · EEE dd/MM', { locale: vi })}
              </AppText>
            )}
          </View>
        )}

        {/* COMPACT MAP */}
        {hasCoords ? (
          <RideMap
            departureCoords={ride.departureCoords!}
            destinationCoords={ride.destinationCoords!}
            encodedPolyline={ride.routePolyline}
            containerStyle={styles.mapContainer}
          />
        ) : (
          <View style={styles.mapContainer}>
            <View style={styles.mapPlaceholder}>
              <Route size={28} color={colors.textTertiary} strokeWidth={1.5} />
              <AppText variant="caption" style={{ color: colors.textTertiary, marginTop: 8 }}>Không có dữ liệu bản đồ</AppText>
            </View>
          </View>
        )}

        {/* TIMELINE HÀNH TRÌNH */}
        <View style={styles.section}>
          <AppText weight="semibold" style={styles.sectionTitle}>Hành trình</AppText>
          <View style={styles.timelineCard}>
            {allStops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === allStops.length - 1;
              const isNext = nextStop?.id === stop.id;
              
              // Evaluate status
              let state: 'COMPLETED' | 'ACTIVE' | 'UPCOMING' = 'UPCOMING';
              if (ride.status === 'COMPLETED') state = 'COMPLETED';
              else if (ride.status === 'ONGOING') {
                if (stop.order < (nextStop?.order ?? 9999)) state = 'COMPLETED';
                else if (isNext) state = 'ACTIVE';
              }

              return (
                <View key={stop.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      state === 'COMPLETED' && styles.timelineDotCompleted,
                      state === 'ACTIVE' && styles.timelineDotActive,
                    ]}>
                      {state === 'COMPLETED' && <CheckCircle2 size={12} color="#fff" strokeWidth={3} />}
                    </View>
                    {!isLast && <View style={[styles.timelineLine, state === 'COMPLETED' && styles.timelineLineCompleted]} />}
                  </View>
                  <View style={styles.timelineRight}>
                    <AppText 
                      weight={state === 'ACTIVE' ? 'bold' : 'medium'} 
                      style={[
                        styles.timelineAddress, 
                        state === 'COMPLETED' && styles.textMuted,
                        state === 'ACTIVE' && styles.textActive
                      ]}
                      numberOfLines={2}
                    >
                      {stop.name && stop.name !== stop.address ? `${stop.name} — ` : ''}{stop.address}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* PASSENGERS */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppText weight="semibold" style={styles.sectionTitle}>Hành khách</AppText>
            <AppText variant="caption" style={styles.passengerCount}>
              {confirmedBookings.length}/{ride.totalSeats} ghế
            </AppText>
          </View>
          
          {rideBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Users size={32} color={colors.textTertiary} strokeWidth={1.5} />
              <AppText variant="bodySmall" style={{ color: colors.textTertiary, marginTop: 8 }}>Chưa có hành khách đặt chỗ</AppText>
            </View>
          ) : (
            <View style={styles.passengersList}>
              {rideBookings.map((booking) => {
                const name = [booking.passenger.firstName, booking.passenger.lastName].filter(Boolean).join(' ') || 'Khách hàng';
                const statusInfo = passengerStatusMeta(booking);
                
                return (
                  <View key={booking.id} style={styles.passengerCard}>
                    <View style={styles.passengerRow}>
                      <View style={styles.avatar}>
                        <AppText weight="bold" style={{ color: colors.navigationDriver }}>{name.charAt(0).toUpperCase()}</AppText>
                      </View>
                      <View style={styles.passengerInfo}>
                        <AppText weight="bold" numberOfLines={1}>{name}</AppText>
                        <AppText variant="caption" style={{ color: colors.textSecondary }}>
                          {booking.seats} ghế · {statusInfo.label}
                        </AppText>
                      </View>
                      <View style={styles.passengerActions}>
                        <Pressable onPress={() => Linking.openURL(`tel:${booking.passenger.phone}`)} style={styles.actionBtn}>
                          <Phone size={18} color={colors.textSecondary} />
                        </Pressable>
                        <Pressable style={styles.actionBtn}>
                          <MessageCircle size={18} color={colors.textSecondary} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.passengerLocations}>
                      <AppText variant="caption" numberOfLines={1} style={styles.locText}>
                        <AppText variant="caption" weight="bold">Đón: </AppText>{booking.pickupAddress}
                      </AppText>
                      <AppText variant="caption" numberOfLines={1} style={styles.locText}>
                        <AppText variant="caption" weight="bold">Trả: </AppText>{booking.dropoffAddress}
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* TRIP INFO */}
        <View style={styles.section}>
          <AppText weight="semibold" style={styles.sectionTitle}>Thông tin chuyến</AppText>
          <View style={styles.infoGrid}>
            <View style={styles.infoCell}>
              <AppText variant="caption" style={styles.infoLabel}>Quãng đường</AppText>
              <AppText weight="bold" style={styles.infoValue}>{ride.originDistanceKm ? `${ride.originDistanceKm} km` : '—'}</AppText>
            </View>
            <View style={styles.infoCell}>
              <AppText variant="caption" style={styles.infoLabel}>Thời gian xuất phát</AppText>
              <AppText weight="bold" style={styles.infoValue}>{format(new Date(ride.departureTime), 'HH:mm')}</AppText>
            </View>
            <View style={styles.infoCell}>
              <AppText variant="caption" style={styles.infoLabel}>Ghế đã đặt</AppText>
              <AppText weight="bold" style={styles.infoValue}>{ride.totalSeats - ride.availableSeats}/{ride.totalSeats}</AppText>
            </View>
            <View style={styles.infoCell}>
              <AppText variant="caption" style={styles.infoLabel}>Mỗi ghế</AppText>
              <AppText weight="bold" style={styles.infoValue}>{currency(ride.price ?? 0)}</AppText>
            </View>
          </View>
        </View>

        {/* EARNINGS */}
        <View style={styles.section}>
          <AppText weight="semibold" style={styles.sectionTitle}>Thu nhập dự kiến</AppText>
          <View style={styles.earningsCard}>
            <AppText variant="h2" weight="bold" style={{ color: colors.navigationDriver }}>
              {currency(estimatedEarnings)}
            </AppText>
            <AppText variant="caption" style={{ color: colors.textSecondary }}>
              {confirmedBookings.length} hành khách × {currency(ride.price ?? 0)}
            </AppText>
          </View>
        </View>

      </ScrollView>

      {/* STICKY PRIMARY ACTION */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {(ride.status === 'SCHEDULED' || ride.status === 'FULL') && (
          <AppButton
            title="Bắt đầu hành trình"
            variant="driver"
            isLoading={statusMutation.isPending}
            onPress={handleStartRide}
          />
        )}
        {ride.status === 'ONGOING' && (
           <AppButton
            title={nextStop?.action === 'FINISH' ? "Hoàn thành chuyến đi" : "Mở bản đồ điều hành"}
            variant="driver"
            isLoading={statusMutation.isPending}
            onPress={() => {
               if (nextStop?.action === 'FINISH') {
                 handleCompleteRide();
               } else {
                 router.push('/ride/active-ride' as never);
               }
            }}
          />
        )}
      </View>

      {/* MENU MODAL */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <AppText weight="bold" style={styles.sheetTitle}>Tùy chọn chuyến đi</AppText>
            
            {(ride.status === 'SCHEDULED' || ride.status === 'FULL') && (
              <Pressable style={styles.menuItem} onPress={() => {
                setMenuVisible(false);
                setCancelDialogVisible(true);
              }}>
                <X size={20} color={colors.danger} />
                <AppText weight="semibold" style={{ color: colors.danger, marginLeft: 12 }}>Hủy chuyến</AppText>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* CANCEL MODAL */}
      <Modal visible={cancelDialogVisible} transparent animationType="fade" onRequestClose={() => setCancelDialogVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.cancelDialog, { paddingBottom: insets.bottom + 16 }]}>
            <AppText weight="bold" style={styles.cancelTitle}>Hủy chuyến này?</AppText>
            <AppText variant="bodySmall" style={styles.cancelDesc}>
              {confirmedBookings.length > 0
                ? `${confirmedBookings.length} hành khách đã đặt chỗ sẽ bị ảnh hưởng. Hệ thống sẽ thông báo cho họ.`
                : 'Chuyến đi sẽ bị hủy và xóa khỏi danh sách tìm kiếm.'}
            </AppText>
            
            {['Khách hàng yêu cầu hủy', 'Xe gặp sự cố', 'Lý do cá nhân'].map((reason) => (
              <Pressable key={reason} style={styles.reasonBtn} onPress={() => setCancelReason(reason)}>
                <View style={[styles.radio, cancelReason === reason && styles.radioActive]}>
                  {cancelReason === reason && <View style={styles.radioDot} />}
                </View>
                <AppText style={cancelReason === reason ? { fontWeight: '600' } : undefined}>{reason}</AppText>
              </Pressable>
            ))}

            <View style={styles.cancelActions}>
              <AppButton title="Giữ chuyến" variant="outline" onPress={() => setCancelDialogVisible(false)} style={styles.btnFlex} />
              <AppButton title="Hủy chuyến" variant="ghost" onPress={handleCancelRide} isLoading={statusMutation.isPending} style={[styles.btnFlex, { backgroundColor: colors.dangerSoft }]} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  headerBtn: {
    padding: 8,
    marginHorizontal: -8,
  },
  headerTitle: {
    fontSize: 18,
  },
  pressed: {
    opacity: 0.7,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 4,
  },
  timeText: {
    color: colors.textSecondary,
  },
  nextStopCard: {
    backgroundColor: colors.navigationDriver,
    margin: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  nextStopHeader: {
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  nextStopContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  nextStopIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextStopInfo: {
    flex: 1,
  },
  nextStopTitle: {
    color: colors.surface,
    fontSize: 20,
    marginBottom: 4,
  },
  nextStopAddress: {
    color: 'rgba(255,255,255,0.9)',
  },
  nextStopActions: {
    flexDirection: 'row',
    gap: 12,
  },
  mapContainer: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    marginBottom: 24,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  passengerCount: {
    color: colors.textSecondary,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    borderWidth: 2,
    borderColor: colors.surface,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotCompleted: {
    backgroundColor: colors.success,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 0,
  },
  timelineDotActive: {
    backgroundColor: colors.navigationDriver,
    borderColor: colors.driverAccentSoft,
    borderWidth: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: -4,
    zIndex: 1,
  },
  timelineLineCompleted: {
    backgroundColor: colors.success,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
  },
  timelineAddress: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  textMuted: {
    color: colors.textTertiary,
  },
  textActive: {
    color: colors.navigationDriver,
  },
  passengersList: {
    gap: 12,
  },
  passengerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.driverAccentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerLocations: {
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  locText: {
    color: colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCell: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
  },
  infoLabel: {
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  earningsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
  },
  cancelDialog: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  cancelTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  cancelDesc: {
    color: colors.textSecondary,
    marginBottom: 24,
  },
  reasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: colors.danger,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  cancelActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  btnFlex: {
    flex: 1,
  },
});
