import apiClient from '@/lib/api-client';

export interface ChatMessage { id: string; rideId: string; senderId: string; receiverId: string; content: string; isRead: boolean; createdAt: string; sender?: { id: string; firstName: string; lastName: string; avatarUrl?: string | null }; pending?: boolean; failed?: boolean; }
export interface Conversation { id: string; rideId: string; otherUserId: string; otherUserName: string; avatarUrl?: string | null; route: string; }
export const encodeConversationId = (rideId: string, userId: string) => `${rideId}~${userId}`;
export const decodeConversationId = (value: string) => { const [rideId, otherUserId] = value.split('~'); return rideId && otherUserId ? { rideId, otherUserId } : null; };
export const chatService = {
  async conversations(mode: 'passenger' | 'driver'): Promise<Conversation[]> {
    const response = await apiClient.get(mode === 'driver' ? '/bookings/driver' : '/bookings/my');
    const bookings = response.data?.bookings ?? response.data ?? [];
    const map = new Map<string, Conversation>();
    for (const booking of bookings as any[]) {
      const ride = booking.ride; const person = mode === 'driver' ? booking.passenger : ride?.driver;
      if (!ride?.id || !person?.id) continue;
      const id = encodeConversationId(ride.id, person.id);
      if (!map.has(id)) map.set(id, { id, rideId: ride.id, otherUserId: person.id, otherUserName: [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Người dùng CoRide', avatarUrl: person.avatarUrl, route: `${ride.origin || 'Điểm đi'} → ${ride.destination || 'Điểm đến'}` });
    }
    return Array.from(map.values());
  },
  async history(rideId: string, userId: string): Promise<ChatMessage[]> { const response = await apiClient.get(`/chat/history/${rideId}/${userId}`); const messages = response.data?.messages ?? response.data; return Array.isArray(messages) ? messages : []; },
  async markRead(rideId: string, senderId: string) { await apiClient.patch(`/chat/read/${rideId}/${senderId}`); },
};
