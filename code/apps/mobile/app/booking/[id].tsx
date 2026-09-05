import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Linking, StyleSheet, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { SocketEvents } from '@repo/shared';
import { bookingService } from '../../src/services/booking.service';
import { paymentService } from '../../src/services/payment.service';
import { authService } from '../../src/services/auth.service';
import { socketService } from '../../src/services/socket.service';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';
import { BottomSheetSurface } from '../../src/components/ui/BottomSheetSurface';
import { LiveBookingMap } from '../../src/features/booking/LiveBookingMap';
import { PassengerActiveBookingExperience } from '../../src/features/booking/PassengerActiveBookingExperience';
import { Star, Phone, ArrowLeft, MessageSquare, MapPin, CheckCircle2, Clock3, Navigation, CreditCard, AlertCircle } from 'lucide-react-native';
import { colors, radius, spacing } from '../../src/theme/tokens';
import { nativeShadows } from '../../src/theme/shadows';

const CANCEL_REASONS = [
  'Thay đổi lịch trình / Có việc đột xuất',
  'Tài xế đến quá lâu so với dự kiến',
  'Không thể liên lạc được với tài xế',
  'Đã tìm được phương tiện di chuyển khác',
  'Lý do cá nhân khác',
];

export default function BookingManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => authService.getCurrentUser(),
  });

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBookingById(id as string),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: 'CONFIRMED' | 'REJECTED') =>
      bookingService.updateBookingStatus(id as string, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['active-booking'] });
      Alert.alert('Thành công', status === 'CONFIRMED' ? 'Đã chấp nhận yêu cầu.' : 'Đã từ chối yêu cầu.');
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (reason?: string) =>
      bookingService.cancelBooking(id as string, reason || selectedReason || 'Hành khách chủ động hủy đặt chỗ'),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['booking', id] }),
        queryClient.invalidateQueries({ queryKey: ['active-booking'] }),
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['rides'] }),
      ]);
      setCancelSheetVisible(false);
      Alert.alert('Đã hủy đặt chỗ', 'Ghế đã được trả lại cho chuyến đi.');
    },
    onError: (error: any) => {
      Alert.alert('Không thể hủy', error.response?.data?.message || 'Vui lòng thử lại sau.');
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: () => paymentService.confirmSimulatorPayment(id as string),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['booking', id] });
      Alert.alert('Thanh toán thành công', data.message || 'Bạn có thể đánh giá chuyến đi.');
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán.');
    }
  });

  const createPaymentMutation = useMutation({
    mutationFn: () => paymentService.getSimulatorQr(id as string),
    onSuccess: async (data) => {
      const qrUrl = data?.data?.qrUrl;
      if (!qrUrl) {
        Alert.alert('Lỗi', 'Không nhận được mã QR thanh toán từ hệ thống.');
        return;
      }
      await Linking.openURL(qrUrl);
      Alert.alert('Thanh toán mô phỏng', 'Sau khi quét mã QR, hãy xác nhận thanh toán.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Tôi đã thanh toán', onPress: () => confirmPaymentMutation.mutate() },
      ]);
    },
    onError: () => Alert.alert('Lỗi', 'Không thể tạo mã QR thanh toán.'),
  });

  useEffect(() => {
    if (!id) return;
    const handleUpdate = (data?: any) => {
      if (!data || data.bookingId === id || data.id === id || data.rideId === booking?.rideId) {
        queryClient.invalidateQueries({ queryKey: ['booking', id] });
        queryClient.invalidateQueries({ queryKey: ['active-booking'] });
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        queryClient.invalidateQueries({ queryKey: ['rides'] });
      }
    };

    socketService.on(SocketEvents.BOOKING_DRIVER_ARRIVED, handleUpdate);
    socketService.on(SocketEvents.BOOKING_PICKED_UP, handleUpdate);
    socketService.on(SocketEvents.BOOKING_COMPLETED, handleUpdate);
    socketService.on(SocketEvents.RIDE_STATUS_UPDATED, handleUpdate);
    socketService.on(SocketEvents.RIDE_UPDATED, handleUpdate);
    socketService.on(SocketEvents.BOOKING_CONFIRMED, handleUpdate);
    socketService.on(SocketEvents.BOOKING_CANCELLED, handleUpdate);

    return () => {
      socketService.off(SocketEvents.BOOKING_DRIVER_ARRIVED, handleUpdate);
      socketService.off(SocketEvents.BOOKING_PICKED_UP, handleUpdate);
      socketService.off(SocketEvents.BOOKING_COMPLETED, handleUpdate);
      socketService.off(SocketEvents.RIDE_STATUS_UPDATED, handleUpdate);
      socketService.off(SocketEvents.RIDE_UPDATED, handleUpdate);
      socketService.off(SocketEvents.BOOKING_CONFIRMED, handleUpdate);
      socketService.off(SocketEvents.BOOKING_CANCELLED, handleUpdate);
    };
  }, [id, booking?.rideId, queryClient]);

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <AppText style={{ color: colors.textSecondary }}>Không tìm thấy thông tin đặt chỗ</AppText>
      </View>
    );
  }

  const isDriver = currentUser?.id === booking.ride.driverId;
  const isPassenger = currentUser?.id === booking.passengerId;
  const displayUser = isDriver ? booking.passenger : booking.ride.driver;

  // Header Title based on new requirement
  let headerTitle = 'Chi tiết đặt chỗ';
  if (isDriver) headerTitle = 'Yêu cầu đặt chỗ';
  else if (isPassenger) {
    if (booking.status === 'PENDING') headerTitle = 'Đang chờ xác nhận';
    else if (booking.status === 'CONFIRMED' && booking.ride.status !== 'ONGOING') headerTitle = 'Chuyến đi sắp tới';
    else if (booking.ride.status === 'ONGOING') headerTitle = 'Chuyến đi đang diễn ra';
    else if (booking.status === 'COMPLETED') headerTitle = 'Chuyến đi đã hoàn thành';
    else if (booking.status === 'CANCELLED') headerTitle = 'Chuyến đi đã hủy';
  }

  const formattedDate = booking.ride.departureTime ? format(new Date(booking.ride.departureTime), 'HH:mm · EEEE, dd/MM', { locale: vi }) : '';
  const isUnpaid = booking.paymentStatus === 'UNPAID';
  const isPaid = booking.paymentStatus === 'PAID';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isCompleted = booking.status === 'COMPLETED';
  const isPending = booking.status === 'PENDING';
  const isCancelled = booking.status === 'CANCELLED' || booking.status === 'REJECTED';

  const renderCancelModal = () => (
    <Modal
      visible={cancelSheetVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => setCancelSheetVisible(false)}
    >
      <Pressable style={styles.modalBackdrop} onPress={() => setCancelSheetVisible(false)}>
        <Pressable style={styles.modalContentWrapper} onPress={(e) => e.stopPropagation()}>
          <BottomSheetSurface style={{ paddingBottom: Math.max(insets.bottom, spacing.lg), padding: spacing.xl }}>
            <AppText variant="h2" weight="bold" style={{ marginBottom: 8 }}>Hủy đặt chỗ chuyến đi?</AppText>
            <AppText variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
              Ghế của bạn sẽ được trả lại cho tài xế và thông báo hủy sẽ được gửi ngay lập tức. Vui lòng chọn lý do hủy:
            </AppText>

            <View style={styles.reasonsList}>
              {CANCEL_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                    onPress={() => setSelectedReason(reason)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <AppText
                      variant="bodySmall"
                      weight={isSelected ? 'semibold' : 'normal'}
                      style={[styles.reasonText, isSelected && styles.reasonTextSelected]}
                    >
                      {reason}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <AppButton
                title="Giữ đặt chỗ"
                variant="outline"
                onPress={() => setCancelSheetVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <AppButton
                title="Xác nhận hủy"
                variant="danger"
                isLoading={cancelBookingMutation.isPending}
                disabled={cancelBookingMutation.isPending}
                onPress={() => cancelBookingMutation.mutate(selectedReason)}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </BottomSheetSurface>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (isPassenger && isConfirmed && booking.ride.status === 'ONGOING') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <PassengerActiveBookingExperience
          booking={booking}
          onBack={() => router.back()}
          onConfirmPayment={() => confirmPaymentMutation.mutate()}
          onOpenQrPayment={() => createPaymentMutation.mutate()}
          isConfirmingPayment={confirmPaymentMutation.isPending}
          isCreatingPayment={createPaymentMutation.isPending}
          onCancelBooking={() => {
            if (booking.isPickedUp) {
              Alert.alert(
                'Bạn đã lên xe',
                'Bạn hiện đang trên xe cùng tài xế. Nếu cần kết thúc chuyến sớm hoặc có sự cố, vui lòng trao đổi trực tiếp với tài xế hoặc gọi hotline 1900 6868.',
                [{ text: 'Đã hiểu', style: 'default' }]
              );
              return;
            }
            setCancelSheetVisible(true);
          }}
          isCancellingBooking={cancelBookingMutation.isPending}
        />
        {renderCancelModal()}
      </View>
    );
  }

  const renderHeroStatus = () => {
    let title = '';
    let subtitle = '';
    let color = colors.primary;
    let Icon = CheckCircle2;

    if (isPending) {
      title = 'Đang chờ xác nhận';
      subtitle = 'Tài xế đang xem xét yêu cầu đặt chỗ của bạn';
      color = colors.warning;
      Icon = Clock3;
    } else if (isConfirmed) {
      title = '✓ Đặt chỗ thành công';
      subtitle = 'Tài xế đã xác nhận chuyến đi';
      color = colors.success;
      Icon = CheckCircle2;
    } else if (isCompleted) {
      title = 'Chuyến đi hoàn thành';
      subtitle = 'Cảm ơn bạn đã sử dụng dịch vụ';
      color = colors.primary;
      Icon = CheckCircle2;
    } else if (isCancelled) {
      title = 'Đã hủy';
      subtitle = 'Chuyến đi hoặc đặt chỗ đã bị hủy';
      color = colors.danger;
      Icon = AlertCircle;
    }

    return (
      <View style={styles.heroSection}>
        <AppText variant="h2" weight="bold" style={{ color, marginBottom: 4 }}>{title}</AppText>
        <AppText variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: 12 }}>{subtitle}</AppText>
        <AppText variant="body" weight="semibold" style={{ color: colors.textPrimary }}>
          {formattedDate} • {booking.seats} ghế
        </AppText>
      </View>
    );
  };

  const renderDriverCard = () => (
    <View style={styles.card}>
      <AppText variant="caption" weight="bold" style={styles.cardLabel}>
        {isDriver ? 'HÀNH KHÁCH' : 'TÀI XẾ & PHƯƠNG TIỆN'}
      </AppText>
      <View style={styles.driverRow}>
        <View style={styles.avatarContainer}>
          {displayUser.avatarUrl || displayUser.avatar ? (
            <Image source={{ uri: displayUser.avatarUrl || displayUser.avatar }} style={styles.avatar} />
          ) : (
            <AppText variant="h3" weight="bold" style={{ color: colors.primary }}>
              {displayUser.firstName?.charAt(0) || 'U'}
            </AppText>
          )}
        </View>
        <View style={styles.driverInfo}>
          <AppText variant="body" weight="bold" style={{ color: colors.textPrimary }}>
            {displayUser.firstName} {displayUser.lastName}
          </AppText>
          <View style={styles.driverRatingRow}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <AppText variant="caption" weight="bold" style={{ marginLeft: 4, marginRight: 8, color: colors.textPrimary }}>
              {displayUser.rating?.toFixed(1) || '5.0'}
            </AppText>
          </View>
          {(!isDriver && (booking.ride.vehicle || displayUser.vehicle)) && (
            <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
              {booking.ride.vehicle?.color || displayUser.vehicle?.color} • {booking.ride.vehicle?.licensePlate || displayUser.vehicle?.licensePlate}
            </AppText>
          )}
        </View>
        <View style={styles.driverActions}>
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={() => router.push({
              pathname: `/chat/${booking.rideId}` as any,
              params: {
                rideId: booking.rideId,
                otherUserId: displayUser.id,
                otherUserName: `${displayUser.firstName} ${displayUser.lastName}`
              }
            })}
          >
            <MessageSquare size={18} color={colors.primary} />
          </TouchableOpacity>
          {displayUser.phone && (
            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={() => Linking.openURL(`tel:${displayUser.phone}`)}
            >
              <Phone size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderRouteCard = () => (
    <View style={styles.card}>
      <AppText variant="caption" weight="bold" style={styles.cardLabel}>LỘ TRÌNH</AppText>
      <View style={styles.routeContainer}>
        <View style={styles.routeTimeline}>
          <View style={styles.routeDotTop} />
          <View style={styles.routeLine} />
          <MapPin size={16} color={colors.danger} fill={colors.dangerSoft} />
        </View>
        <View style={styles.routeDetails}>
          <View style={styles.routePoint}>
            <AppText variant="body" weight="semibold" style={{ color: colors.textPrimary }}>
              {booking.pickupAddress || booking.ride.origin}
            </AppText>
          </View>
          <View style={styles.routeDistance}>
            {(booking.ride.distanceKm || booking.ride.distance) ? (
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                {booking.ride.distanceKm || booking.ride.distance} km
                {booking.ride.durationMinutes ? ` • khoảng ${booking.ride.durationMinutes} phút` : (booking.ride.duration ? ` • khoảng ${booking.ride.duration} phút` : '')}
              </AppText>
            ) : (
              <AppText variant="caption" style={{ color: colors.textSecondary }}>Lộ trình chuyến đi</AppText>
            )}
          </View>
          <View style={styles.routePoint}>
            <AppText variant="body" weight="semibold" style={{ color: colors.textPrimary }}>
              {booking.dropoffAddress || booking.ride.destination}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPaymentCard = () => (
    <View style={styles.card}>
      <AppText variant="caption" weight="bold" style={styles.cardLabel}>THANH TOÁN</AppText>
      <View style={styles.paymentRow}>
        <AppText variant="body" style={{ color: colors.textSecondary }}>Tổng cộng</AppText>
        <AppText variant="h3" weight="bold" style={{ color: colors.textPrimary }}>
          {(booking.totalPrice || 0).toLocaleString('vi-VN')}đ
        </AppText>
      </View>
      <View style={styles.paymentStatusRow}>
        {isPaid ? (
          <View style={styles.paymentBadgeSuccess}>
            <CheckCircle2 size={14} color={colors.success} style={{ marginRight: 4 }} />
            <AppText variant="caption" weight="semibold" style={{ color: colors.success }}>Đã thanh toán</AppText>
          </View>
        ) : (
          <View style={styles.paymentBadgeWarning}>
            <AlertCircle size={14} color={colors.warning} style={{ marginRight: 4 }} />
            <AppText variant="caption" weight="semibold" style={{ color: colors.warning }}>Chưa thanh toán</AppText>
          </View>
        )}
      </View>
      {isPassenger && isUnpaid && (isConfirmed || isCompleted) && (
        <AppButton
          title={`Thanh toán ${(booking.totalPrice || 0).toLocaleString('vi-VN')}đ`}
          variant="passenger"
          onPress={() => createPaymentMutation.mutate()}
          disabled={createPaymentMutation.isPending || confirmPaymentMutation.isPending}
          className="mt-4 w-full"
          leftIcon={<CreditCard size={18} color="white" style={{ marginRight: 8 }} />}
        />
      )}
    </View>
  );

  const renderBookingInfoCard = () => (
    <View style={styles.card}>
      <AppText variant="caption" weight="bold" style={styles.cardLabel}>THÔNG TIN ĐẶT CHỖ</AppText>
      <View style={styles.infoRow}>
        <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>Mã đặt chỗ</AppText>
        <AppText variant="bodySmall" weight="semibold" style={{ color: colors.textPrimary }}>
          CR-{booking.id.slice(0, 6).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.infoRow}>
        <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>Loại chuyến</AppText>
        <AppText variant="bodySmall" weight="semibold" style={{ color: colors.textPrimary }}>
          Carpooling
        </AppText>
      </View>
      <View style={styles.infoRow}>
        <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>Số ghế</AppText>
        <AppText variant="bodySmall" weight="semibold" style={{ color: colors.textPrimary }}>
          {booking.seats}
        </AppText>
      </View>
      <View style={styles.infoRow}>
        <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>Ngày đặt</AppText>
        <AppText variant="bodySmall" weight="semibold" style={{ color: colors.textPrimary }}>
          {format(new Date(booking.createdAt || new Date()), 'dd/MM/yyyy HH:mm')}
        </AppText>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold" style={styles.headerTitle} accessibilityRole="header">{headerTitle}</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isPassenger && renderHeroStatus()}

        {isPassenger && isConfirmed && booking.ride.status === 'ONGOING' && (
          <View style={styles.mapContainer}>
            <LiveBookingMap booking={booking} />
            <View style={styles.liveIndicatorBadge}>
              <View style={styles.liveDot} />
              <AppText variant="caption" weight="bold" style={{ color: 'white', marginLeft: 4 }}>TRỰC TIẾP</AppText>
            </View>
          </View>
        )}

        {isPassenger && renderRouteCard()}
        
        {/* Driver Card with improved accessibility */}
        <View style={styles.card}>
          <AppText variant="caption" weight="bold" style={styles.cardLabel}>
            {isDriver ? 'HÀNH KHÁCH' : 'TÀI XẾ & PHƯƠNG TIỆN'}
          </AppText>
          <View style={styles.driverRow}>
            <View style={styles.avatarContainer}>
              {displayUser.avatarUrl || displayUser.avatar ? (
                <Image source={{ uri: displayUser.avatarUrl || displayUser.avatar }} style={styles.avatar} />
              ) : (
                <AppText variant="h3" weight="bold" style={{ color: colors.primary }}>
                  {displayUser.firstName?.charAt(0) || 'U'}
                </AppText>
              )}
            </View>
            <View style={styles.driverInfo}>
              <AppText variant="body" weight="bold" style={{ color: colors.textPrimary }}>
                {displayUser.firstName} {displayUser.lastName}
              </AppText>
              <View style={styles.driverRatingRow}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <AppText variant="caption" weight="bold" style={{ marginLeft: 4, marginRight: 8, color: colors.textPrimary }}>
                  {displayUser.rating?.toFixed(1) || '5.0'}
                </AppText>
              </View>
              {(!isDriver && (booking.ride.vehicle || displayUser.vehicle)) && (
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                  {booking.ride.vehicle?.color || displayUser.vehicle?.color} • {booking.ride.vehicle?.licensePlate || displayUser.vehicle?.licensePlate}
                </AppText>
              )}
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity
                style={styles.actionIconButton}
                accessibilityRole="button"
                accessibilityLabel="Nhắn tin"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => router.push({
                  pathname: `/chat/${booking.rideId}` as any,
                  params: {
                    rideId: booking.rideId,
                    otherUserId: displayUser.id,
                    otherUserName: `${displayUser.firstName} ${displayUser.lastName}`
                  }
                })}
              >
                <MessageSquare size={20} color={colors.primary} />
              </TouchableOpacity>
              {displayUser.phone && (
                <TouchableOpacity
                  style={styles.actionIconButton}
                  accessibilityRole="button"
                  accessibilityLabel="Gọi điện thoại"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => Linking.openURL(`tel:${displayUser.phone}`)}
                >
                  <Phone size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {renderPaymentCard()}
        {renderBookingInfoCard()}

        {isPassenger && (isConfirmed || isPending) && !isCancelled && (
          <TouchableOpacity
            style={styles.cancelButton}
            accessibilityRole="button"
            onPress={() => setCancelSheetVisible(true)}
          >
            <AppText variant="bodySmall" weight="semibold" style={{ color: colors.danger }}>
              Hủy đặt chỗ
            </AppText>
          </TouchableOpacity>
        )}
      </ScrollView>

      {isDriver && isPending && (
        <View style={styles.driverActionsBar}>
          <AppButton
            title="Từ chối"
            variant="outline"
            onPress={() => updateStatusMutation.mutate('REJECTED')}
            disabled={updateStatusMutation.isPending}
            className="flex-1 mr-2"
            textClassName="text-rejected"
          />
          <AppButton
            title="Chấp nhận"
            variant="driver"
            onPress={() => updateStatusMutation.mutate('CONFIRMED')}
            disabled={updateStatusMutation.isPending}
            className="flex-1 ml-2"
          />
        </View>
      )}

      {isPassenger && isCompleted && isPaid && (
        <View style={styles.bottomCtaBar}>
          <AppButton
            title="Đánh giá chuyến đi"
            variant="secondary"
            leftIcon={<Star size={20} color={colors.primary} style={{ marginRight: 8 }} />}
            onPress={() => router.push({
              pathname: '/review-modal' as any,
              params: { rideId: booking.rideId, revieweeId: displayUser.id },
            })}
            className="w-full"
          />
        </View>
      )}

      {renderCancelModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    ...nativeShadows.card,
    zIndex: 10,
  },
  backButton: {
    width: 48, // Updated UX target
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...nativeShadows.card,
  },
  cardLabel: {
    color: colors.textTertiary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56, // Slightly larger avatar
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  driverInfo: {
    flex: 1,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  driverActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconButton: {
    width: 48, // Upgraded UX target
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeContainer: {
    flexDirection: 'row',
  },
  routeTimeline: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  routeDotTop: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  routeDetails: {
    flex: 1,
  },
  routePoint: {
    minHeight: 24,
    justifyContent: 'center',
  },
  routeDistance: {
    paddingVertical: 16,
    justifyContent: 'center',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentStatusRow: {
    flexDirection: 'row',
  },
  paymentBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentBadgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  cancelButton: {
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  driverActionsBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bottomCtaBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  mapContainer: {
    height: 280, // Increased map size for ongoing ride
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    ...nativeShadows.card,
  },
  liveIndicatorBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContentWrapper: {
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  reasonsList: {
    marginBottom: 20,
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  reasonOptionSelected: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: colors.danger,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  reasonText: {
    color: colors.textPrimary,
    flex: 1,
  },
  reasonTextSelected: {
    color: colors.danger,
  },
});
