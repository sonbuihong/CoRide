import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Star,
  X,
} from 'lucide-react-native';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { BottomSheetSurface } from '../../components/ui/BottomSheetSurface';
import { colors, layout, radius, spacing } from '../../theme/tokens';
import { reviewService } from '../../services/review.service';
import { useBookingPayment } from '../payment/useBookingPayment';
import { BookingPaymentSheet } from '../payment/BookingPaymentSheet';
import {
  canReviewCompletedBooking,
  completedSummary,
  validDate,
  type CompletedBookingData,
} from './completed-booking';

interface Props {
  booking: CompletedBookingData;
  onBack: () => void;
}

const dateTime = (value?: string | null) => {
  const date = validDate(value);
  return date ? format(date, 'HH:mm · dd/MM/yyyy') : undefined;
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.detailRow}>
      <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>
        {label}
      </AppText>
      <AppText variant="bodySmall" weight="medium" selectable>
        {value}
      </AppText>
    </View>
  );
}

export function CompletedBookingExperience({
  booking,
  onBack,
}: Props) {
  const router = useRouter();
  const payment = useBookingPayment(booking);
  const insets = useSafeAreaInsets();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const summary = completedSummary(booking);
  const driver = booking.ride.driver;
  const vehicle = booking.ride.vehicle;
  const driverName = [driver?.firstName, driver?.lastName]
    .filter(Boolean)
    .join(' ');
  const vehicleType =
    vehicle?.type === 'CAR'
      ? 'Ô tô'
      : vehicle?.type === 'BIKE'
        ? 'Xe máy'
        : vehicle?.type;
  const vehicleLabel = [vehicleType, vehicle?.color, vehicle?.licensePlate]
    .filter(Boolean)
    .join(' · ');
  const rating = driver?.driverRating;
  const hasRating =
    typeof rating === 'number' &&
    Number.isFinite(rating) &&
    rating > 0 &&
    rating <= 5 &&
    driver?.driverRatingCount !== 0;
  const reviews = useQuery({
    queryKey: ['user-reviews', booking.ride.driverId],
    queryFn: () => reviewService.getUserReviews(booking.ride.driverId),
    enabled: !!booking.ride.driverId,
  });
  const review = reviews.data?.find(
    (item) =>
      item.rideId === booking.rideId &&
      item.reviewerId === booking.passengerId &&
      item.revieweeId === booking.ride.driverId,
  );
  const canReview = canReviewCompletedBooking(
    booking,
    reviews.isSuccess,
    !!review,
  );
  const openReview = (initialRating?: number) =>
    router.push({
      pathname: '/review-modal',
      params: {
        rideId: booking.rideId,
        revieweeId: booking.ride.driverId,
        ...(initialRating ? { initialRating: String(initialRating) } : {}),
      },
    });
  const metrics = [
    summary.distance !== undefined
      ? `${summary.distance.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`
      : '',
    summary.minutes !== undefined
      ? summary.minutes < 1
        ? 'Dưới 1 phút'
        : `${summary.minutes} phút`
      : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            style={styles.iconButton}
          >
            <ArrowLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <AppText weight="semibold" style={styles.headerTitle}>
            Chi tiết chuyến đi
          </AppText>
          <View style={styles.iconButton} />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.successIcon}>
              <Check size={34} strokeWidth={2.5} color={colors.success} />
            </View>
            <AppText variant="h1" weight="bold" style={styles.center}>
              Chuyến đi đã hoàn thành
            </AppText>
            <AppText
              variant="bodySmall"
              style={[styles.center, { color: colors.textSecondary }]}
            >
              Cảm ơn bạn đã đồng hành cùng CoRide.
            </AppText>
          </View>

          {(summary.started || summary.finished) && (
            <View style={styles.times}>
              {summary.started && (
                <View style={styles.timeBlock}>
                  <AppText variant="h2" weight="semibold">
                    {format(summary.started, 'HH:mm')}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary }}
                  >
                    {summary.pickedUp ? 'Đón khách' : 'Khởi hành dự kiến'}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary }}
                  >
                    {format(summary.started, 'EEEE · dd/MM/yyyy', {
                      locale: vi,
                    })}
                  </AppText>
                </View>
              )}
              {summary.finished && (
                <View style={[styles.timeBlock, styles.arrival]}>
                  <AppText variant="h2" weight="semibold">
                    {format(summary.finished, 'HH:mm')}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary }}
                  >
                    Hoàn thành
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary }}
                  >
                    {format(summary.finished, 'EEEE · dd/MM/yyyy', {
                      locale: vi,
                    })}
                  </AppText>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.routeRow}>
              <View style={styles.originDot} />
              <AppText
                weight="medium"
                numberOfLines={2}
                style={styles.routeAddress}
              >
                {summary.pickup || 'Chưa có địa chỉ đón'}
              </AppText>
            </View>
            <View style={styles.routeMiddle}>
              <View style={styles.routeLine} />
              {metrics ? (
                <AppText
                  variant="caption"
                  style={[styles.routeAddress, { color: colors.textSecondary }]}
                >
                  {metrics} · Hành trình của bạn
                </AppText>
              ) : null}
            </View>
            <View style={styles.routeRow}>
              <View style={styles.destinationDot} />
              <AppText
                weight="medium"
                numberOfLines={2}
                style={styles.routeAddress}
              >
                {summary.dropoff || 'Chưa có địa chỉ trả'}
              </AppText>
            </View>
          </View>

          <View style={styles.section}>
            <AppText
              variant="caption"
              weight="semibold"
              style={{ color: colors.textSecondary }}
            >
              THANH TOÁN
            </AppText>
            <AppText
              variant="bodySmall"
              style={{ color: colors.textSecondary }}
            >
              Tổng thanh toán
            </AppText>
            <AppText variant="display" weight="bold">
              {summary.amount || 'Chưa có thông tin giá'}
            </AppText>
            <View style={styles.status} accessibilityLiveRegion="polite">
              {summary.paid ? (
                <CheckCircle2 size={18} color={colors.success} />
              ) : (
                <CircleAlert
                  size={18}
                  color={summary.canPay ? colors.warning : colors.textSecondary}
                />
              )}
              <AppText
                variant="bodySmall"
                weight="medium"
                style={{
                  color: summary.paid
                    ? colors.success
                    : summary.canPay
                      ? colors.warning
                      : colors.textSecondary,
                }}
              >
                {summary.paymentLabel}
              </AppText>
            </View>
            {summary.canPay && (
              <View style={styles.action}>
                <AppButton
                  title={`Thanh toán${summary.amount ? ` ${summary.amount}` : ''}`}
                  onPress={() => { void payment.open(); }}
                  disabled={payment.state.phase !== 'IDLE'}
                />
                <AppText
                  variant="caption"
                  style={[styles.paymentNote, { color: colors.textSecondary }]}
                >
                  Thanh toán QR mô phỏng dành cho môi trường demo.
                </AppText>
              </View>
            )}
            {summary.paid && summary.paymentMethodLabel && <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>{summary.paymentMethodLabel}</AppText>}
            {booking.paymentStatus === 'UNPAID' && !summary.canPay && <AppText variant="bodySmall" style={{ color: colors.textSecondary }}>Thanh toán sẽ khả dụng khi hệ thống xác nhận đặt chỗ hoàn thành.</AppText>}
          </View>

          <View style={styles.section}>
            <AppText
              variant="caption"
              weight="semibold"
              style={{ color: colors.textSecondary }}
            >
              TÀI XẾ
            </AppText>
            <View style={styles.driverRow}>
              {driver?.avatarUrl && !avatarFailed ? (
                <Image
                  source={{ uri: driver.avatarUrl }}
                  style={styles.avatar}
                  onError={() => setAvatarFailed(true)}
                  accessibilityLabel={`Ảnh tài xế ${driverName}`}
                />
              ) : (
                <View style={styles.avatar}>
                  <AppText
                    variant="h2"
                    weight="semibold"
                    style={{ color: colors.primary }}
                  >
                    {driverName.charAt(0).toUpperCase() || 'T'}
                  </AppText>
                </View>
              )}
              <View style={styles.driverInfo}>
                <AppText weight="semibold">{driverName || 'Tài xế'}</AppText>
                {vehicleLabel ? (
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.textSecondary }}
                  >
                    {vehicleLabel}
                  </AppText>
                ) : null}
                {hasRating && (
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.textSecondary }}
                  >
                    ★ {rating.toFixed(1)}
                    {driver?.driverRatingCount
                      ? ` · ${driver.driverRatingCount} đánh giá`
                      : ''}
                  </AppText>
                )}
              </View>
            </View>
            {review ? (
              <View style={styles.review} accessibilityLiveRegion="polite">
                <AppText weight="medium" style={{ color: colors.success }}>
                  ✓ Bạn đã đánh giá chuyến đi
                </AppText>
                <View
                  style={styles.stars}
                  accessible
                  accessibilityLabel={`Đánh giá của bạn: ${review.rating} trên 5 sao`}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      size={24}
                      color={colors.warning}
                      fill={
                        value <= review.rating ? colors.warning : 'transparent'
                      }
                    />
                  ))}
                </View>
              </View>
            ) : summary.paid ? (
              <View style={styles.review}>
                {reviews.isPending ? (
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.textSecondary }}
                  >
                    Đang kiểm tra đánh giá…
                  </AppText>
                ) : reviews.isError ? (
                  <>
                    <AppText
                      variant="bodySmall"
                      style={{ color: colors.textSecondary }}
                    >
                      Chưa tải được đánh giá của bạn.
                    </AppText>
                    <AppButton
                      title="Thử tải lại đánh giá"
                      variant="outline"
                      onPress={() => {
                        void reviews.refetch();
                      }}
                      isLoading={reviews.isFetching}
                    />
                  </>
                ) : canReview ? (
                  <>
                    <AppText weight="medium" style={styles.center}>
                      Chuyến đi của bạn thế nào?
                    </AppText>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Pressable
                          key={value}
                          accessibilityRole="button"
                          accessibilityLabel={`Đánh giá tài xế ${value} sao`}
                          onPress={() => openReview(value)}
                          style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Star size={28} color={colors.warning} />
                        </Pressable>
                      ))}
                    </View>
                    <AppButton
                      title="Đánh giá tài xế"
                      onPress={() => openReview()}
                    />
                  </>
                ) : (
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.textSecondary }}
                  >
                    Bạn đã đến nơi. Bạn có thể đánh giá khi tài xế kết thúc
                    chuyến đi chung.
                  </AppText>
                )}
              </View>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem chi tiết chuyến đi"
            onPress={() => setDetailsOpen(true)}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
          >
            <AppText weight="medium" style={styles.routeAddress}>
              Xem chi tiết chuyến đi
            </AppText>
            <ChevronRight size={20} color={colors.textSecondary} />
          </Pressable>
          <AppText
            variant="caption"
            style={[styles.help, { color: colors.textSecondary }]}
          >
            Cần trợ giúp?
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Báo cáo vấn đề về chuyến đi"
            onPress={() =>
              router.push({
                pathname: '/report-modal',
                params: {
                  reportedId: booking.ride.driverId,
                  rideId: booking.rideId,
                },
              })
            }
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
          >
            <AppText
              variant="bodySmall"
              style={[styles.routeAddress, { color: colors.textSecondary }]}
            >
              Báo cáo vấn đề
            </AppText>
            <ChevronRight size={20} color={colors.textSecondary} />
          </Pressable>
        </ScrollView>
      </View>
      <Modal
        visible={detailsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsOpen(false)}
      >
        <View style={styles.modal}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDetailsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Đóng chi tiết chuyến đi"
          />
          <BottomSheetSurface
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, spacing.lg),
                marginTop: insets.top + spacing.lg,
              },
            ]}
            accessibilityViewIsModal
          >
            <View style={styles.header}>
              <AppText variant="h2" weight="bold" style={styles.headerTitle}>
                Chi tiết chuyến đi
              </AppText>
              <Pressable
                onPress={() => setDetailsOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Đóng chi tiết"
                style={styles.iconButton}
              >
                <X size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.details}>
              <DetailRow label="Điểm đón" value={summary.pickup} />
              <DetailRow label="Điểm trả" value={summary.dropoff} />
              <DetailRow
                label="Khởi hành dự kiến"
                value={dateTime(booking.ride.departureTime)}
              />
              <DetailRow
                label="Đón khách"
                value={dateTime(booking.pickedUpAt)}
              />
              <DetailRow
                label="Hoàn thành"
                value={dateTime(booking.droppedOffAt)}
              />
              <DetailRow label="Hành trình của bạn" value={metrics} />
              <DetailRow label="Số ghế" value={booking.seats} />
              <DetailRow label="Mã đặt chỗ" value={booking.id} />
              <DetailRow label="Ngày đặt" value={dateTime(booking.createdAt)} />
              <DetailRow label="Tài xế" value={driverName} />
              <DetailRow label="Loại xe" value={vehicleType} />
              <DetailRow label="Màu xe" value={vehicle?.color} />
              <DetailRow label="Biển số" value={vehicle?.licensePlate} />
              <DetailRow label="Tổng thanh toán" value={summary.amount} />
              <DetailRow label="Phương thức" value={summary.paymentMethodLabel} />
              <DetailRow
                label="Thanh toán"
                value={booking.paymentStatus ? summary.paymentLabel : undefined}
              />
            </ScrollView>
          </BottomSheetSurface>
        </View>
      </Modal>
      <BookingPaymentSheet booking={booking} state={payment.state} onClose={payment.close}
        onConfirm={() => { void payment.confirm(); }} onRetry={() => { void payment.retry(); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  iconButton: {
    minHeight: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  content: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  center: { textAlign: 'center' },
  times: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  timeBlock: { flexGrow: 1, flexBasis: 130, gap: spacing.xxs },
  arrival: { alignItems: 'flex-end' },
  section: {
    paddingVertical: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  routeAddress: { flex: 1 },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginHorizontal: 3,
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    marginHorizontal: 3,
  },
  routeMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: spacing.xl,
  },
  routeLine: {
    width: 2,
    alignSelf: 'stretch',
    backgroundColor: colors.borderStrong,
    marginHorizontal: 7,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  action: { marginTop: spacing.xs, gap: spacing.xs },
  paymentNote: { textAlign: 'center' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: { flex: 1, gap: spacing.xxs },
  review: { marginTop: spacing.md, gap: spacing.sm },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xxs },
  linkRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  help: { marginTop: spacing.xl },
  pressed: { backgroundColor: colors.surfaceMuted },
  modal: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    maxHeight: '90%',
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    flexShrink: 1,
  },
  details: { paddingBottom: spacing.lg },
  detailRow: {
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
