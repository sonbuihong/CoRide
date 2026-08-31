import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityActionEvent, Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Bell, Calendar, CheckCircle2, ChevronRight, Info, Star, Trash2, XCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationRealtime } from '../../hooks/useNotificationRealtime';
import { Notification, notificationService } from '../../services/notification.service';
import { colors, layout, radius, spacing, typography } from '../../theme/tokens';
import { NotificationSwipeRow, type NotificationSwipeRowHandle } from './NotificationSwipeRow';

const QUERY_KEY = ['notifications'] as const;
const UNDO_DURATION = 5000;
type Filter = 'all' | 'unread';
type DeletedNotification = { item: Notification; index: number };
type ListRow = { kind: 'section'; id: string; title: string } | { kind: 'notification'; id: string; item: Notification };

function NotificationIcon({ type, color }: { type: string; color: string }) {
  if (type === 'BOOKING_REQUEST') return <Calendar size={20} color={color} />;
  if (type === 'BOOKING_STATUS' || type === 'BOOKING_ACCEPTED') return <CheckCircle2 size={20} color={color} />;
  if (type === 'BOOKING_REJECTED' || type === 'RIDE_CANCELLED') return <XCircle size={20} color={colors.error} />;
  if (type === 'NEW_REVIEW' || type === 'REVIEW_RECEIVED') return <Star size={20} color="#B45309" />;
  return <Info size={20} color={color} />;
}

function groupTitle(date: Date) {
  if (isToday(date)) return 'Hôm nay';
  if (isYesterday(date)) return 'Hôm qua';
  return 'Trước đó';
}

function SkeletonList() {
  return <View accessibilityLabel="Đang tải thông báo" style={styles.skeletonList}>{[0, 1, 2].map((key) => <View key={key} style={styles.skeletonCard}><View style={styles.skeletonIcon} /><View style={styles.skeletonCopy}><View style={styles.skeletonTitle} /><View style={styles.skeletonLine} /><View style={styles.skeletonDate} /></View></View>)}</View>;
}

export function NotificationsScreen({ mode }: { mode: 'passenger' | 'driver' }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const openSwipeable = useRef<NotificationSwipeRowHandle | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDelete = useRef<Promise<unknown> | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [deleted, setDeleted] = useState<DeletedNotification | null>(null);
  const accent = mode === 'driver' ? colors.navigationDriver : colors.navigationPassenger;
  const accentSoft = mode === 'driver' ? colors.navigationDriverSoft : colors.navigationPassengerSoft;
  const listWidth = Math.max(0, Math.min(width, layout.maxContentWidth) - spacing.screen * 2);
  const deleteActionWidth = Math.max(layout.minTouchTarget, listWidth * 0.2);
  useNotificationRealtime();

  const { data = [], isLoading, isError, refetch, isRefetching } = useQuery({ queryKey: QUERY_KEY, queryFn: notificationService.getNotifications });
  const unreadCount = data.filter((item) => !item.isRead).length;
  const rows = useMemo<ListRow[]>(() => {
    const visible = filter === 'unread' ? data.filter((item) => !item.isRead) : data;
    const result: ListRow[] = [];
    let previous = '';
    visible.forEach((item) => {
      const title = groupTitle(new Date(item.createdAt));
      if (title !== previous) { result.push({ kind: 'section', id: `section-${title}`, title }); previous = title; }
      result.push({ kind: 'notification', id: item.id, item });
    });
    return result;
  }, [data, filter]);

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);
  const showUndo = (value: DeletedNotification) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setDeleted(value);
    undoTimer.current = setTimeout(() => setDeleted((current) => current?.item.id === value.item.id ? null : current), UNDO_DURATION);
  };

  const markRead = useMutation({
    mutationFn: notificationService.markAsRead,
    onMutate: (id) => queryClient.setQueryData<Notification[]>(QUERY_KEY, (current = []) => current.map((item) => item.id === id ? { ...item, isRead: true } : item)),
    onError: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEY }); Alert.alert('Không thể cập nhật', 'Vui lòng thử lại.'); },
  });
  const remove = useMutation({
    mutationFn: notificationService.deleteNotification,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Notification[]>(QUERY_KEY) ?? [];
      const index = previous.findIndex((item) => item.id === id);
      if (index >= 0) { queryClient.setQueryData<Notification[]>(QUERY_KEY, previous.filter((item) => item.id !== id)); showUndo({ item: previous[index], index }); }
      openSwipeable.current?.close();
      return { previous, id };
    },
    onError: (_error, _id, context) => { if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous); setDeleted(null); Alert.alert('Không thể xóa thông báo', 'Thông báo đã được khôi phục. Vui lòng thử lại.'); },
  });
  const restore = useMutation({
    mutationFn: ({ item }: DeletedNotification) => notificationService.restoreNotification(item.id),
    onMutate: async (value) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      queryClient.setQueryData<Notification[]>(QUERY_KEY, (current = []) => { const next = [...current]; next.splice(Math.min(value.index, next.length), 0, value.item); return next; });
      if (undoTimer.current) clearTimeout(undoTimer.current); setDeleted(null); return value;
    },
    onError: (_error, value) => { queryClient.setQueryData<Notification[]>(QUERY_KEY, (current = []) => current.filter((item) => item.id !== value.item.id)); Alert.alert('Không thể hoàn tác', 'Vui lòng thử lại.'); },
  });

  const markAllAsRead = async () => {
    const previous = queryClient.getQueryData<Notification[]>(QUERY_KEY) ?? [];
    queryClient.setQueryData<Notification[]>(QUERY_KEY, previous.map((item) => ({ ...item, isRead: true })));
    try { await notificationService.markAllAsRead(); } catch { queryClient.setQueryData(QUERY_KEY, previous); Alert.alert('Không thể cập nhật', 'Vui lòng thử lại.'); }
  };
  const openTarget = (item: Notification) => {
    if (!item.isRead) markRead.mutate(item.id);
    if (!item.targetId || !item.targetType) return;
    const route = item.targetType === 'BOOKING' ? `/booking/${item.targetId}` : item.targetType === 'TRIP' ? `/trip/${item.targetId}` : `/ride/${item.targetId}`;
    router.push(route as never);
  };

  const renderNotification = (item: Notification) => {
    let swipeable: NotificationSwipeRowHandle | null = null;
    const deleteItem = () => { if (!remove.isPending) pendingDelete.current = remove.mutateAsync(item.id).catch(() => undefined); };
    const onAccessibilityAction = (event: AccessibilityActionEvent) => { if (event.nativeEvent.actionName === 'delete') deleteItem(); };
    const deleteButton = <Pressable accessibilityRole="button" accessibilityLabel={`Xóa thông báo ${item.title}`} disabled={remove.isPending} onPress={deleteItem} style={({ pressed }) => [styles.deleteAction, pressed && styles.deleteActionPressed, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}><Trash2 size={22} color="#FFFFFF" /></Pressable>;
    const webKeyboardProps = Platform.OS === 'web' ? { onKeyDown: (event: any) => { if (event.nativeEvent?.key === 'Delete') { event.preventDefault?.(); deleteItem(); } } } : {};
    const card = <Pressable {...webKeyboardProps} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.message}. ${item.isRead ? 'Đã đọc' : 'Chưa đọc'}`} accessibilityHint={item.targetId ? 'Mở nội dung liên quan' : 'Đánh dấu đã đọc'} accessibilityActions={[{ name: 'delete', label: 'Xóa thông báo' }]} onAccessibilityAction={onAccessibilityAction} onPress={() => openTarget(item)} style={({ pressed }) => [styles.card, !item.isRead && styles.unreadCard, pressed && styles.cardPressed, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}>
      <View style={[styles.iconBox, { backgroundColor: item.isRead ? colors.surfaceSecondary : accentSoft }]}><NotificationIcon type={item.type} color={item.isRead ? colors.textSecondary : accent} /></View>
      <View style={styles.copy}><View style={styles.titleRow}><Text numberOfLines={2} style={[styles.title, !item.isRead && styles.unreadTitle]}>{item.title}</Text>{!item.isRead ? <View style={[styles.unreadDot, { backgroundColor: accent }]} /> : null}</View><Text numberOfLines={3} style={styles.message}>{item.message}</Text><Text style={styles.date}>{format(new Date(item.createdAt), 'HH:mm · dd MMM', { locale: vi })}</Text></View>
      {item.targetId ? <ChevronRight accessibilityElementsHidden size={18} color={colors.textTertiary} style={styles.chevron} /> : null}
    </Pressable>;
    return <View style={styles.rowShell}><NotificationSwipeRow ref={(value) => { swipeable = value; }} actionWidth={deleteActionWidth} rightAction={deleteButton} onWillOpen={() => { if (openSwipeable.current && openSwipeable.current !== swipeable) openSwipeable.current.close(); openSwipeable.current = swipeable; }} onClose={() => { if (openSwipeable.current === swipeable) openSwipeable.current = null; }}>{card}</NotificationSwipeRow></View>;
  };

  const empty = filter === 'unread' ? { title: 'Bạn đã đọc hết thông báo', body: 'Thông báo chưa đọc mới sẽ xuất hiện tại đây.' } : { title: 'Bạn chưa có thông báo nào', body: 'Các cập nhật về chuyến đi sẽ xuất hiện tại đây.' };
  return <View style={styles.screen}>
    <View style={styles.header}><View><Text accessibilityRole="header" style={styles.heading}>Thông báo</Text><Text style={styles.subtitle}>{unreadCount ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã cập nhật tất cả'}</Text></View>{unreadCount > 0 ? <Pressable accessibilityRole="button" onPress={markAllAsRead} style={({ pressed }) => [styles.markAll, { backgroundColor: accentSoft }, pressed && styles.cardPressed]}><CheckCircle2 size={16} color={accent} /><Text style={[styles.markAllLabel, { color: accent }]}>Đọc tất cả</Text></Pressable> : null}</View>
    <View accessibilityRole="tablist" style={styles.filters}>{(['all', 'unread'] as Filter[]).map((value) => { const selected = filter === value; return <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setFilter(value)} style={[styles.filterButton, selected && { backgroundColor: accent }]}><Text style={[styles.filterLabel, selected && styles.filterLabelSelected]}>{value === 'all' ? 'Tất cả' : `Chưa đọc${unreadCount ? ` (${unreadCount})` : ''}`}</Text></Pressable>; })}</View>
    {isLoading ? <SkeletonList /> : isError ? <View style={styles.empty}><View style={styles.emptyIcon}><Bell size={32} color={colors.error} /></View><Text style={styles.emptyTitle}>Không thể tải thông báo</Text><Text style={styles.emptyBody}>Kiểm tra kết nối rồi thử lại.</Text><Pressable accessibilityRole="button" onPress={() => refetch()} style={[styles.retryButton, { backgroundColor: accent }]}><Text style={styles.retryText}>Thử lại</Text></Pressable></View> : rows.length === 0 ? <View style={styles.empty}><View style={styles.emptyIcon}><Bell size={34} color={colors.textTertiary} /></View><Text style={styles.emptyTitle}>{empty.title}</Text><Text style={styles.emptyBody}>{empty.body}</Text></View> : <FlatList data={rows} keyExtractor={(row) => row.id} style={styles.listFrame} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} onScrollBeginDrag={() => openSwipeable.current?.close()} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={accent} />} renderItem={({ item }) => item.kind === 'section' ? <Text style={styles.sectionTitle}>{item.title}</Text> : renderNotification(item.item)} />}
    {deleted ? <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.snackbar, { bottom: Math.max(spacing.sm, insets.bottom) }]}><Text style={styles.snackbarText}>Đã xóa thông báo</Text><Pressable accessibilityRole="button" disabled={restore.isPending} onPress={async () => { await pendingDelete.current; restore.mutate(deleted); }} style={styles.undoButton}><Text style={styles.undoText}>{restore.isPending ? 'Đang hoàn tác…' : 'Hoàn tác'}</Text></Pressable></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 }, header: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', maxWidth: layout.maxContentWidth, paddingHorizontal: spacing.screen, paddingTop: spacing.sm, width: '100%' }, heading: { color: colors.textPrimary, fontSize: 25, fontWeight: '700', letterSpacing: -0.5, lineHeight: 32 }, subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 2 }, markAll: { alignItems: 'center', borderRadius: radius.pill, flexDirection: 'row', gap: 6, minHeight: layout.minTouchTarget, paddingHorizontal: spacing.sm }, markAllLabel: { fontSize: 13, fontWeight: '700' },
  filters: { alignSelf: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, flexDirection: 'row', marginHorizontal: spacing.screen, marginTop: spacing.sm, maxWidth: layout.maxContentWidth - spacing.screen * 2, padding: 4, width: '90%' }, filterButton: { alignItems: 'center', borderRadius: radius.pill, flex: 1, justifyContent: 'center', minHeight: 40 }, filterLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' }, filterLabelSelected: { color: '#FFFFFF' },
  listFrame: { alignSelf: 'center', maxWidth: layout.maxContentWidth, width: '100%' }, list: { paddingBottom: 96, paddingHorizontal: spacing.screen }, sectionTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 0.2, marginBottom: spacing.xs, marginTop: spacing.md }, rowShell: { borderRadius: radius.card, marginBottom: spacing.xs, overflow: 'hidden' }, card: { alignItems: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, flexDirection: 'row', minHeight: 104, padding: spacing.sm }, unreadCard: { borderColor: '#D6E9FF' }, cardPressed: { opacity: 0.78 }, iconBox: { alignItems: 'center', borderRadius: radius.pill, height: 42, justifyContent: 'center', marginRight: spacing.sm, width: 42 }, copy: { flex: 1, minWidth: 0 }, titleRow: { alignItems: 'flex-start', flexDirection: 'row' }, title: { color: colors.textPrimary, flex: 1, fontSize: 15, fontWeight: '500', lineHeight: 21 }, unreadTitle: { fontWeight: '700' }, message: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 3 }, date: { color: colors.textTertiary, fontSize: 12, lineHeight: typography.caption.lineHeight, marginTop: spacing.xxs }, unreadDot: { borderRadius: radius.pill, height: 8, marginLeft: spacing.xs, marginTop: 6, width: 8 }, chevron: { marginLeft: 4, marginTop: 12 }, deleteAction: { alignItems: 'center', backgroundColor: colors.error, flex: 1, justifyContent: 'center', minWidth: layout.minTouchTarget }, deleteActionPressed: { backgroundColor: '#B91C1C' },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 96, paddingHorizontal: spacing.screen }, emptyIcon: { alignItems: 'center', backgroundColor: colors.surfaceSecondary, borderRadius: radius.pill, height: 72, justifyContent: 'center', marginBottom: spacing.sm, width: 72 }, emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', textAlign: 'center' }, emptyBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: spacing.xxs, textAlign: 'center' }, retryButton: { alignItems: 'center', borderRadius: radius.pill, justifyContent: 'center', marginTop: spacing.sm, minHeight: layout.minTouchTarget, paddingHorizontal: spacing.md }, retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  skeletonList: { alignSelf: 'center', maxWidth: layout.maxContentWidth, padding: spacing.screen, width: '100%' }, skeletonCard: { backgroundColor: colors.surface, borderRadius: radius.card, flexDirection: 'row', marginBottom: spacing.xs, minHeight: 104, padding: spacing.sm }, skeletonIcon: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.pill, height: 42, width: 42 }, skeletonCopy: { flex: 1, marginLeft: spacing.sm }, skeletonTitle: { backgroundColor: colors.surfaceSecondary, borderRadius: 4, height: 16, width: '55%' }, skeletonLine: { backgroundColor: colors.surfaceSecondary, borderRadius: 4, height: 14, marginTop: 10, width: '90%' }, skeletonDate: { backgroundColor: colors.surfaceSecondary, borderRadius: 4, height: 11, marginTop: 10, width: '32%' },
  snackbar: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.textPrimary, borderRadius: radius.button, elevation: 8, flexDirection: 'row', left: spacing.screen, maxWidth: layout.maxContentWidth - spacing.screen * 2, minHeight: 52, paddingLeft: spacing.sm, paddingRight: spacing.xs, position: 'absolute', right: spacing.screen }, snackbarText: { color: colors.surface, flex: 1, fontSize: 14, fontWeight: '500' }, undoButton: { alignItems: 'center', justifyContent: 'center', minHeight: layout.minTouchTarget, minWidth: 76, paddingHorizontal: spacing.xs }, undoText: { color: '#93C5FD', fontSize: 14, fontWeight: '700' },
});
