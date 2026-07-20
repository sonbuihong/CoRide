import React from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingService } from '../../src/services/booking.service';
import { paymentService } from '../../src/services/payment.service';
import { authService } from '../../src/services/auth.service';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { Star, Phone, CreditCard, ArrowLeft, ShieldCheck, Mail, MessageSquare } from 'lucide-react-native';

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

  const createPaymentMutation = useMutation({
    mutationFn: () => paymentService.createPayment(id as string),
    onSuccess: (data) => {
      if (data.order_url) {
        Linking.openURL(data.order_url);
      } else {
        Alert.alert('Lỗi', 'Không nhận được URL thanh toán từ hệ thống.');
      }
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán.');
    }
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
      {/* Header nổi */}
      <View 
        style={{ paddingTop: insets.top + 10 }}
        className="px-6 py-4 flex-row items-center bg-background border-b border-border/30"
      >
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface border border-border/30 items-center justify-center shadow-sm active:bg-slate-50 mr-4"
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold" className="text-text-primary flex-1">{title}</AppText>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Thẻ liên hệ đối phương (Hành khách/Tài xế) */}
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
          </View>
        </View>

        {/* Thông tin Chi tiết Đặt chỗ */}
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
                  <Phone size={14} color="#64748B" className="mr-1.5" />
                  <AppText weight="semibold" className="text-text-primary">{displayUser.phone}</AppText>
                </View>
              </View>
            )}

            {displayUser.email && booking.status === 'CONFIRMED' && (
              <View className="flex-row justify-between py-3">
                <AppText className="text-text-secondary">Địa chỉ email</AppText>
                <View className="flex-row items-center">
                  <Mail size={14} color="#64748B" className="mr-1.5" />
                  <AppText weight="semibold" className="text-text-primary">{displayUser.email}</AppText>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Thông tin chuyến đi lộ trình */}
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

      {/* Hành động dưới chân màn hình */}
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

      {isPassenger && booking.status === 'CONFIRMED' && booking.paymentStatus === 'UNPAID' && (
        <View className="p-6 bg-surface border-t border-border/40">
          <AppButton 
            title="Thanh toán chuyến đi"
            variant="passenger"
            onPress={() => createPaymentMutation.mutate()}
            disabled={createPaymentMutation.isPending}
            className="w-full flex-row justify-center items-center"
            leftIcon={<CreditCard size={20} color="white" className="mr-2" />}
            accessibilityLabel="Nhấn để tiến hành thanh toán chi phí chuyến đi"
          />
        </View>
      )}
    </View>
  );
}
