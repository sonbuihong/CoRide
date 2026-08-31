import { apiClient as api } from '../api/client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  targetType?: 'BOOKING' | 'RIDE' | 'TRIP' | null;
  targetId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  async getNotifications() {
    const response = await api.get('/notifications');
    const items = response.data.data ?? response.data.notifications ?? [];
    return items.map((item: Notification & { content?: string }) => ({
      ...item,
      message: item.message ?? item.content ?? '',
    })) as Notification[];
  },

  async markAsRead(id: string) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  async deleteNotification(id: string) {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  async restoreNotification(id: string) {
    const response = await api.patch(`/notifications/${id}/restore`);
    return response.data;
  },
};
