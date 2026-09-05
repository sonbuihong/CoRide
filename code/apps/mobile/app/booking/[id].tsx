import React from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Linking, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingService } from '../../src/services/booking.service';
import { paymentService } from '../../src/services/payment.service';
import { authService } from '../../src/services/auth.service';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { LiveBookingMap } from '../../src/features/booking/LiveBookingMap';
import { Star, Phone, CreditCard, ArrowLeft, Mail, MessageSquare } from 'lucide-react-native';

export default function BookingManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

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
      Alert.alert(
        'Thành công',
        status === 'CONFIRMED' ? 'Đã chấp nhận yêu cầu.' : 'Đã từ chối yêu cầu.',
      );
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  });

  const cancelBookingMutation = useMutation({
    mutationFn: () => bookingService.cancelBooking(id as string, 'Hành khách chủ động hủy đặt chỗ'),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['booking', id] }),
        queryClient.invalidateQueries({ queryKey: ['active-booking'] }),
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['rides'] }),
      ]);
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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <AppText className="text-text-secondary">Không tìm thấy thông tin đặt chỗ</AppText>
      </View>
    );
  }

  const isDriver = currentUser?.id === booking.ride.driverId;
  const isPassenger = currentUser?.id === booking.passengerId;
  const displayUser = isDriver ? booking.passenger : booking.ride.driver;
  const title = isDriver ? 'Yêu cầu đặt chỗ' : 'Chi tiết đặt chỗ';

  return (
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
      {/* Header — shadow elevation thay vi border-b nhat */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold" className="text-text-primary flex-1">{title}</AppText>
      </View>

      {isPassenger && booking.status === 'CONFIRMED' && booking.ride.status === 'ONGOING' ? (
        <LiveBookingMap booking={booking} />
      ) : null}

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* The card tai xe / hanh khach */}
        <View className="bg-surface p-5 rounded-3xl border border-border/40 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <AppText variant="bodySmall" weight="semibold" className="text-text-secondary">
              {isDriver ? 'Hành khách đặt xe' : 'Tài xế của bạn'}
            </AppText>
            <StatusBadge status={booking.status} />
          </View>

          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-passenger-soft rounded-full items-center justify-center mr-4 border border-passenger/10 overflow-hidden">
              {displayUser.avatarUrl || displayUser.avatar ? (
                <Image source={{ uri: displayUser.avatarUrl || displayUser.avatar }} className="w-full h-full" />
              ) : (
                <AppText variant="h3" weight="bold" className="text-passenger">
                  {displayUser.firstName?.charAt(0) || 'U'}
                </AppText>
              )}
            </View>
            <View className="flex-1">
              <AppText variant="body" weight="bold" className="text-text-primary">
                {displayUser.firstName} {displayUser.lastName}
              </AppText>
              <View className="flex-row items-center mt-1">
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <AppText variant="caption" weight="bold" className="text-driver ml-1 mr-2">
                  {displayUser.rating?.toFixed(1) || '5.0'}
                </AppText>
                {displayUser.ratingCount !== undefined && (
                  <AppText variant="caption" className="text-text-secondary">
                    ({displayUser.ratingCount} đánh giá)
                  </AppText>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push({
                pathname: `/chat/${booking.rideId}` as any,
                params: {
                  rideId: booking.rideId,
                  otherUserId: displayUser.id,
                  otherUserName: `${displayUser.firstName} ${displayUser.lastName}`
                }
              })}
              className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center border border-blue-100 ml-3 shadow-sm active:bg-blue-100"
              accessibilityLabel="Nhắn tin"
            >
              <MessageSquare size={18} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chi tiet dat cho */}
        <View className="bg-surface p-5 rounded-3xl border border-border/40 shadow-sm mb-6">
          <AppText variant="bodySmall" weight="semibold" className="text-text-secondary mb-4">Chi tiết yêu cầu</AppText>

          <View className="space-y-4">
            <View className="flex-row justify-between py-3 border-b border-slate-100">
              <AppText className="text-text-secondary">Số ghế đặt</AppText>
              <AppText weight="bold" className="text-text-primary">{booking.seats} ghế</AppText>
            </View>

            <View className="flex-row justify-between py-3 border-b border-slate-100">
              <AppText className="text-text-secondary">Tổng chi phí</AppText>
              <AppText weight="bold" className="text-passenger">
                {(booking.totalPrice || 0).toLocaleString('vi-VN')}đ
              </AppText>
            </View>

            <View className="flex-row justify-between py-3 border-b border-slate-100">
              <AppText className="text-text-secondary">Trạng thái thanh toán</AppText>
              <AppText weight="bold" className={booking.paymentStatus === 'PAID' ? 'text-confirmed' : 'text-pending'}>
                {booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </AppText>
            </View>

            {displayUser.phone && booking.status === 'CONFIRMED' && (
              <View className="flex-row justify-between py-3 border-b border-slate-100">
                <AppText className="text-text-secondary">Số điện thoại</AppText>
                <View className="flex-row items-center">
                  <Phone size={14} color="#64748B" />
                  <AppText weight="semibold" className="text-text-primary ml-1">{displayUser.phone}</AppText>
                </View>
              </View>
            )}

            {displayUser.email && booking.status === 'CONFIRMED' && (
              <View className="flex-row justify-between py-3">
                <AppText className="text-text-secondary">Địa chỉ email</AppText>
                <View className="flex-row items-center">
                  <Mail size={14} color="#64748B" />
                  <AppText weight="semibold" className="text-text-primary ml-1">{displayUser.email}</AppText>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Thong tin lo trinh */}
        <AppText variant="bodySmall" weight="bold" className="text-text-secondary uppercase mb-3 ml-2">Thông tin lộ trình</AppText>
        <View className="bg-surface p-5 rounded-3xl border border-border/40 shadow-sm mb-10">
          <AppText variant="body" weight="bold" className="text-text-primary mb-2">
            Đích đến: {booking.ride.destination}
          </AppText>
          <View className="flex-row items-center">
            <AppText variant="bodySmall" className="text-text-secondary">
              Khởi hành từ: <AppText weight="bold" className="text-text-primary">{booking.ride.origin}</AppText>
            </AppText>
          </View>
        </View>
      </ScrollView>

      {isDriver && booking.status === 'PENDING' && (
        <View className="p-6 bg-surface border-t border-border/40 flex-row space-x-4">
          <AppButton
            title="Từ chối"
            variant="outline"
            onPress={() => updateStatusMutation.mutate('REJECTED')}
            disabled={updateStatusMutation.isPending}
            className="flex-1 mr-2 border border-slate-300"
            textClassName="text-rejected"
            accessibilityLabel="Từ chối yêu cầu đặt chỗ này"
          />
          <AppButton
            title="Chấp nhận"
            variant="driver"
            onPress={() => updateStatusMutation.mutate('CONFIRMED')}
            disabled={updateStatusMutation.isPending}
            className="flex-1 ml-2"
            accessibilityLabel="Xác nhận đồng ý yêu cầu đặt chỗ này"
          />
        </View>
      )}

      {isPassenger && booking.status === 'COMPLETED' && booking.paymentStatus === 'UNPAID' && (
        <View className="p-6 bg-surface border-t border-border/40">
          <AppButton
            title="Thanh toán chuyến đi"
            variant="passenger"
            onPress={() => createPaymentMutation.mutate()}
            disabled={createPaymentMutation.isPending || confirmPaymentMutation.isPending}
            className="w-full flex-row justify-center items-center"
            leftIcon={<CreditCard size={20} color="white" />}
            accessibilityLabel="Nhấn để tiến hành thanh toán chi phí chuyến đi"
          />
        </View>
      )}

      {isPassenger && ['PENDING', 'CONFIRMED'].includes(booking.status) && ['SCHEDULED', 'FULL'].includes(booking.ride.status) && (
        <View className="px-6 pb-4 bg-surface border-t border-border/40">
          <AppButton
            title="Hủy đặt chỗ"
            variant="outline"
            onPress={() => Alert.alert(
              'Hủy đặt chỗ?',
              'Ghế của bạn sẽ được trả lại để hành khách khác có thể đặt.',
              [
                { text: 'Quay lại', style: 'cancel' },
                { text: 'Hủy đặt chỗ', style: 'destructive', onPress: () => cancelBookingMutation.mutate() },
              ],
            )}
            disabled={cancelBookingMutation.isPending}
            textClassName="text-rejected"
            accessibilityLabel="Hủy đặt chỗ này"
          />
        </View>
      )}

      {booking.status === 'COMPLETED' && booking.paymentStatus === 'PAID' && displayUser?.id && (
        <View className="p-6 bg-surface border-t border-border/40">
          <AppButton
            title="Đánh giá chuyến đi"
            variant="secondary"
            leftIcon={<Star size={20} color="#2563EB" />}
            onPress={() => router.push({
              pathname: '/review-modal' as any,
              params: { rideId: booking.rideId, revieweeId: displayUser.id },
            })}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Header: dung shadow elevation thay vi border-b nhat
  // Tao depth perception ro rang hon, tach header khoi content scrollable
  header: {
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
});
