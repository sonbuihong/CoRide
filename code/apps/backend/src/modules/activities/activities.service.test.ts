import { AppError } from '../../shared/errors/AppError';
import {
  decodeActivityCursor,
  getActivityOwnerFilter,
  mapBookingSegment,
  mapRideSegment,
  mapTripSegment,
} from './activities.service';

describe('Activities status mapping', () => {
  it.each([
    [{ status: 'PENDING', ride: { status: 'SCHEDULED' } }, 'ACTIVE'],
    [{ status: 'CONFIRMED', isPickedUp: false, ride: { status: 'SCHEDULED' } }, 'UPCOMING'],
    [{ status: 'CONFIRMED', isPickedUp: true, ride: { status: 'ONGOING' } }, 'ACTIVE'],
    [{ status: 'COMPLETED', ride: { status: 'COMPLETED' } }, 'COMPLETED'],
    [{ status: 'CONFIRMED', ride: { status: 'COMPLETED' } }, 'COMPLETED'],
    [{ status: 'REJECTED', ride: { status: 'SCHEDULED' } }, 'CANCELLED'],
    [{ status: 'CONFIRMED', ride: { status: 'CANCELLED' } }, 'CANCELLED'],
  ])('maps passenger booking %# to %s', (booking, expected) => {
    expect(mapBookingSegment(booking)).toBe(expected);
  });

  it.each([
    ['PENDING', 'ACTIVE'], ['MATCHING', 'ACTIVE'], ['ARRIVING', 'ACTIVE'],
    ['IN_PROGRESS', 'ACTIVE'], ['WAITING_PAYMENT', 'ACTIVE'],
    ['COMPLETED', 'COMPLETED'], ['CANCELLED', 'CANCELLED'], ['NO_DRIVER', 'CANCELLED'],
  ])('maps trip %s to %s', (status, expected) => {
    expect(mapTripSegment(status)).toBe(expected);
  });

  it.each([
    ['SCHEDULED', 'UPCOMING'], ['FULL', 'UPCOMING'], ['ONGOING', 'ACTIVE'],
    ['COMPLETED', 'COMPLETED'], ['CANCELLED', 'CANCELLED'],
  ])('maps driver ride %s to %s', (status, expected) => {
    expect(mapRideSegment(status)).toBe(expected);
  });
});

describe('Activities access filters', () => {
  it('scopes passenger data to their own bookings and trip requests', () => {
    expect(getActivityOwnerFilter('passenger-1', 'PASSENGER', 'CARPOOL_BOOKING')).toEqual({ passengerId: 'passenger-1' });
    expect(getActivityOwnerFilter('passenger-1', 'PASSENGER', 'RIDE_HAILING')).toEqual({ passengerId: 'passenger-1' });
  });

  it('scopes driver data to rides they published and trips they accepted', () => {
    expect(getActivityOwnerFilter('driver-1', 'DRIVER', 'CARPOOL_RIDE')).toEqual({ driverId: 'driver-1' });
    expect(getActivityOwnerFilter('driver-1', 'DRIVER', 'RIDE_HAILING')).toEqual({ driverId: 'driver-1' });
  });

  it('rejects cross-role source access', () => {
    expect(() => getActivityOwnerFilter('passenger-1', 'PASSENGER', 'CARPOOL_RIDE')).toThrow(AppError);
    expect(() => getActivityOwnerFilter('driver-1', 'DRIVER', 'CARPOOL_BOOKING')).toThrow(AppError);
  });
});

describe('Activities cursor validation', () => {
  it('accepts a cursor only for its original role and segment', () => {
    const encoded = Buffer.from(JSON.stringify({
      version: 1,
      role: 'PASSENGER',
      segment: 'ACTIVE',
      sources: { RIDE_HAILING: { sortAt: '2026-08-28T10:00:00.000Z', id: 'trip-1' } },
    })).toString('base64url');
    expect(decodeActivityCursor(encoded, 'PASSENGER', 'ACTIVE').sources.RIDE_HAILING?.id).toBe('trip-1');
    expect(() => decodeActivityCursor(encoded, 'DRIVER', 'ACTIVE')).toThrow(AppError);
    expect(() => decodeActivityCursor(encoded, 'PASSENGER', 'COMPLETED')).toThrow(AppError);
  });

  it('rejects malformed cursor data', () => {
    expect(() => decodeActivityCursor('not-a-cursor', 'PASSENGER', 'ACTIVE')).toThrow('Cursor hoạt động không hợp lệ');
  });
});
