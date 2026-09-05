import React, { memo } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock3,
  CreditCard,
  Headphones,
  HelpCircle,
  MapPin,
  ShieldAlert,
  XCircle,
} from 'lucide-react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { colors, radius, spacing } from '../../theme/tokens';

interface PassengerBookingDetailsProps {
  booking: {
    id: string;
    seats: number;
    totalPrice?: number | null;
    paymentStatus?: string | null;
    createdAt?: string | null;
    pickupAddress?: string | null;
    dropoffAddress?: string | null;
    status?: string;
    isPickedUp?: boolean;
    isDroppedOff?: boolean;
    ride: {
      origin: string;
      destination: string;
      distance?: number | null;
      distanceKm?: number | null;
      duration?: number | null;
      vehicle?: {
        type?: string | null;
        model?: string | null;
        color?: string | null;
        licensePlate?: string | null;
      } | null;
    };
  };
  journeyState: string;
  onPayNow?: () => void;
  isPaying?: boolean;
  onCancelBooking?: () => void;
  isCancellingBooking?: boolean;
}

export const PassengerBookingDetails = memo(function PassengerBookingDetails({
  booking,
  journeyState,
  onPayNow,
  isPaying = false,
  onCancelBooking,
  isCancellingBooking = false,
}: PassengerBookingDetailsProps) {
  const isPaid = booking.paymentStatus === 'PAID';
  const totalPrice = booking.totalPrice || 0;
  const isCompleted = journeyState === 'COMPLETED';

  // Format distance & duration safely without hardcoded fallback
  const distance = booking.ride.distanceKm || booking.ride.distance;
  const duration = booking.ride.duration;
  let journeyMetricsText: string | null = null;

  if (distance && duration) {
    journeyMetricsText = `${distance} km • khoảng ${duration} phút`;
  } else if (distance) {
    journeyMetricsText = `${distance} km`;
  } else if (duration) {
    journeyMetricsText = `Khoảng ${duration} phút`;
  } else {
    journeyMetricsText = 'Đang tính toán hành trình';
  }

  const handleReportIssue = () => {
    Alert.alert(
      'Báo cáo sự cố chuyến đi',
      'Đội ngũ hỗ trợ CoRide luôn sẵn sàng 24/7. Bạn muốn liên hệ hỗ trợ khẩn cấp qua hotline hay gửi phản hồi?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gọi Hotline 1900 6868',
          onPress: () => { void Linking.openURL('tel:19006868'); },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Section: HÀNH TRÌNH ── */}
      <View style={styles.section}>
        <AppText variant="caption" weight="bold" style={styles.sectionHeader}>
          HÀNH TRÌNH
        </AppText>
        <View style={styles.routeBox}>
          <View style={styles.timeline}>
            <View style={styles.pickupDot} />
            <View style={styles.routeLine} />
            <MapPin size={16} color={colors.danger} fill={colors.dangerSoft} />
          </View>
          <View style={styles.routeContent}>
            <View style={styles.pointWrap}>
              <AppText variant="caption" style={styles.pointType}>
                ĐIỂM ĐÓN
              </AppText>
              <AppText variant="bodySmall" weight="semibold" style={styles.addressText}>
                {booking.pickupAddress || booking.ride.origin}
              </AppText>
            </View>

            <View style={styles.distanceRow}>
              <Clock3 size={13} color={colors.textTertiary} />
              <AppText variant="caption" style={styles.distanceText}>
                {journeyMetricsText}
              </AppText>
            </View>

            <View style={styles.pointWrap}>
              <AppText variant="caption" style={styles.pointType}>
                ĐIỂM TRẢ
              </AppText>
              <AppText variant="bodySmall" weight="semibold" style={styles.addressText}>
                {booking.dropoffAddress || booking.ride.destination}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Section: TÀI XẾ & PHƯƠNG TIỆN ── */}
      <View style={styles.section}>
        <AppText variant="caption" weight="bold" style={styles.sectionHeader}>
          TÀI XẾ & PHƯƠNG TIỆN
        </AppText>
        <View style={styles.detailRow}>
          <View style={styles.detailLabelWrap}>
            <Car size={16} color={colors.textSecondary} />
            <AppText variant="bodySmall" style={styles.detailLabel}>Phương tiện</AppText>
          </View>
          <AppText variant="bodySmall" weight="semibold" style={styles.detailValue}>
            {booking.ride.vehicle?.type === 'BIKE' ? 'Xe máy' : 'Ô tô'} ({booking.ride.vehicle?.licensePlate || 'Chưa cập nhật'})
          </AppText>
        </View>
        {Boolean(booking.ride.vehicle?.color) && (
          <View style={styles.detailRow}>
            <AppText variant="bodySmall" style={styles.detailLabel}>Màu xe</AppText>
            <AppText variant="bodySmall" weight="semibold" style={styles.detailValue}>
              {booking.ride.vehicle?.color}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* ── Section: THANH TOÁN ── */}
      <View style={styles.section}>
        <AppText variant="caption" weight="bold" style={styles.sectionHeader}>
          THANH TOÁN
        </AppText>
        <View style={styles.detailRow}>
          <AppText variant="body" style={styles.detailLabel}>Tổng cộng</AppText>
          <AppText variant="h3" weight="bold" style={styles.priceValue}>
            {totalPrice.toLocaleString('vi-VN')}đ
          </AppText>
        </View>
        <View style={styles.detailRow}>
          <AppText variant="bodySmall" style={styles.detailLabel}>Trạng thái</AppText>
          {isPaid ? (
            <View style={styles.paidBadge}>
              <CheckCircle2 size={13} color={colors.success} />
              <AppText variant="caption" weight="bold" style={styles.paidText}>
                Đã thanh toán
              </AppText>
            </View>
          ) : (
            <View style={styles.unpaidBadge}>
              <Clock3 size={13} color={colors.warning} />
              <AppText variant="caption" weight="bold" style={styles.unpaidText}>
                Chưa thanh toán
              </AppText>
            </View>
          )}
        </View>

        {/* Khi chuyến COMPLETED và chưa thanh toán, hiện nút thanh toán CTA chính */}
        {isCompleted && !isPaid && onPayNow && (
          <View style={styles.payActionWrap}>
            <AppButton
              title={`Thanh toán ${totalPrice.toLocaleString('vi-VN')}đ`}
              variant="passenger"
              onPress={onPayNow}
              isLoading={isPaying}
              leftIcon={<CreditCard size={18} color="#FFFFFF" />}
            />
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* ── Section: THÔNG TIN ĐẶT CHỖ ── */}
      <View style={styles.section}>
        <AppText variant="caption" weight="bold" style={styles.sectionHeader}>
          THÔNG TIN ĐẶT CHỖ
        </AppText>
        <View style={styles.detailRow}>
          <AppText variant="bodySmall" style={styles.detailLabel}>Mã đặt chỗ</AppText>
          <AppText variant="bodySmall" weight="semibold" style={styles.codeText}>
            CR-{booking.id.slice(0, 6).toUpperCase()}
          </AppText>
        </View>
        <View style={styles.detailRow}>
          <AppText variant="bodySmall" style={styles.detailLabel}>Loại chuyến</AppText>
          <AppText variant="bodySmall" weight="semibold" style={styles.detailValue}>
            Đi chung (Carpooling)
          </AppText>
        </View>
        <View style={styles.detailRow}>
          <AppText variant="bodySmall" style={styles.detailLabel}>Số ghế đặt</AppText>
          <AppText variant="bodySmall" weight="semibold" style={styles.detailValue}>
            {booking.seats} ghế
          </AppText>
        </View>
        {Boolean(booking.createdAt) && (
          <View style={styles.detailRow}>
            <AppText variant="bodySmall" style={styles.detailLabel}>Thời gian đặt</AppText>
            <AppText variant="bodySmall" weight="semibold" style={styles.detailValue}>
              {format(new Date(booking.createdAt!), 'dd/MM/yyyy HH:mm')}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* ── Section: HỖ TRỢ & AN TOÀN (Tuyệt đối không render nút hủy khi ONGOING) ── */}
      <View style={styles.section}>
        <AppText variant="caption" weight="bold" style={styles.sectionHeader}>
          HỖ TRỢ & AN TOÀN
        </AppText>
        <TouchableOpacity
          style={styles.supportRow}
          accessibilityRole="button"
          accessibilityLabel="Báo cáo sự cố chuyến đi"
          onPress={handleReportIssue}
        >
          <View style={styles.supportIconWrap}>
            <AlertTriangle size={18} color={colors.warning} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodySmall" weight="semibold" style={styles.supportTitle}>
              Báo cáo sự cố chuyến đi
            </AppText>
            <AppText variant="caption" style={styles.supportSubtitle}>
              Gặp vấn đề về an toàn, tài xế hoặc lộ trình?
            </AppText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportRow}
          accessibilityRole="button"
          accessibilityLabel="Liên hệ tổng đài CoRide"
          onPress={() => { void Linking.openURL('tel:19006868'); }}
        >
          <View style={styles.supportIconWrap}>
            <Headphones size={18} color={colors.navigationPassenger || '#0071E3'} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodySmall" weight="semibold" style={styles.supportTitle}>
              Tổng đài hỗ trợ CoRide 24/7
            </AppText>
            <AppText variant="caption" style={styles.supportSubtitle}>
              Hotline 1900 6868 (Miễn phí cước)
            </AppText>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Section: HỦY CHUYẾN ĐI (Bên dưới cùng của trang) ── */}
      {Boolean(onCancelBooking) && !isCompleted && (
        <>
          <View style={styles.divider} />
          <View style={styles.cancelSection}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                (isCancellingBooking || Boolean(booking.isDroppedOff)) && styles.cancelButtonDisabled
              ]}
              onPress={onCancelBooking}
              disabled={isCancellingBooking || Boolean(booking.isDroppedOff)}
              accessibilityRole="button"
              accessibilityLabel="Hủy đặt chỗ chuyến đi"
            >
              {isCancellingBooking ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <View style={styles.cancelContent}>
                  <XCircle size={18} color={colors.danger} />
                  <AppText variant="body" weight="semibold" style={styles.cancelText}>
                    Hủy đặt chỗ chuyến đi
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
            <AppText variant="caption" style={styles.cancelNote}>
              {booking.isPickedUp
                ? 'Bạn đã lên xe. Nếu muốn xuống xe sớm, vui lòng trao đổi trực tiếp với tài xế hoặc gọi hotline 1900 6868.'
                : 'Bạn có thể hủy trước khi tài xế đón bạn. Ghế sẽ được hoàn lại cho chuyến đi.'}
            </AppText>
          </View>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  section: {
    paddingVertical: spacing.xs,
  },
  sectionHeader: {
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  routeBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  timeline: {
    alignItems: 'center',
    width: 20,
    paddingVertical: 2,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  routeLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.borderStrong,
    marginVertical: 4,
  },
  routeContent: {
    flex: 1,
    gap: spacing.xs,
  },
  pointWrap: {
    gap: 2,
  },
  pointType: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  addressText: {
    color: colors.textPrimary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  distanceText: {
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    color: colors.textSecondary,
  },
  detailValue: {
    color: colors.textPrimary,
  },
  priceValue: {
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  codeText: {
    color: colors.navigationPassenger || '#0071E3',
    fontVariant: ['tabular-nums'],
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.navigationDriverSoft || '#EAF9EE',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  paidText: {
    color: colors.success,
    fontSize: 11,
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningSoft || '#FFFBEB',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  unpaidText: {
    color: colors.warning,
    fontSize: 11,
  },
  payActionWrap: {
    marginTop: spacing.sm,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  supportIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  supportTitle: {
    color: colors.textPrimary,
  },
  supportSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  cancelSection: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  cancelButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  cancelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cancelText: {
    color: colors.danger,
    fontSize: 15,
  },
  cancelNote: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
});
