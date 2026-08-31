const mockBookingFindMany = jest.fn();
const mockBookingCount = jest.fn();
const mockTripFindMany = jest.fn();
const mockTripCount = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    booking: { findMany: mockBookingFindMany, count: mockBookingCount },
    tripRequest: { findMany: mockTripFindMany, count: mockTripCount },
    ride: { findMany: jest.fn(), count: jest.fn() },
  },
}));

import { ActivitiesService } from './activities.service';

const booking = (id: string, updatedAt: string) => ({
  id,
  rideId: `ride-${id}`,
  status: 'PENDING',
  isPickedUp: false,
  isDroppedOff: false,
  updatedAt: new Date(updatedAt),
  totalPrice: 100000,
  seats: 1,
  ride: {
    id: `ride-${id}`,
    status: 'SCHEDULED',
    origin: 'Hà Nội',
    destination: 'Hải Phòng',
    departureTime: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date(updatedAt),
    driver: null,
    vehicle: null,
  },
});

const trip = (id: string, updatedAt: string) => ({
  id,
  status: 'MATCHING',
  originAddress: 'Hà Nội',
  destAddress: 'Hải Phòng',
  createdAt: new Date(updatedAt),
  updatedAt: new Date(updatedAt),
  estimatedPrice: 80000,
  passenger: { id: 'passenger-1', firstName: 'An' },
  driver: null,
});

describe('Activities mixed-source cursor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBookingCount.mockResolvedValue(2);
    mockTripCount.mockResolvedValue(2);
  });

  it('continues each source independently without duplicate mixed items', async () => {
    mockBookingFindMany
      .mockResolvedValueOnce([booking('b-10', '2026-08-28T10:00:00.000Z'), booking('b-08', '2026-08-28T08:00:00.000Z')])
      .mockResolvedValueOnce([booking('b-08', '2026-08-28T08:00:00.000Z')]);
    mockTripFindMany
      .mockResolvedValueOnce([trip('t-09', '2026-08-28T09:00:00.000Z'), trip('t-07', '2026-08-28T07:00:00.000Z')])
      .mockResolvedValueOnce([trip('t-07', '2026-08-28T07:00:00.000Z')]);

    const first = await ActivitiesService.list('passenger-1', 'PASSENGER', 'ACTIVE', undefined, 2);
    expect(first.items.map((item) => item.id)).toEqual(['b-10', 't-09']);
    expect(first.nextCursor).toEqual(expect.any(String));
    expect(first.counts.ACTIVE).toBe(4);

    const second = await ActivitiesService.list('passenger-1', 'PASSENGER', 'ACTIVE', first.nextCursor!, 2);
    expect(second.items.map((item) => item.id)).toEqual(['b-08', 't-07']);
    expect(second.nextCursor).toBeNull();
    expect(new Set([...first.items, ...second.items].map((item) => `${item.source}:${item.id}`))).toHaveProperty('size', 4);
    expect(mockBookingFindMany.mock.calls[1][0].where).toHaveProperty('AND');
    expect(mockTripFindMany.mock.calls[1][0].where).toHaveProperty('AND');
  });
});
