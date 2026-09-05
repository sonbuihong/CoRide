import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CheckCircle2, Clock3, Navigation, Car, AlertCircle, MapPin } from 'lucide-react-native';

import { AppText } from '../../components/ui/AppText';
import { colors, radius, spacing } from '../../theme/tokens';

export type PassengerJourneyState =
  | 'DRIVER_COMING'
  | 'DRIVER_ARRIVED'
  | 'ON_BOARD'
  | 'COMPLETED';

export function derivePassengerJourneyState(booking: {
  status: string;
  isPickedUp?: boolean;
  isDroppedOff?: boolean;
  driverArrivedAt?: string | null;
  ride: { status: string };
}): PassengerJourneyState {
  if (booking.isDroppedOff || booking.status === 'COMPLETED') {
    return 'COMPLETED';
  }
  if (booking.isPickedUp) {
    return 'ON_BOARD';
  }
  if (booking.driverArrivedAt) {
    return 'DRIVER_ARRIVED';
  }
  return 'DRIVER_COMING';
}

interface PassengerBookingStatusProps {
  journeyState: PassengerJourneyState;
  connected: boolean;
  etaMinutes: number | null;
  distanceText: string | null;
  dropoffAddress?: string | null;
  pickupAddress?: string | null;
}

export const PassengerBookingStatus = memo(function PassengerBookingStatus({
  journeyState,
  connected,
  etaMinutes,
  distanceText,
  dropoffAddress,
  pickupAddress,
}: PassengerBookingStatusProps) {
  let title = '';
  let subtitle = '';
  let statusColor: string = colors.primary;
  let statusBg: string = colors.navigationPassengerSoft || '#EAF4FF';
  let StatusIcon = Navigation;

  switch (journeyState) {
    case 'DRIVER_COMING':
      title = 'Tài xế đang đến đón bạn';
      subtitle = connected
        ? 'Vị trí tài xế đang được cập nhật'
        : 'Đang hiển thị vị trí gần nhất';
      statusColor = colors.navigationPassenger || '#0071E3';
      statusBg = colors.navigationPassengerSoft || '#EAF4FF';
      StatusIcon = Navigation;
      break;

    case 'DRIVER_ARRIVED':
      title = 'Tài xế đã đến';
      subtitle = 'Tài xế đang chờ bạn tại điểm đón';
      statusColor = colors.success;
      statusBg = colors.navigationDriverSoft || '#EAF9EE';
      StatusIcon = CheckCircle2;
      break;

    case 'ON_BOARD':
      title = 'Bạn đang trên chuyến đi';
      subtitle = dropoffAddress
        ? `Đang đến ${dropoffAddress.split(',')[0]?.trim()}`
        : 'Đang hướng tới điểm trả';
      statusColor = colors.navigationPassenger || '#0071E3';
      statusBg = colors.navigationPassengerSoft || '#EAF4FF';
      StatusIcon = Car;
      break;

    case 'COMPLETED':
      title = 'Chuyến đi đã hoàn thành';
      subtitle = 'Cảm ơn bạn đã đồng hành cùng CoRide';
      statusColor = colors.success;
      statusBg = colors.navigationDriverSoft || '#EAF9EE';
      StatusIcon = CheckCircle2;
      break;

    default:
      title = 'Đang theo dõi chuyến đi';
      subtitle = 'Thông tin sẽ tự động cập nhật';
      statusColor = colors.primary;
      statusBg = colors.surfaceSecondary;
      StatusIcon = AlertCircle;
      break;
  }

  const targetLabel = journeyState === 'ON_BOARD'
    ? (dropoffAddress?.split(',')[0]?.trim() || 'Điểm trả của bạn')
    : (pickupAddress?.split(',')[0]?.trim() || 'Điểm đón của bạn');

  const targetPrefix = journeyState === 'ON_BOARD' ? 'Điểm đến:' : 'Điểm đón:';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: statusBg }]}>
          <StatusIcon size={22} color={statusColor} />
        </View>
        <View style={styles.titleWrap}>
          <AppText variant="h3" weight="bold" style={styles.titleText}>
            {title}
          </AppText>
          <AppText variant="bodySmall" style={styles.subtitleText} numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>

        {(etaMinutes != null || distanceText != null) && (
          <View style={styles.metricsBadge}>
            {etaMinutes != null && (
              <View style={styles.metricItem}>
                <Clock3 size={13} color={colors.textPrimary} />
                <AppText variant="caption" weight="bold" style={styles.metricValue}>
                  ~{etaMinutes}p
                </AppText>
              </View>
            )}
            {distanceText != null && (
              <View style={styles.metricItem}>
                <MapPin size={13} color={colors.textSecondary} />
                <AppText variant="caption" weight="semibold" style={styles.metricDistance}>
                  {distanceText}
                </AppText>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.targetRow}>
        <View style={styles.targetDot} />
        <AppText variant="caption" style={styles.targetPrefix}>
          {targetPrefix}
        </AppText>
        <AppText variant="caption" weight="semibold" style={styles.targetText} numberOfLines={1}>
          {targetLabel}
        </AppText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    color: colors.textPrimary,
    lineHeight: 22,
  },
  subtitleText: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricsBadge: {
    alignItems: 'flex-end',
    gap: 2,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.card,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  metricDistance: {
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginTop: spacing.sm,
    gap: 6,
  },
  targetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.navigationPassenger || '#0071E3',
  },
  targetPrefix: {
    color: colors.textTertiary,
  },
  targetText: {
    flex: 1,
    color: colors.textPrimary,
  },
});
