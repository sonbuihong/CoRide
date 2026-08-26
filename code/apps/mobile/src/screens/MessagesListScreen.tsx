import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MessageCircle, User } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { bookingService } from '../services/booking.service';
import { colors, layout, radius, spacing } from '../theme/tokens';
import { AppScreen } from '../components/ui/AppScreen';
import { AppText } from '../components/ui/AppText';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';

interface MessagesListScreenProps {
  mode: 'passenger' | 'driver';
}

interface ConversationItem {
  key: string;
  rideId: string;
  otherUserId: string;
  otherUserName: string;
  route: string;
  avatarUrl?: string;
}

export default function MessagesListScreen({ mode }: MessagesListScreenProps) {
  const router = useRouter();
  const query = useQuery({
    queryKey: ['conversations', mode],
    queryFn: () => mode === 'driver' ? bookingService.getDriverBookings() : bookingService.getMyBookings(),
  });

  const conversations = useMemo<ConversationItem[]>(() => {
    const payload = query.data?.bookings ?? query.data ?? [];
    const unique = new Map<string, ConversationItem>();
    for (const booking of payload as any[]) {
      const ride = booking.ride;
      const person = mode === 'driver' ? booking.passenger : ride?.driver;
      if (!ride?.id || !person?.id) continue;
      const key = `${ride.id}:${person.id}`;
      if (!unique.has(key)) {
        unique.set(key, {
          key,
          rideId: ride.id,
          otherUserId: person.id,
          otherUserName: [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Người dùng CoRide',
          route: `${ride.origin || 'Điểm đi'} → ${ride.destination || 'Điểm đến'}`,
          avatarUrl: person.avatarUrl,
        });
      }
    }
    return Array.from(unique.values());
  }, [mode, query.data]);

  const openConversation = (item: ConversationItem) => {
    router.push({
      pathname: '/chat/[rideId]',
      params: { rideId: item.rideId, otherUserId: item.otherUserId, otherUserName: item.otherUserName },
    } as any);
  };

  return (
    <AppScreen safeArea={false} style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="h1" weight="semibold">Tin nhắn</AppText>
        <AppText variant="bodySmall" style={styles.subtitle}>Trao đổi trong ngữ cảnh từng chuyến đi.</AppText>
      </View>

      {query.isLoading ? (
        <View style={styles.loading}>
          {[0, 1, 2].map((item) => <SkeletonLoader key={item} height={72} width="100%" borderRadius={radius.card} />)}
        </View>
      ) : query.isError ? (
        <ErrorState message="Không thể tải danh sách hội thoại." onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.key}
          contentContainerStyle={conversations.length ? styles.list : styles.emptyList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openConversation(item)}
              accessibilityRole="button"
              accessibilityLabel={`Trò chuyện với ${item.otherUserName}, chuyến ${item.route}`}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={styles.avatar}><User size={20} color={colors.primary} /></View>
              <View style={styles.copy}>
                <AppText variant="body" weight="semibold" numberOfLines={1}>{item.otherUserName}</AppText>
                <AppText variant="caption" style={styles.route} numberOfLines={1}>{item.route}</AppText>
              </View>
              <MessageCircle size={20} color={colors.textTertiary} />
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              title="Chưa có cuộc trò chuyện"
              description="Hội thoại sẽ xuất hiện khi bạn có chuyến đi hoặc yêu cầu đặt chỗ."
            />
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xxs },
  loading: { gap: spacing.sm, padding: spacing.lg },
  list: { padding: spacing.lg },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  item: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 76, paddingHorizontal: spacing.md },
  pressed: { backgroundColor: colors.surfaceMuted },
  avatar: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill, height: layout.minTouchTarget, justifyContent: 'center', marginRight: spacing.sm, width: layout.minTouchTarget },
  copy: { flex: 1, marginRight: spacing.sm },
  route: { color: colors.textSecondary, marginTop: spacing.xxs },
});
