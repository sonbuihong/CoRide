import React from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Armchair, CircleDollarSign, MapPin, MessageCircle, Phone, Star, UserRound } from 'lucide-react-native';

import { AppButton } from '../../../src/components/ui/AppButton';
import { AppText } from '../../../src/components/ui/AppText';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { SkeletonLoader } from '../../../src/components/ui/SkeletonLoader';
import { bookingService, type DriverBookingSummary } from '../../../src/services/booking.service';
import { colors, radius, spacing } from '../../../src/theme/tokens';
import { formatCurrency, getPassengerStatusLabel } from '../../../src/features/trip-flow/trip-flow';
import { TripScreen, TripScreenHeader, TripScrollView, tripScreenStyles } from '../../../src/features/trip-flow/TripScreen';

export default function PassengerDetailScreen() {
  const { bookingId, rideId } = useLocalSearchParams<{ bookingId: string; rideId?: string }>();
  const router = useRouter();
  const query = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingService.getBookingById(bookingId),
    enabled: Boolean(bookingId),
  });
  const booking = query.data as DriverBookingSummary | undefined;

  const name = booking
    ? [booking.passenger.firstName, booking.passenger.lastName].filter(Boolean).join(' ') || 'Hành khách'
    : 'Hành khách';

  const openChat = () => {
    if (!booking || !rideId) return;
    router.push({ pathname: '/chat/[rideId]', params: { rideId, otherUserId: booking.passenger.id, otherUserName: name } } as never);
  };

  return (
    <TripScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <TripScreenHeader title="Hành khách" onBack={() => router.back()} />
      {query.isLoading ? (
        <View style={styles.loading}>
          <SkeletonLoader width={88} height={88} borderRadius={44} />
          <SkeletonLoader width="55%" height={24} className="mt-4" />
          <SkeletonLoader height={220} className="mt-6" borderRadius={18} />
        </View>
      ) : query.isError || !booking ? (
        <ErrorState message="Không tải được hành khách. Kiểm tra kết nối và thử lại." onRetry={() => void query.refetch()} />
      ) : (
        <TripScrollView>
          <View style={styles.profile}>
            {booking.passenger.avatarUrl ? (
              <Image source={{ uri: booking.passenger.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}><UserRound size={38} color={colors.success} /></View>
            )}
            <AppText variant="h1" weight="bold" style={styles.name}>{name}</AppText>
            <View style={styles.rating}>
              <Star size={16} color={colors.warning} fill={colors.warning} />
              <AppText weight="semibold">{booking.passenger.passengerRating?.toFixed(1) || '—'}</AppText>
              <AppText variant="bodySmall">({booking.passenger.passengerRatingCount || 0} đánh giá)</AppText>
            </View>
            <View style={styles.statusPill}><AppText variant="bodySmall" weight="bold" style={styles.statusText}>{getPassengerStatusLabel(booking)}</AppText></View>
          </View>

          <View style={tripScreenStyles.section}>
            <DetailRow icon={<Armchair size={20} color={colors.info} />} label="Số ghế" value={`${booking.seats} ghế`} />
            <View style={tripScreenStyles.divider} />
            <DetailRow icon={<MapPin size={20} color={colors.success} />} label="Điểm đón" value={booking.pickupAddress || booking.ride.origin} />
            <View style={tripScreenStyles.divider} />
            <DetailRow icon={<MapPin size={20} color={colors.danger} />} label="Điểm trả" value={booking.dropoffAddress || booking.ride.destination} />
            <View style={tripScreenStyles.divider} />
            <DetailRow icon={<CircleDollarSign size={20} color={colors.success} />} label="Thanh toán" value={`${formatCurrency(booking.totalPrice)} • ${booking.paymentMethod === 'WALLET' ? 'Ví CoRide' : booking.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chưa xác định'}`} />
          </View>

          {booking.passenger.phone ? (
            <View style={tripScreenStyles.section}>
              <AppText variant="caption">Số điện thoại</AppText>
              <AppText weight="semibold" style={styles.phone}>{booking.passenger.phone}</AppText>
            </View>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              variant="outline"
              title="Gọi"
              leftIcon={<Phone size={19} color={colors.success} style={styles.buttonIcon} />}
              disabled={!booking.passenger.phone}
              onPress={() => booking.passenger.phone && void Linking.openURL(`tel:${booking.passenger.phone}`)}
              style={styles.action}
            />
            <AppButton
              variant="driver"
              title="Nhắn tin"
              leftIcon={<MessageCircle size={19} color={colors.surface} style={styles.buttonIcon} />}
              onPress={openChat}
              style={styles.action}
            />
          </View>
        </TripScrollView>
      )}
    </TripScreen>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={tripScreenStyles.row}>
      <View style={styles.detailIcon}>{icon}</View>
      <View style={tripScreenStyles.rowCopy}>
        <AppText variant="caption">{label}</AppText>
        <AppText weight="semibold" numberOfLines={3}>{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', padding: spacing.screen },
  profile: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { borderRadius: 44, height: 88, width: 88 },
  avatarFallback: { alignItems: 'center', backgroundColor: colors.driverAccentSoft, borderRadius: 44, height: 88, justifyContent: 'center', width: 88 },
  name: { marginTop: spacing.md, textAlign: 'center' },
  rating: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  statusPill: { backgroundColor: colors.driverAccentSoft, borderRadius: radius.full, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  statusText: { color: colors.success },
  detailIcon: { alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: radius.full, height: 40, justifyContent: 'center', width: 40 },
  phone: { marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  buttonIcon: { marginRight: spacing.sm },
});
