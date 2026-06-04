'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/components/providers/socket-provider';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  rideId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

interface ChatWindowProps {
  rideId: string;
  otherUserId: string;
  otherUserName: string;
  currentUserId: string;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  rideId,
  otherUserId,
  otherUserName,
  currentUserId,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get(`/chat/history/${rideId}/${otherUserId}`);
        setMessages(response.data.messages);
      } catch (error) {
        console.error('Lỗi khi lấy lịch sử chat:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [rideId, otherUserId]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: Message) => {
      // Chỉ nhận tin nhắn thuộc chuyến đi và cuộc hội thoại này
      if (message.rideId === rideId && 
         (message.senderId === otherUserId || message.senderId === currentUserId)) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleSentMessage = (message: Message) => {
      if (message.rideId === rideId && message.receiverId === otherUserId) {
        // Nếu đã có tin nhắn này trong list (do optimistics UI hoặc lý do khác) thì bỏ qua
        setMessages((prev) => {
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on('chat:receive', handleReceiveMessage);
    socket.on('chat:sent', handleSentMessage);

    return () => {
      socket.off('chat:receive', handleReceiveMessage);
      socket.off('chat:sent', handleSentMessage);
    };
  }, [socket, rideId, otherUserId, currentUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !socket) return;

    socket.emit('chat:send', {
      rideId,
      receiverId: otherUserId,
      content: inputValue.trim(),
    });

    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md bg-background border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">{otherUserName}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="hover:bg-primary-foreground/10 rounded-full p-1 transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground space-y-2">
              <p className="text-sm">Chưa có tin nhắn nào</p>
              <p className="text-xs">Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2 rounded-2xl text-sm shadow-sm",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-muted-foreground rounded-tl-none"
                    )}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer / Input */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Nhập tin nhắn..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-background"
          />
          <Button size="icon" onClick={handleSendMessage} disabled={!inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
