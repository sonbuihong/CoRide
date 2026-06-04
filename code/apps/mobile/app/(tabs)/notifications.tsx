import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, Notification } from '../../src/services/notification.service';
import { useSSE } from '../../src/hooks/useSSE';
import { useNotifications } from '../../src/hooks/useNotifications';
import { Bell, Calendar, Info, CheckCircle, XCircle, Star } from 'lucide-react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const lastEvent = useSSE();
  useNotifications(); // Khởi tạo push notifications

  const { data: notifications, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  });

  // Tự động làm mới khi có SSE event mới
  React.useEffect(() => {
    if (lastEvent) {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  }, [lastEvent]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_REQUEST': return <Calendar size={20} color="#3B82F6" />;
      case 'BOOKING_ACCEPTED': return <CheckCircle size={20} color="#10B981" />;
      case 'BOOKING_REJECTED': return <XCircle size={20} color="#EF4444" />;
      case 'REVIEW_RECEIVED': return <Star size={20} color="#F59E0B" />;
      default: return <Info size={20} color="#6B7280" />;
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />
        }
      >
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">Thông báo</Text>
          {notifications && notifications.length > 0 && (
            <TouchableOpacity onPress={() => notificationService.markAllAsRead().then(() => refetch())}>
              <Text className="text-blue-600 font-medium text-sm">Đánh dấu đã đọc hết</Text>
            </TouchableOpacity>
          )}
        </View>

        {!notifications || notifications.length === 0 ? (
          <View className="py-20 items-center">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Bell size={40} color="#D1D5DB" />
            </View>
            <Text className="text-gray-500 font-medium">Bạn chưa có thông báo nào</Text>
          </View>
        ) : (
          notifications.map((item: Notification) => (
            <TouchableOpacity 
              key={item.id}
              className={`p-4 rounded-2xl mb-3 flex-row items-start ${item.isRead ? 'bg-white opacity-70' : 'bg-white shadow-sm border-l-4 border-blue-500'}`}
              onPress={() => !item.isRead && markReadMutation.mutate(item.id)}
            >
              <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-3 mt-1">
                {getIcon(item.type)}
              </View>
              <View className="flex-1">
                <Text className={`text-gray-800 ${item.isRead ? 'font-medium' : 'font-bold'}`}>{item.title}</Text>
                <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>{item.message}</Text>
                <Text className="text-gray-400 text-xs mt-2">
                  {format(new Date(item.createdAt), 'HH:mm, dd MMM', { locale: vi })}
                </Text>
              </View>
              {!item.isRead && <View className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
