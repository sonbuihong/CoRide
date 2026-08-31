import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { AppText } from '../../src/components/ui/AppText';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { chatService, type ChatMessage } from '../../src/services/chat.service';
import { socketService } from '../../src/services/socket.service';
import { useAuth } from '../../src/hooks/useAuth';
import { useSocketConnection } from '../../src/hooks/useSocketConnection';
import { colors, radius, spacing } from '../../src/theme/tokens';
import { TripScreen, TripScreenHeader } from '../../src/features/trip-flow/TripScreen';

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
  const queryKey = useMemo(() => ['chat', rideId, otherUserId] as const, [otherUserId, rideId]);
  const query = useQuery({
    queryKey,
    queryFn: () => chatService.getHistory(rideId, otherUserId),
    enabled: Boolean(rideId && otherUserId),
  });

  useEffect(() => {
    void socketService.connect();
    const append = (message: ChatMessage) => {
      if (message.rideId !== rideId) return;
      if (message.senderId !== otherUserId && message.receiverId !== otherUserId) return;
      queryClient.setQueryData<ChatMessage[]>(queryKey, (current = []) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      );
      if (message.senderId === otherUserId) void chatService.markRead(rideId, otherUserId);
      if (message.senderId === user?.id) pendingDraftRef.current = '';
    };
    const handleSendError = (error?: { message?: string }) => {
      if (pendingDraftRef.current) setInput((current) => current || pendingDraftRef.current);
      setSendError(error?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    };
    socketService.on('chat:receive', append);
    socketService.on('chat:sent', append);
    socketService.on('chat:error', handleSendError);
    if (rideId && otherUserId) void chatService.markRead(rideId, otherUserId);
    return () => {
      socketService.off('chat:receive', append);
      socketService.off('chat:sent', append);
      socketService.off('chat:error', handleSendError);
    };
  }, [otherUserId, queryClient, queryKey, rideId, user?.id]);

  const send = () => {
    const content = input.trim();
    if (!content || !rideId || !otherUserId) return;
    if (!connected) {
      setSendError('Đang kết nối lại. Tin nhắn chưa được gửi.');
      return;
    }
    pendingDraftRef.current = content;
    setSendError('');
    socketService.emit('chat:send', { rideId, receiverId: otherUserId, content });
    setInput('');
  };

  return (
    <TripScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <TripScreenHeader title={otherUserName || 'Hành khách'} onBack={() => router.back()} />
      <View style={styles.presence}><View style={[styles.presenceDot, !connected && styles.presenceDotOffline]} /><AppText variant="caption" weight="semibold" style={[styles.presenceText, !connected && styles.presenceTextOffline]}>{connected ? 'Đã kết nối' : 'Đang kết nối lại…'}</AppText></View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {query.isLoading ? (
          <View style={styles.loading}><SkeletonLoader width="66%" height={58} borderRadius={16} /><SkeletonLoader width="72%" height={74} borderRadius={16} className="mt-4 self-end" /></View>
        ) : query.isError ? (
          <ErrorState message="Không thể tải cuộc trò chuyện." onRetry={() => void query.refetch()} />
        ) : (
          <FlatList
            ref={listRef}
            data={query.data || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} isMine={item.senderId === user?.id} />}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View style={styles.empty}><AppText variant="bodySmall" style={styles.emptyText}>Bắt đầu trao đổi về điểm đón hoặc thời gian đến.</AppText></View>}
          />
        )}
        {sendError ? <AppText variant="caption" accessibilityRole="alert" style={styles.sendError}>{sendError}</AppText> : null}
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Nhập tin nhắn"
            value={input}
            onChangeText={(value) => { setInput(value); if (sendError) setSendError(''); }}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            textAlignVertical="center"
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            disabled={!input.trim()}
            onPress={send}
            style={({ pressed }) => [styles.send, !input.trim() && styles.sendDisabled, pressed && styles.pressed]}
          >
            <Send size={20} color={input.trim() ? colors.surface : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </TripScreen>
  );
}

function MessageBubble({ message, isMine }: { message: ChatMessage; isMine: boolean }) {
  return (
    <View style={[styles.messageWrap, isMine ? styles.messageMineWrap : styles.messageOtherWrap]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <AppText style={isMine ? styles.messageMine : undefined}>{message.content}</AppText>
      </View>
      <AppText variant="caption" style={[styles.time, isMine && styles.timeMine]}>{format(new Date(message.createdAt), 'HH:mm', { locale: vi })}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  presence: { alignItems: 'center', backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'center', marginTop: -6, paddingBottom: spacing.xs },
  presenceDot: { backgroundColor: colors.success, borderRadius: radius.full, height: 7, marginRight: spacing.xs, width: 7 },
  presenceDotOffline: { backgroundColor: colors.warning },
  presenceText: { color: colors.success },
  presenceTextOffline: { color: colors.warning },
  loading: { flex: 1, padding: spacing.screen },
  messages: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xl },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },
  messageWrap: { marginBottom: spacing.md, maxWidth: '82%' },
  messageMineWrap: { alignSelf: 'flex-end' },
  messageOtherWrap: { alignSelf: 'flex-start' },
  bubble: { borderRadius: radius.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleMine: { backgroundColor: colors.success, borderBottomRightRadius: 5 },
  bubbleOther: { backgroundColor: colors.surface, borderBottomLeftRadius: 5 },
  messageMine: { color: colors.surface },
  time: { marginTop: spacing.xs },
  timeMine: { textAlign: 'right' },
  composer: { alignItems: 'flex-end', backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  sendError: { backgroundColor: colors.dangerSoft, color: colors.danger, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, textAlign: 'center' },
  input: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderRadius: 24, borderWidth: 1, color: colors.textPrimary, flex: 1, fontSize: 16, maxHeight: 120, minHeight: 48, paddingHorizontal: spacing.lg, paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm },
  send: { alignItems: 'center', backgroundColor: colors.success, borderRadius: radius.full, height: 48, justifyContent: 'center', width: 48 },
  sendDisabled: { backgroundColor: colors.border },
  pressed: { opacity: 0.72 },
});
