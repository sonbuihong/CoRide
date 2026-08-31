import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  Armchair,
  CalendarClock,
  CarFront,
  ChevronRight,
  CircleCheck,
  Clock3,
  MapPin,
  MessageCircle,
  Navigation,
  Route,
  UserRound,
  XCircle,
} from 'lucide-react-native';
import { AppText } from '../../components/ui/AppText';
import { nativeShadows } from '../../theme/shadows';
import { colors, radius, spacing } from '../../theme/tokens';
import type { ActivityAction, ActivityItem, ActivityRole } from './activity.types';
import {
  STATUS_LABELS,
  activityKindLabel,
  departureCountdown,
  formatActivityDate,
  formatActivityPrice,
  getActivityActions,
} from './activity.utils';

interface Props {
  item: ActivityItem;
  role: ActivityRole;
  now?: Date;
  compactLayout?: boolean;
  veryCompactLayout?: boolean;
  onAction: (action: ActivityAction) => void;
}

export function ActivityCard({ item, role, now, compactLayout = false, veryCompactLayout = false, onAction }: Props) {
  const compact = item.segment === 'COMPLETED' || item.segment === 'CANCELLED';
  const actions = getActivityActions(item, role);
  const formattedDate = formatActivityDate(item.departureTime);
  const countdown = item.segment === 'UPCOMING' ? departureCountdown(item.departureTime, now) : null;
  const formattedPrice = formatActivityPrice(item.price);
  const price = formattedPrice && item.source === 'CARPOOL_RIDE' ? `${formattedPrice}/ghế` : formattedPrice;

  return (
    <View
      accessibilityLabel={`${activityKindLabel(item.source)}, từ ${item.origin} đến ${item.destination}, ${STATUS_LABELS[item.status] || item.status}`}
      style={[styles.card, compactLayout && styles.cardNarrow, item.segment === 'ACTIVE' && styles.activeCard, compact && styles.compactCard]}
    >
      {item.segment === 'UPCOMING' && formattedDate ? (
        <View style={styles.departureHeader}>
          <CalendarClock size={18} color={colors.primary} />
          <View style={styles.departureCopy}>
            <AppText variant="caption" weight="semibold" style={styles.departureLabel}>KHỞI HÀNH</AppText>
            <AppText variant="bodySmall" weight="semibold">{formattedDate}</AppText>
          </View>
          {countdown ? <View style={styles.countdown}><AppText variant="caption" weight="semibold" style={styles.countdownText}>{countdown}</AppText></View> : null}
        </View>
      ) : null}

      <View style={[styles.topRow, veryCompactLayout && styles.topRowNarrow]}>
        <View style={styles.kindRow}>
          {item.source === 'RIDE_HAILING'
            ? <CarFront size={17} color={colors.primary} />
            : <Route size={17} color={role === 'DRIVER' ? colors.navigationDriver : colors.primary} />}
          <AppText variant="caption" weight="semibold" style={styles.kindLabel}>{activityKindLabel(item.source)}</AppText>
        </View>
        <StatusBadge item={item} role={role} />
      </View>

      <RouteSummary item={item} compact={compact} />

      {!compact ? (
        <View style={styles.metadata}>
          {item.segment !== 'UPCOMING' && formattedDate ? <Meta icon={<Clock3 size={16} color={colors.textMuted} />} text={formattedDate} /> : null}
          {item.relatedUser ? <Meta icon={<UserRound size={16} color={colors.textMuted} />} text={item.relatedUser.name} /> : null}
          {item.vehicle ? <Meta icon={<CarFront size={16} color={colors.textMuted} />} text={[item.vehicle.color, item.vehicle.licensePlate].filter(Boolean).join(' · ')} /> : null}
          {typeof item.seats === 'number' ? (
            <Meta
              icon={<Armchair size={16} color={colors.textMuted} />}
              text={role === 'DRIVER' && typeof item.availableSeats === 'number'
                ? `${item.seats} ghế đã đặt · ${item.availableSeats} ghế còn lại`
                : `${item.seats} ghế`}
            />
          ) : null}
          {typeof item.distanceKm === 'number' ? <Meta icon={<Navigation size={16} color={colors.textMuted} />} text={`${item.distanceKm.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`} /> : null}
        </View>
      ) : null}

      {item.segment === 'CANCELLED' && item.cancellationReason ? (
        <View style={styles.reason}>
          <AppText variant="caption" weight="semibold" style={styles.reasonLabel}>Lý do hủy</AppText>
          <AppText variant="bodySmall" style={styles.reasonText}>{item.cancellationReason}</AppText>
        </View>
      ) : null}

      <View
        style={[
          styles.footer,
          compact && styles.compactFooter,
          compactLayout && role === 'DRIVER' && styles.footerNarrow,
          role === 'PASSENGER' && styles.passengerFooter,
        ]}
      >
        {price ? <AppText variant="bodySmall" weight="semibold" style={[styles.price, role === 'PASSENGER' && styles.passengerPrice]}>{price}</AppText> : null}
        <View
          style={[
            styles.actions,
            compactLayout && role === 'DRIVER' && styles.actionsNarrow,
            veryCompactLayout && role === 'DRIVER' && styles.actionsVeryNarrow,
          ]}
        >
          {actions.map((action) => (
            <Pressable
              key={`${action.kind}:${action.label}`}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => onAction(action)}
              style={({ pressed }) => [
                styles.actionTouch,
                compactLayout && role === 'DRIVER' && styles.actionTouchNarrow,
                veryCompactLayout && role === 'DRIVER' && styles.actionTouchVeryNarrow,
                pressed && styles.actionPressed,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
              ]}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.actionSurface,
                  compactLayout && role === 'DRIVER' && styles.actionSurfaceFill,
                  action.kind === 'primary' ? styles.primaryAction : styles.secondaryAction,
                  action.kind === 'primary' && role === 'DRIVER' && styles.driverPrimaryAction,
                  action.kind === 'secondary' && role === 'DRIVER' && styles.driverSecondaryAction,
                ]}
              >
                {action.kind === 'secondary' ? <MessageCircle size={16} color={role === 'DRIVER' ? colors.navigationDriver : colors.primary} /> : null}
                <AppText variant="caption" weight="semibold" style={action.kind === 'primary' ? styles.primaryActionText : [styles.secondaryActionText, role === 'DRIVER' && styles.driverSecondaryActionText]}>{action.label}</AppText>
                {action.kind === 'primary' ? <ChevronRight size={16} color={colors.surface} /> : null}
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function StatusBadge({ item, role }: { item: ActivityItem; role: ActivityRole }) {
  const cancelled = item.segment === 'CANCELLED';
  const completed = item.segment === 'COMPLETED';
  const active = item.segment === 'ACTIVE';
  const activeColor = role === 'DRIVER' ? colors.navigationDriver : colors.primary;
  const activeBackground = role === 'DRIVER' ? colors.navigationDriverSoft : colors.primarySoft;
  const color = cancelled ? colors.danger : completed ? colors.success : active ? activeColor : colors.warning;
  const background = cancelled ? colors.dangerSoft : completed ? colors.successSoft : active ? activeBackground : colors.warningSoft;
  const Icon = cancelled ? XCircle : completed ? CircleCheck : active ? Navigation : CalendarClock;
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Icon size={15} color={color} />
      <AppText numberOfLines={1} variant="caption" weight="semibold" style={{ color }}>{STATUS_LABELS[item.status] || item.status}</AppText>
    </View>
  );
}

function RouteSummary({ item, compact }: { item: ActivityItem; compact: boolean }) {
  return (
    <View style={[styles.route, compact && styles.compactRoute]}>
      <View style={styles.routeRail}>
        <View style={styles.originDot} />
        <View style={styles.routeLine} />
        <MapPin size={15} color={colors.danger} fill={colors.dangerSoft} />
      </View>
      <View style={styles.routeText}>
        <AppText numberOfLines={compact ? 1 : 2} variant="bodySmall" weight="medium">{item.origin}</AppText>
        <View style={compact ? styles.compactGap : styles.routeGap} />
        <AppText numberOfLines={compact ? 1 : 2} variant="bodySmall" weight="semibold">{item.destination}</AppText>
      </View>
    </View>
  );
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <View style={styles.metaItem}>{icon}<AppText variant="caption" style={styles.metaText}>{text}</AppText></View>;
}

const styles = StyleSheet.create({
  card: {
    ...nativeShadows.card,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardNarrow: { padding: spacing.md },
  activeCard: { paddingTop: spacing.md },
  compactCard: { paddingBottom: spacing.md, paddingTop: spacing.md },
  departureHeader: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  departureCopy: { flex: 1 },
  departureLabel: { color: colors.primary, letterSpacing: 0.3 },
  countdown: { backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  countdownText: { color: colors.primary },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  topRowNarrow: { alignItems: 'flex-start', flexWrap: 'wrap' },
  kindRow: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: spacing.xs, minWidth: 0 },
  kindLabel: { color: colors.textSecondary },
  badge: { alignItems: 'center', borderRadius: radius.full, flexDirection: 'row', gap: spacing.xs, maxWidth: '68%', minHeight: 32, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  route: { flexDirection: 'row', marginTop: spacing.lg },
  compactRoute: { marginTop: spacing.md },
  routeRail: { alignItems: 'center', width: 22 },
  originDot: { backgroundColor: colors.success, borderRadius: 5, height: 10, marginTop: 5, width: 10 },
  routeLine: { backgroundColor: colors.borderStrong, flex: 1, marginVertical: 3, minHeight: 16, width: 1 },
  routeText: { flex: 1, paddingLeft: spacing.sm },
  routeGap: { height: spacing.lg },
  compactGap: { height: spacing.sm },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  metaItem: { alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm, flexDirection: 'row', gap: spacing.xs, maxWidth: '100%', minHeight: 32, paddingHorizontal: spacing.sm },
  metaText: { color: colors.textSecondary, flexShrink: 1 },
  reason: { backgroundColor: colors.dangerSoft, borderRadius: radius.sm, marginTop: spacing.md, padding: spacing.md },
  reasonLabel: { color: colors.danger, marginBottom: spacing.xs },
  reasonText: { color: colors.textPrimary },
  footer: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', marginTop: spacing.lg },
  compactFooter: { marginTop: spacing.md },
  footerNarrow: { alignItems: 'stretch', flexDirection: 'column' },
  passengerFooter: { flexWrap: 'wrap', justifyContent: 'flex-end' },
  price: { color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  passengerPrice: { marginRight: 'auto' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-end' },
  actionsNarrow: { justifyContent: 'space-between', width: '100%' },
  actionsVeryNarrow: { flexDirection: 'column' },
  actionTouch: { borderRadius: radius.full, minHeight: 48 },
  actionTouchNarrow: { flexGrow: 1 },
  actionTouchVeryNarrow: { width: '100%' },
  actionSurface: { alignItems: 'center', borderRadius: radius.full, flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  actionSurfaceFill: { width: '100%' },
  primaryAction: { backgroundColor: colors.primary },
  driverPrimaryAction: { backgroundColor: colors.navigationDriver },
  secondaryAction: { backgroundColor: colors.primarySoft },
  driverSecondaryAction: { backgroundColor: colors.navigationDriverSoft },
  primaryActionText: { color: colors.surface },
  secondaryActionText: { color: colors.primary },
  driverSecondaryActionText: { color: colors.navigationDriver },
  actionPressed: { opacity: 0.72 },
});
