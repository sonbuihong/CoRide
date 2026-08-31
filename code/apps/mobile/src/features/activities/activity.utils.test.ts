import assert from 'node:assert/strict';
import test from 'node:test';
import type { ActivityItem } from './activity.types';
import {
  departureCountdown,
  formatActivityPrice,
  getActivityActions,
  segmentCountLabel,
} from './activity.utils';

const item: ActivityItem = {
  id: 'booking-1', source: 'CARPOOL_BOOKING', role: 'PASSENGER', status: 'CONFIRMED', segment: 'ACTIVE',
  origin: 'Hà Nội', destination: 'Hải Phòng', departureTime: '2026-08-28T10:45:00.000Z', sortAt: '2026-08-28T10:00:00.000Z',
  price: 125000, seats: 2, availableSeats: 1, distanceKm: 100, durationMinutes: 120,
  relatedUser: { id: 'driver-1', name: 'Nguyễn An', avatarUrl: null, phone: null, rating: 4.9 }, nextPassenger: null, vehicle: null,
  cancellationReason: null, rideId: 'ride-1', bookingId: 'booking-1', tripId: null, chatRideId: 'ride-1',
};

test('formats price and segment counts in Vietnamese', () => {
  assert.equal(formatActivityPrice(125000), '125.000đ');
  assert.equal(formatActivityPrice(null), null);
  assert.equal(segmentCountLabel(2, 'ACTIVE'), '2 chuyến đang hoạt động');
});

test('shows a departure countdown only inside the next hour', () => {
  assert.equal(departureCountdown(item.departureTime, new Date('2026-08-28T10:00:00.000Z')), 'Khởi hành sau 45 phút');
  assert.equal(departureCountdown(item.departureTime, new Date('2026-08-28T09:00:00.000Z')), null);
  assert.equal(departureCountdown(item.departureTime, new Date('2026-08-28T11:00:00.000Z')), null);
});

test('maps active passenger carpool to detail and chat routes only when data exists', () => {
  assert.deepEqual(getActivityActions(item, 'PASSENGER').map((action) => action.label), ['Xem chuyến', 'Nhắn tin']);
  assert.equal(getActivityActions({ ...item, relatedUser: null }, 'PASSENGER').length, 1);
});

test('maps driver ride-hailing active action to navigation', () => {
  const trip = { ...item, source: 'RIDE_HAILING' as const, role: 'DRIVER' as const, tripId: 'trip-1', bookingId: null, rideId: null, chatRideId: null };
  assert.equal(getActivityActions(trip, 'DRIVER')[0].route, '/driver/active-trip');
});
