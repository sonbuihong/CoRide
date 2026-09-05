export interface NotificationTarget {
  type: string;
  targetType?: 'BOOKING' | 'RIDE' | 'TRIP' | null;
  targetId?: string | null;
}

export function getNotificationHref(notification: NotificationTarget): string | null {
  const { targetType, targetId, type } = notification;

  if (targetType === 'BOOKING' && targetId) return `/bookings/${targetId}`;
  if (targetType === 'RIDE' && targetId) return `/rides/${targetId}`;
  if (targetType === 'TRIP' && targetId) return `/ride-hailing/trip/${targetId}`;

  if (type === 'BOOKING_REQUEST') return '/booking-requests';
  if (type.startsWith('BOOKING_')) return '/my-bookings';
  if (type.startsWith('TRIP_')) return '/ongoing';
  if (type.startsWith('PAYMENT_')) return '/profile/wallet';
  return null;
}
