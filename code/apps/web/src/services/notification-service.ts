import apiClient from '@/lib/api-client';

export interface AppNotification {
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
  async list(): Promise<AppNotification[]> {
    const response = await apiClient.get('/notifications');
    const items = response.data?.data ?? response.data?.notifications ?? response.data ?? [];
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({ ...item, message: item.message ?? item.content ?? '' }));
  },
  async markRead(id: string) {
    await apiClient.patch(`/notifications/${id}/read`);
  },
  async markAllRead() {
    await apiClient.patch('/notifications/read-all');
  },
};
