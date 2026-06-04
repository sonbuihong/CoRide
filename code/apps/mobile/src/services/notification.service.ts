import { api } from './auth.service';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BOOKING_REQUEST' | 'BOOKING_ACCEPTED' | 'BOOKING_REJECTED' | 'RIDE_CANCELLED' | 'REVIEW_RECEIVED';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data;
  },

  async markAsRead(id: string) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};
