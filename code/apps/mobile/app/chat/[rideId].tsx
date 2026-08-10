import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, 
  Platform, FlatList, ActivityIndicator, SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react-native';
import { chatService, ChatMessage } from '../../src/services/chat.service';
import { socketService } from '../../src/services/socket.service';
import { useAuth } from '../../src/hooks/useAuth';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function ChatScreen() {
  const { rideId, otherUserId, otherUserName } = useLocalSearchParams<{ rideId: string, otherUserId: string, otherUserName: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat', rideId, otherUserId],
    queryFn: () => chatService.getHistory(rideId, otherUserId),
    enabled: !!rideId && !!otherUserId,
  });

  useEffect(() => {
    // Kết nối socket nếu chưa
    socketService.connect();

    const handleReceiveMessage = (message: ChatMessage) => {
      if (message.rideId === rideId && (message.senderId === otherUserId || message.receiverId === otherUserId)) {
        queryClient.setQueryData(['chat', rideId, otherUserId], (oldData: ChatMessage[] = []) => {
          // Tránh duplicate
          if (oldData.find(m => m.id === message.id)) return oldData;
          return [...oldData, message];
        });
        
        // Đánh dấu đã đọc nếu là tin nhắn nhận
        if (message.senderId === otherUserId) {
          chatService.markRead(rideId, otherUserId).catch(console.error);
        }
      }
    };

    const handleSentMessage = (message: ChatMessage) => {
      if (message.rideId === rideId) {
        queryClient.setQueryData(['chat', rideId, otherUserId], (oldData: ChatMessage[] = []) => {
          if (oldData.find(m => m.id === message.id)) return oldData;
          return [...oldData, message];
        });
      }
    };

    socketService.on('chat:receive', handleReceiveMessage);
    socketService.on('chat:sent', handleSentMessage);

    // Đánh dấu toàn bộ là đã đọc khi vào màn hình
    if (rideId && otherUserId) {
      chatService.markRead(rideId, otherUserId).catch(console.error);
    }

    return () => {
      socketService.off('chat:receive', handleReceiveMessage);
      socketService.off('chat:sent', handleSentMessage);
    };
  }, [rideId, otherUserId, queryClient]);

  const handleSend = () => {
    if (!inputText.trim() || !rideId || !otherUserId) return;
    
    socketService.emit('chat:send', {
      rideId,
      receiverId: otherUserId,
      content: inputText.trim()
    });
    
    setInputText('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View className={`mb-4 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
        <View 
          className={`p-3 rounded-2xl ${
            isMe 
              ? 'bg-blue-600 rounded-tr-sm' 
              : 'bg-white rounded-tl-sm border border-gray-100'
          }`}
          style={!isMe ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 } : undefined}
        >
          <Text className={`text-[15px] leading-5 ${isMe ? 'text-white' : 'text-gray-800'}`}>
            {item.content}
          </Text>
        </View>
        <Text className={`text-[11px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
          {format(new Date(item.createdAt), 'HH:mm', { locale: vi })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200" style={{ paddingTop: Platform.OS === 'android' ? 40 : 12 }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <ArrowLeft size={24} color="#1d1d1f" />
        </TouchableOpacity>
        
        <View className="flex-1 items-center">
          <Text className="text-[17px] font-bold text-gray-900" numberOfLines={1}>
            {otherUserName || 'Khách hàng'}
          </Text>
          <Text className="text-[12px] text-green-500 font-medium">Đang hoạt động</Text>
        </View>

        <View className="w-10" />
      </View>

      {/* Chat History */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Area */}
        <View className="px-4 py-3 bg-white border-t border-gray-200 flex-row items-end pb-8">
          <View className="flex-1 bg-gray-100 rounded-3xl flex-row items-center px-4 py-1 mr-3 min-h-[48px] max-h-[120px]">
            <TextInput
              className="flex-1 text-[15px] text-gray-800 leading-5 py-2"
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>
          
          <TouchableOpacity 
            onPress={handleSend}
            disabled={!inputText.trim()}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              inputText.trim() ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <Send size={20} color={inputText.trim() ? "#FFF" : "#9CA3AF"} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
