import React, { useState } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import {
  CalendarDays, CarFront, ChevronRight, CircleUserRound,
  Clock3, MapPinned, MessageCircle, Plus, Route, Star, Users, WalletCards,
} from 'lucide-react-native';
import { Image, PixelRatio, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { DriverBookingSummary } from '../../services/booking.service';
import type { Ride } from '../../services/ride.service';
import { colors, layout, radius, spacing } from '../../theme/tokens';
import { AppText } from '../ui/AppText';

const HERO = require('../../../assets/images/driver-home-hero.png');

const money = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
const passengerName = (firstName?: string, lastName?: string) =>
  [firstName, lastName].filter(Boolean).join(' ') || 'Hành khách CoRide';

function ActionPressable({ children, onPress, label, style, disabled, busy }: {
  children: React.ReactNode; onPress: () => void; label: string; style?: object; disabled?: boolean; busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled}
      accessibilityState={{ disabled, busy }} style={({ pressed }) => [style, pressed && styles.pressed, disabled && styles.disabled]}
    >{children}</Pressable>
  );
}

export function DriverHero({ firstName, onCreate }: { firstName?: string; onCreate: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  return (
    <View>
      <View style={styles.hero}>
        <View style={[styles.heroCopy, compact && styles.heroCopyCompact]}>
          <AppText accessibilityRole="header" style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
            Chào {firstName || 'Tài xế'},
          </AppText>
          <AppText accessibilityRole="header" style={[styles.heroAccent, compact && styles.heroTitleCompact]}>hôm nay bạn muốn đi đâu?</AppText>
          <AppText style={styles.heroSubtitle}>Chia sẻ hành trình, tìm hành khách cùng tuyến và tối ưu chi phí di chuyển.</AppText>
        </View>
        <Image source={HERO} resizeMode="contain" style={[styles.heroImage, compact && styles.heroImageCompact]} accessibilityIgnoresInvertColors />
      </View>
      <ActionPressable label="Đăng chuyến đi mới" onPress={onCreate} style={styles.primaryCta}>
        <View style={styles.primaryIcon}><Plus size={30} color={colors.navigationDriver} strokeWidth={2.2} /></View>
        <View style={styles.primaryCopy}>
          <AppText weight="bold" style={styles.primaryTitle}>Đăng chuyến đi</AppText>
          <AppText style={styles.primarySubtitle}>Tạo hành trình và tìm hành khách cùng đi</AppText>
        </View>
        <ChevronRight size={30} color={colors.surface} strokeWidth={2.2} />
      </ActionPressable>
    </View>
  );
}

function SectionHeader({ title, count, action = 'Xem tất cả', onPress }: { title: string; count?: number; action?: string; onPress?: () => void }) {
  return <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleRow}><AppText accessibilityRole="header" weight="bold" style={styles.sectionTitle}>{title}</AppText>{count ? <View style={styles.countBadge}><AppText style={styles.countText}>{count}</AppText></View> : null}</View>
    {onPress ? <ActionPressable label={`${action} ${title}`} onPress={onPress} style={styles.sectionAction}><AppText weight="semibold" style={styles.sectionActionText}>{action}</AppText><ChevronRight size={17} color={colors.navigationDriver} /></ActionPressable> : null}
  </View>;
}

function PassengerAvatar({ booking }: { booking: DriverBookingSummary }) {
  const [failed, setFailed] = useState(false);
  const name = passengerName(booking.passenger.firstName, booking.passenger.lastName);
  return <View style={styles.passengerAvatarWrap}>
    {booking.passenger.avatarUrl && !failed ? <Image source={{ uri: booking.passenger.avatarUrl }} onError={() => setFailed(true)} style={styles.passengerAvatar} /> : <AppText weight="bold" style={styles.passengerInitial}>{name[0]}</AppText>}
  </View>;
}

export function BookingRequestList({ bookings, onAll, onOpen }: { bookings: DriverBookingSummary[]; onAll: () => void; onOpen: (id: string) => void }) {
  if (!bookings.length) return <View style={styles.sectionCard}><SectionHeader title="Yêu cầu đặt chỗ mới" onPress={onAll} /><View style={styles.emptyState}><Users size={23} color={colors.navigationDriver} /><View style={styles.emptyCopy}><AppText weight="semibold">Chưa có yêu cầu mới</AppText><AppText variant="caption">Yêu cầu phù hợp sẽ xuất hiện tại đây.</AppText></View></View></View>;
  return <View style={styles.sectionCard}>
    <SectionHeader title="Yêu cầu đặt chỗ mới" count={bookings.length} onPress={onAll} />
    <View style={styles.requestList}>{bookings.slice(0, 2).map((booking, index) => {
      const name = passengerName(booking.passenger.firstName, booking.passenger.lastName);
      const score = booking.matching?.matchScore;
      return <View key={booking.id} style={[styles.requestItem, index > 0 && styles.requestDivider]}>
        <PassengerAvatar booking={booking} />
        <View style={styles.requestBody}>
          <View style={styles.requestTop}><AppText numberOfLines={1} weight="bold" style={styles.requestName}>{name}</AppText><AppText weight="bold" style={styles.requestPrice}>{money(booking.totalPrice || 0)}</AppText></View>
          <View style={styles.requestRoute}><AppText numberOfLines={1} style={styles.routePlace}>{booking.pickupAddress || booking.ride.origin}</AppText><ChevronRight size={16} color={colors.navigationDriver} /><AppText numberOfLines={1} style={styles.routePlace}>{booking.dropoffAddress || booking.ride.destination}</AppText></View>
          <View style={styles.requestMeta}>
            <View style={styles.matchTag}><Star size={14} color={colors.navigationDriver} /><AppText variant="caption">{score == null ? 'Yêu cầu mới' : <>Phù hợp <AppText variant="caption" weight="bold" style={styles.greenText}>{score}%</AppText></>}</AppText></View>
            {booking.additionalTimeMinutes != null ? <View style={styles.detourTag}><Clock3 size={14} color={colors.warning} /><AppText variant="caption" style={styles.warningText}>+{booking.additionalTimeMinutes} phút lệch tuyến</AppText></View> : null}
            <View style={styles.seatMeta}><CircleUserRound size={15} color={colors.textSecondary} /><AppText variant="caption">{booking.seats}</AppText></View>
            <ActionPressable label={`Xem yêu cầu của ${name}`} onPress={() => onOpen(booking.id)} style={styles.requestButton}><AppText weight="semibold" style={styles.requestButtonText}>Xem yêu cầu</AppText></ActionPressable>
          </View>
        </View>
      </View>;
    })}</View>
    <View style={styles.helperNote}><Clock3 size={15} color={colors.textSecondary} /><AppText variant="caption">Hãy phản hồi sớm để giữ uy tín và không bỏ lỡ hành khách.</AppText></View>
  </View>;
}

function departureParts(value: string) {
  const date = new Date(value);
  return { day: isToday(date) ? 'Hôm nay' : isTomorrow(date) ? 'Ngày mai' : format(date, 'dd/MM'), time: format(date, 'HH:mm') };
}

export function UpcomingTripCard({ ride, passengerCount, onAll, onOpen }: { ride: Ride; passengerCount: number; onAll: () => void; onOpen: () => void }) {
  const date = departureParts(ride.departureTime);
  const booked = ride.bookedSeats ?? Math.max(0, (ride.totalSeats ?? 0) - (ride.availableSeats ?? 0));
  const vehicle = [ride.driver?.vehicle?.brand, ride.driver?.vehicle?.model].filter(Boolean).join(' ') || 'Phương tiện của bạn';
  return <View style={styles.sectionCard}>
    <SectionHeader title="Chuyến đi sắp tới" onPress={onAll} />
    <View style={styles.tripCard}>
      <View style={styles.tripTime}><CalendarDays size={21} color={colors.navigationDriver} /><AppText style={styles.tripDay}>{date.day}</AppText><AppText weight="bold" style={styles.tripHour}>{date.time}</AppText></View>
      <View style={styles.timeline}><View style={styles.timelineDotStart} /><View style={styles.timelineLine} /><View style={styles.timelineDotEnd} /></View>
      <View style={styles.tripRouteCopy}>
        <AppText numberOfLines={1} weight="bold">{ride.departure || ride.origin}</AppText><AppText numberOfLines={1} variant="caption">Điểm khởi hành</AppText>
        <View style={styles.routeGap} /><AppText numberOfLines={1} weight="bold">{ride.destination}</AppText><AppText numberOfLines={1} variant="caption">Điểm đến</AppText>
      </View>
      <View style={styles.mapBadge}><MapPinned size={24} color={colors.navigationDriver} /></View>
    </View>
    <View style={styles.tripFooter}>
      <View style={styles.tripChip}><CarFront size={16} color={colors.textSecondary} /><AppText variant="caption">{vehicle}</AppText></View>
      <View style={styles.tripChip}><Route size={16} color={colors.textSecondary} /><AppText variant="caption">{booked}/{ride.totalSeats} ghế đã đặt</AppText></View>
      <View style={styles.tripChip}><Users size={16} color={colors.textSecondary} /><AppText variant="caption">{passengerCount} hành khách</AppText></View>
      <ActionPressable label="Xem chi tiết chuyến đi" onPress={onOpen} style={styles.detailButton}><AppText weight="semibold" style={styles.detailButtonText}>Xem chi tiết</AppText></ActionPressable>
    </View>
  </View>;
}

export function UpcomingTripEmpty({ onAll, onCreate }: { onAll: () => void; onCreate: () => void }) {
  return <View style={styles.sectionCard}><SectionHeader title="Chuyến đi sắp tới" onPress={onAll} /><ActionPressable label="Đăng chuyến đi đầu tiên" onPress={onCreate} style={styles.emptyState}><CalendarDays size={23} color={colors.navigationDriver} /><View style={styles.emptyCopy}><AppText weight="semibold">Chưa có chuyến sắp tới</AppText><AppText variant="caption">Đăng một hành trình để bắt đầu tìm người đi cùng.</AppText></View><ChevronRight size={18} color={colors.navigationDriver} /></ActionPressable></View>;
}

export function TodayOverviewStats({ rides, passengers, sharedCost, rating, onDetails }: { rides: number; passengers: number; sharedCost: number; rating?: number; onDetails: () => void }) {
  const { width } = useWindowDimensions();
  const wrap = width < 360 || PixelRatio.getFontScale() > 1.15;
  const stats = [
    { label: 'Chuyến đi', value: rides, icon: Route, color: colors.navigationDriver },
    { label: 'Hành khách', value: passengers, icon: Users, color: '#2583F7' },
    { label: 'Chia sẻ chi phí', value: money(sharedCost), icon: WalletCards, color: '#F59E0B' },
    { label: 'Đánh giá', value: rating?.toFixed(1) ?? '—', icon: Star, color: '#7457D6' },
  ];
  return <View style={styles.sectionCard}><SectionHeader title="Tổng quan hôm nay" action="Xem chi tiết" onPress={onDetails} /><View style={styles.statsGrid}>{stats.map((item) => <View key={item.label} style={[styles.statItem, wrap && styles.halfItem]}><item.icon size={25} color={item.color} strokeWidth={2.2} /><AppText weight="bold" style={styles.statValue}>{item.value}</AppText><AppText variant="caption" numberOfLines={wrap ? 2 : 1}>{item.label}</AppText></View>)}</View></View>;
}

export function QuickToolsGrid({ onRequests, onMessages, onWallet, onVehicles }: { onRequests: () => void; onMessages: () => void; onWallet: () => void; onVehicles: () => void }) {
  const { width } = useWindowDimensions();
  const wrap = width < 360 || PixelRatio.getFontScale() > 1.15;
  const tools = [
    { label: 'Yêu cầu đặt chỗ', icon: Users, color: colors.navigationDriver, onPress: onRequests },
    { label: 'Tin nhắn', icon: MessageCircle, color: '#2583F7', onPress: onMessages },
    { label: 'Ví & Giao dịch', icon: WalletCards, color: '#F59E0B', onPress: onWallet },
    { label: 'Phương tiện của tôi', icon: CarFront, color: '#7457D6', onPress: onVehicles },
  ];
  return <View style={styles.sectionCard}><SectionHeader title="Công cụ nhanh" />
    <View style={styles.toolsGrid}>{tools.map((tool) => <ActionPressable key={tool.label} label={tool.label} onPress={tool.onPress} style={wrap ? styles.toolItemHalf : styles.toolItem}><tool.icon size={24} color={tool.color} strokeWidth={2.2} /><AppText weight="semibold" style={styles.toolLabel}>{tool.label}</AppText></ActionPressable>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 }, disabled: { opacity: 0.55 },
  hero: { minHeight: 208, overflow: 'hidden', position: 'relative' }, heroCopy: { paddingTop: spacing.xl, width: '58%', zIndex: 2 }, heroCopyCompact: { width: '88%' }, heroTitle: { color: '#0F2340', fontSize: 30, fontWeight: '700', letterSpacing: -0.8, lineHeight: 36 }, heroAccent: { color: colors.navigationDriver, fontSize: 30, fontWeight: '700', letterSpacing: -0.8, lineHeight: 36 }, heroTitleCompact: { fontSize: 27, lineHeight: 33 }, heroSubtitle: { color: colors.textSecondary, lineHeight: 23, marginTop: spacing.md, maxWidth: 380 }, heroImage: { bottom: -8, height: 205, position: 'absolute', right: -58, width: '64%' }, heroImageCompact: { height: 135, opacity: 0.18, right: -70, width: '72%' },
  primaryCta: { alignItems: 'center', backgroundColor: colors.navigationDriver, borderRadius: 18, elevation: 5, flexDirection: 'row', gap: spacing.md, minHeight: 88, paddingHorizontal: spacing.md, shadowColor: colors.navigationDriver, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 }, primaryIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 28, height: 56, justifyContent: 'center', width: 56 }, primaryCopy: { flex: 1, minWidth: 0 }, primaryTitle: { color: colors.surface, fontSize: 20, lineHeight: 26 }, primarySubtitle: { color: colors.surface, fontSize: 13, marginTop: 2 },
  sectionCard: { backgroundColor: colors.surface, borderRadius: 18, elevation: 3, marginTop: spacing.lg, padding: spacing.md, shadowColor: '#0F2340', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.07, shadowRadius: 18 }, sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 48 }, sectionTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs }, sectionTitle: { color: '#0F2340', fontSize: 17, lineHeight: 22 }, countBadge: { alignItems: 'center', backgroundColor: colors.danger, borderRadius: 12, height: 24, justifyContent: 'center', minWidth: 24, paddingHorizontal: 6 }, countText: { color: colors.surface, fontSize: 12, fontWeight: '700', lineHeight: 15 }, sectionAction: { alignItems: 'center', flexDirection: 'row', minHeight: 48 }, sectionActionText: { color: colors.navigationDriver, fontSize: 13 },
  emptyState: { alignItems: 'center', backgroundColor: colors.navigationDriverSoft, borderRadius: 13, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, minHeight: 72, padding: spacing.md }, emptyCopy: { flex: 1 }, requestList: { borderColor: colors.border, borderRadius: 14, borderWidth: 1, marginTop: spacing.xs, paddingHorizontal: spacing.sm }, requestItem: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md }, requestDivider: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }, passengerAvatarWrap: { alignItems: 'center', backgroundColor: colors.navigationDriverSoft, borderRadius: 24, height: 48, justifyContent: 'center', position: 'relative', width: 48 }, passengerAvatar: { borderRadius: 24, height: 48, width: 48 }, passengerInitial: { color: colors.navigationDriver }, requestBody: { flex: 1, minWidth: 0 }, requestTop: { flexDirection: 'row', gap: spacing.xs, justifyContent: 'space-between' }, requestName: { color: '#0F2340', flex: 1 }, requestPrice: { color: colors.navigationDriver, fontSize: 14 }, requestRoute: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 3 }, routePlace: { color: colors.textPrimary, flexShrink: 1, fontSize: 13 }, requestMeta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm }, matchTag: { alignItems: 'center', backgroundColor: colors.navigationDriverSoft, borderRadius: 8, flexDirection: 'row', gap: 4, minHeight: 30, paddingHorizontal: 8 }, detourTag: { alignItems: 'center', backgroundColor: colors.warningSoft, borderRadius: 8, flexDirection: 'row', gap: 4, minHeight: 30, paddingHorizontal: 8 }, greenText: { color: colors.navigationDriver }, warningText: { color: colors.warning }, seatMeta: { alignItems: 'center', flexDirection: 'row', gap: 4, marginLeft: 'auto' }, requestButton: { alignItems: 'center', borderColor: colors.navigationDriver, borderRadius: 9, borderWidth: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.sm }, requestButtonText: { color: colors.navigationDriver, fontSize: 12 }, helperNote: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, paddingHorizontal: 2 },
  tripCard: { alignItems: 'stretch', borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', marginTop: spacing.xs, minHeight: 112, padding: spacing.md }, tripTime: { alignItems: 'center', borderRightColor: colors.border, borderRightWidth: 1, justifyContent: 'center', paddingRight: spacing.md, width: 78 }, tripDay: { fontSize: 12, marginTop: 5 }, tripHour: { color: '#0F2340', fontSize: 21, marginTop: 2 }, timeline: { alignItems: 'center', marginHorizontal: spacing.md, paddingVertical: 8, width: 12 }, timelineDotStart: { backgroundColor: colors.navigationDriver, borderRadius: 5, height: 10, width: 10 }, timelineLine: { borderLeftColor: colors.borderStrong, borderLeftWidth: 1, borderStyle: 'dashed', flex: 1 }, timelineDotEnd: { backgroundColor: colors.warning, borderRadius: 5, height: 10, width: 10 }, tripRouteCopy: { flex: 1, justifyContent: 'center', minWidth: 0 }, routeGap: { height: spacing.sm }, mapBadge: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.navigationDriverSoft, borderRadius: 26, height: 52, justifyContent: 'center', width: 52 }, tripFooter: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm }, tripChip: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 9, flexDirection: 'row', gap: 5, minHeight: 34, paddingHorizontal: spacing.sm }, detailButton: { alignItems: 'center', backgroundColor: colors.navigationDriver, borderRadius: 9, justifyContent: 'center', marginLeft: 'auto', minHeight: 48, paddingHorizontal: spacing.md }, detailButtonText: { color: colors.surface, fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }, statItem: { alignItems: 'center', borderColor: colors.border, borderRadius: 13, borderWidth: 1, flex: 1, minWidth: 0, paddingHorizontal: 4, paddingVertical: spacing.md }, halfItem: { flexBasis: '48%', flexGrow: 1 }, statValue: { color: '#0F2340', fontSize: 18, marginTop: 8 }, toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }, toolItem: { alignItems: 'center', borderColor: colors.border, borderRadius: 13, borderWidth: 1, flex: 1, gap: spacing.xs, justifyContent: 'center', minHeight: 86, paddingHorizontal: 6 }, toolItemHalf: { alignItems: 'center', borderColor: colors.border, borderRadius: 13, borderWidth: 1, flexBasis: '48%', flexGrow: 1, gap: spacing.xs, justifyContent: 'center', minHeight: 88, paddingHorizontal: 6 }, toolLabel: { color: '#0F2340', fontSize: 12, lineHeight: 16, textAlign: 'center' },
});
