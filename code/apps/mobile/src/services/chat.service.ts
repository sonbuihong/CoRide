import { apiClient as api } from '../api/client';

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export const chatService = {
  async getHistory(rideId: string, otherUserId: string): Promise<ChatMessage[]> {
    const res = await api.get(`/chat/history/${rideId}/${otherUserId}`);
    const messages = res.data?.messages ?? res.data;
    return Array.isArray(messages) ? messages : [];
  },

  async markRead(rideId: string, senderId: string): Promise<void> {
    await api.patch(`/chat/read/${rideId}/${senderId}`);
  }
};
