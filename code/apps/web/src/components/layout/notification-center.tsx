'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, Clock, Info, CheckCircle } from 'lucide-react';
import apiClient from '../../lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSocket } from '@/components/providers/socket-provider';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.notifications.filter((n: { isRead: boolean }) => !n.isRead).length);
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Lắng nghe notification realtime qua Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: Notification) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Hiển thị toast để người dùng thấy ngay cả khi không mở panel
      toast.info(data.title, {
        description: data.content,
      });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  // Fallback SSE — chỉ dùng khi Socket.IO không kết nối được
  // Ví dụ: proxy chặn WebSocket, hoặc server chưa có Socket module
  useEffect(() => {
    // Nếu Socket.IO đã connected thì không cần SSE fallback
    if (isConnected) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const token = localStorage.getItem('accessToken') || '';
    if (!token) return;

    const eventSource = new EventSource(`${apiUrl}/notifications/subscribe?token=${token}`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'connected') return;

      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);

      toast.info(data.title, {
        description: data.content,
      });
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isConnected]);

  const handleNotificationClick = async (notif: Notification) => {
    // 1. Mark as read
    if (!notif.isRead) {
      try {
        await apiClient.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Lỗi khi cập nhật thông báo:', error);
      }
    }

    // 2. Navigate based on type
    setIsOpen(false);
    if (notif.type === 'BOOKING_REQUEST') {
      // Navigate to driver's booking requests
      router.push('/booking-requests');
    } else if (notif.type === 'BOOKING_STATUS') {
      // Navigate to passenger's bookings
      router.push('/my-bookings');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Lỗi khi cập nhật thông báo:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 text-[rgba(0,0,0,0.56)] hover:text-[#1d1d1f] dark:text-[rgba(255,255,255,0.56)] dark:hover:text-white transition-colors rounded-full hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.1)] focus:outline-none"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-[#d93025] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {/* Indicator nhỏ cho biết trạng thái kết nối Socket */}
        <span
          className={cn(
            'absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full border border-white dark:border-black',
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div 
            className="absolute right-0 mt-3 w-80 bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(30,30,30,0.85)] backdrop-blur-[24px] saturate-[180%] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden transform origin-top-right transition-all"
          >
            <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] flex justify-between items-center">
              <h3 className="font-semibold text-[14px] text-[#1d1d1f] dark:text-white tracking-[-0.22px]">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[12px] text-[#0071e3] font-medium hover:underline tracking-[-0.12px]"
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] text-[12px]">
                  Không có thông báo nào
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      'px-4 py-3 border-b border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors flex gap-3 relative',
                      !notif.isRead && 'bg-[rgba(0,113,227,0.04)] dark:bg-[rgba(0,113,227,0.1)]'
                    )}
                  >
                    <div className="mt-0.5">
                      {notif.type.includes('REQUEST') ? (
                        <div className="h-6 w-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <Clock className="h-3.5 w-3.5 text-orange-500" />
                        </div>
                      ) : notif.type.includes('CONFIRMED') ? (
                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Info className="h-3.5 w-3.5 text-[#0071e3]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 pr-4">
                      <p className={cn('text-[14px] leading-tight tracking-[-0.22px]', !notif.isRead ? 'font-semibold text-[#1d1d1f] dark:text-white' : 'font-normal text-[rgba(0,0,0,0.8)] dark:text-[rgba(255,255,255,0.8)]')}>
                        {notif.title}
                      </p>
                      <p className="text-[12px] leading-[1.4] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] mt-1 tracking-[-0.12px]">
                        {notif.content}
                      </p>
                      <p className="text-[10px] text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)] mt-1.5 tracking-[-0.08px]">
                        {new Date(notif.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 bg-[#0071e3] rounded-full"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

