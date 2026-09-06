import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Send, UserRound } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { AppText } from '../../src/components/ui/AppText';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { chatService, type ChatMessage } from '../../src/services/chat.service';
import { rideService } from '../../src/services/ride.service';
import { socketService } from '../../src/services/socket.service';
import { useAuth } from '../../src/hooks/useAuth';
import { useSocketConnection } from '../../src/hooks/useSocketConnection';
import { colors, layout, radius, spacing } from '../../src/theme/tokens';
import { TripScreen } from '../../src/features/trip-flow/TripScreen';

const dayLabel = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Hôm nay';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return format(date, 'dd/MM/yyyy', { locale: vi });
};

export default function ChatScreen() {
  const { rideId, otherUserId, otherUserName } = useLocalSearchParams<{ rideId: string; otherUserId: string; otherUserName: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const connected = useSocketConnection();
  const [input, setInput] = useState('');
  const [sendError, setSendError] = useState('');
  const pendingDraftRef = useRef('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const needsRecipientRecovery = Boolean(user?.id && (!otherUserId || otherUserId === user.id));
  const recipientRideQuery = useQuery({
    queryKey: ['chat-recipient-ride', rideId],
    queryFn: () => rideService.getRideById(rideId),
    enabled: Boolean(rideId && needsRecipientRecovery),
  });
  const recoveredDriverId = recipientRideQuery.data?.driverId !== user?.id
    ? recipientRideQuery.data?.driverId
    : undefined;
  const resolvedOtherUserId = needsRecipientRecovery ? recoveredDriverId : otherUserId;
  const resolvedOtherUserName = needsRecipientRecovery && recoveredDriverId
    ? [recipientRideQuery.data?.driver?.firstName, recipientRideQuery.data?.driver?.lastName].filter(Boolean).join(' ')
    : otherUserName;
  const queryKey = useMemo(() => ['chat', rideId, resolvedOtherUserId] as const, [resolvedOtherUserId, rideId]);
  const query = useQuery({
    queryKey,
    queryFn: () => chatService.getHistory(rideId, resolvedOtherUserId!),
    enabled: Boolean(rideId && resolvedOtherUserId),
  });
  const messages = Array.isArray(query.data) ? query.data : [];

  useEffect(() => {
    void socketService.connect();
    const append = (message: ChatMessage) => {
      if (message.rideId !== rideId) return;
      if (message.senderId !== resolvedOtherUserId && message.receiverId !== resolvedOtherUserId) return;
      queryClient.setQueryData<ChatMessage[]>(queryKey, (current) => {
        const messages = Array.isArray(current) ? current : [];
        return messages.some((item) => item.id === message.id) ? messages : [...messages, message];
      });
      if (message.senderId === resolvedOtherUserId) void chatService.markRead(rideId, resolvedOtherUserId);
      if (message.senderId === user?.id) pendingDraftRef.current = '';
    };
    const handleSendError = (error?: { message?: string }) => {
      if (pendingDraftRef.current) setInput((current) => current || pendingDraftRef.current);
      setSendError(error?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    };
    socketService.on('chat:receive', append);
    socketService.on('chat:sent', append);
    socketService.on('chat:error', handleSendError);
    if (rideId && resolvedOtherUserId) void chatService.markRead(rideId, resolvedOtherUserId);
    return () => {
      socketService.off('chat:receive', append);
      socketService.off('chat:sent', append);
      socketService.off('chat:error', handleSendError);
    };
  }, [queryClient, queryKey, resolvedOtherUserId, rideId, user?.id]);

  const send = () => {
    const content = input.trim();
    if (!content || !rideId) return;
    if (!resolvedOtherUserId) {
      setSendError('Không xác định được người nhận. Vui lòng quay lại và mở đúng cuộc trò chuyện.');
      return;
    }
    if (!connected) {
      setSendError('Đang kết nối lại. Tin nhắn chưa được gửi.');
      return;
    }
    pendingDraftRef.current = content;
    setSendError('');
    socketService.emit('chat:send', { rideId, receiverId: resolvedOtherUserId, content });
    setInput('');
  };

  return (
    <TripScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressedSoft]}
        >
          <ArrowLeft size={23} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.avatar}>
          <UserRound size={22} color={colors.navigationPassenger} />
          <View style={[styles.avatarStatus, !connected && styles.avatarStatusOffline]} />
        </View>
        <View style={styles.headerCopy}>
          <AppText variant="title" weight="bold" numberOfLines={1}>{resolvedOtherUserName || 'Trò chuyện'}</AppText>
          <View style={styles.presence}>
            <View style={[styles.presenceDot, !connected && styles.presenceDotOffline]} />
            <AppText variant="caption" weight="medium" style={[styles.presenceText, !connected && styles.presenceTextOffline]}>{connected ? 'Đang hoạt động' : 'Đang kết nối lại…'}</AppText>
          </View>
        </View>
        <View style={styles.headerButton} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {recipientRideQuery.isLoading || query.isLoading ? (
          <View style={styles.loading}><SkeletonLoader width="66%" height={58} borderRadius={16} /><SkeletonLoader width="72%" height={74} borderRadius={16} className="mt-4 self-end" /></View>
        ) : query.isError ? (
          <ErrorState message="Không thể tải cuộc trò chuyện." onRetry={() => void query.refetch()} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const previous = messages[index - 1];
              const next = messages[index + 1];
              const startsDay = !previous || new Date(previous.createdAt).toDateString() !== new Date(item.createdAt).toDateString();
              const endsGroup = !next || next.senderId !== item.senderId || new Date(next.createdAt).getTime() - new Date(item.createdAt).getTime() > 5 * 60_000;
              return <MessageBubble message={item} isMine={item.senderId === user?.id} showDay={startsDay} showTime={endsGroup} />;
            }}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><MessageCircle size={27} color={colors.navigationPassenger} /></View><AppText variant="h3" weight="semibold">Bắt đầu trò chuyện</AppText><AppText variant="bodySmall" style={styles.emptyText}>Trao đổi điểm đón và thời gian đến với người đồng hành.</AppText></View>}
          />
        )}
        {sendError ? <AppText variant="caption" accessibilityRole="alert" style={styles.sendError}>{sendError}</AppText> : null}
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Nhập tin nhắn"
            accessibilityHint="Nhập nội dung cần gửi cho người đồng hành"
            value={input}
            onChangeText={(value) => { setInput(value); if (sendError) setSendError(''); }}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            textAlignVertical="center"
            returnKeyType="default"
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            accessibilityState={{ disabled: !input.trim() }}
            disabled={!input.trim()}
            onPress={send}
            style={({ pressed }) => [styles.send, !input.trim() && styles.sendDisabled, pressed && input.trim() && styles.sendPressed]}
          >
            <Send size={20} color={input.trim() ? colors.surface : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </TripScreen>
  );
}

function MessageBubble({ message, isMine, showDay, showTime }: { message: ChatMessage; isMine: boolean; showDay: boolean; showTime: boolean }) {
  return (
    <>
      {showDay ? (
        <View style={styles.dayRow}>
          <View style={styles.dayLine} />
          <AppText variant="caption" weight="medium" style={styles.dayText}>{dayLabel(message.createdAt)}</AppText>
          <View style={styles.dayLine} />
        </View>
      ) : null}
      <View style={[styles.messageWrap, !showTime && styles.messageGrouped, isMine ? styles.messageMineWrap : styles.messageOtherWrap]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <AppText style={isMine ? styles.messageMine : styles.messageOther}>{message.content}</AppText>
        </View>
        {showTime ? <AppText variant="caption" style={[styles.time, isMine && styles.timeMine]}>{format(new Date(message.createdAt), 'HH:mm', { locale: vi })}</AppText> : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { backgroundColor: '#F4F7FB', flex: 1 },
  header: { alignSelf: 'center', alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', maxWidth: layout.maxContentWidth, minHeight: 72, paddingHorizontal: spacing.sm, width: '100%' },
  headerButton: { alignItems: 'center', borderRadius: radius.full, height: 48, justifyContent: 'center', width: 48 },
  headerCopy: { flex: 1, marginLeft: spacing.sm },
  avatar: { alignItems: 'center', backgroundColor: colors.navigationPassengerSoft, borderRadius: radius.full, height: 44, justifyContent: 'center', position: 'relative', width: 44 },
  avatarStatus: { backgroundColor: colors.success, borderColor: colors.surface, borderRadius: radius.full, borderWidth: 2, bottom: 0, height: 12, position: 'absolute', right: 0, width: 12 },
  avatarStatusOffline: { backgroundColor: colors.warning },
  presence: { alignItems: 'center', flexDirection: 'row', marginTop: 1 },
  presenceDot: { backgroundColor: colors.success, borderRadius: radius.full, height: 6, marginRight: 6, width: 6 },
  presenceDotOffline: { backgroundColor: colors.warning },
  presenceText: { color: colors.success },
  presenceTextOffline: { color: colors.warning },
  loading: { flex: 1, padding: spacing.screen },
  messages: { alignSelf: 'center', flexGrow: 1, maxWidth: layout.maxContentWidth, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xl, width: '100%' },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.navigationPassengerSoft, borderRadius: radius.full, height: 60, justifyContent: 'center', marginBottom: spacing.md, width: 60 },
  emptyText: { color: colors.textSecondary, marginTop: spacing.xs, maxWidth: 260, textAlign: 'center' },
  dayRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, marginTop: spacing.sm },
  dayLine: { backgroundColor: colors.border, flex: 1, height: StyleSheet.hairlineWidth },
  dayText: { color: colors.textTertiary },
  messageWrap: { marginBottom: spacing.md, maxWidth: '82%' },
  messageGrouped: { marginBottom: 4 },
  messageMineWrap: { alignSelf: 'flex-end' },
  messageOtherWrap: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: 11 },
  bubbleMine: { backgroundColor: colors.navigationPassenger, borderBottomRightRadius: 6 },
  bubbleOther: { backgroundColor: colors.surface, borderBottomLeftRadius: 6, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, elevation: 1, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  messageMine: { color: colors.surface },
  messageOther: { color: colors.textPrimary },
  time: { color: colors.textTertiary, marginTop: 5, paddingHorizontal: 3 },
  timeMine: { textAlign: 'right' },
  composer: { alignSelf: 'center', alignItems: 'center', backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, maxWidth: layout.maxContentWidth, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, width: '100%' },
  sendError: { backgroundColor: colors.dangerSoft, color: colors.danger, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textAlign: 'center' },
  input: { backgroundColor: '#F8FAFC', borderColor: colors.border, borderRadius: 24, borderWidth: 1, color: colors.textPrimary, flex: 1, fontSize: 16, height: 48, lineHeight: 22, paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'ios' ? 12 : 8 },
  send: { alignItems: 'center', backgroundColor: colors.navigationPassenger, borderRadius: radius.full, elevation: 2, height: 48, justifyContent: 'center', shadowColor: colors.navigationPassenger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 8, width: 48 },
  sendDisabled: { backgroundColor: colors.navigationDivider, elevation: 0, shadowOpacity: 0 },
  sendPressed: { opacity: 0.82 },
  pressedSoft: { backgroundColor: colors.navigationPressed, opacity: 0.8 },
});
