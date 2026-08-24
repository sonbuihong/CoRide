import { createTripRequestSchema, driverTripStatusSchema, tripStatusSchema, SocketEvents } from '@repo/shared';

describe('Mobile shared contract', () => {
  const validTrip = {
    originAddress: 'Hà Đông, Hà Nội', originLat: 20.9719, originLng: 105.7712,
    destAddress: 'Cầu Giấy, Hà Nội', destLat: 21.0336, destLng: 105.7958,
    vehicleType: 'BIKE' as const,
  };

  it('accepts a valid ride-hailing request', () => {
    expect(createTripRequestSchema.parse(validTrip)).toEqual(validTrip);
  });

  it('rejects invalid or identical coordinates', () => {
    expect(() => createTripRequestSchema.parse({ ...validTrip, originLat: 91 })).toThrow();
    expect(() => createTripRequestSchema.parse({
      ...validTrip, destLat: validTrip.originLat, destLng: validTrip.originLng,
    })).toThrow();
  });

  it('keeps lifecycle and socket event names stable for mobile', () => {
    expect(tripStatusSchema.parse('WAITING_PAYMENT')).toBe('WAITING_PAYMENT');
    expect(driverTripStatusSchema.parse('ARRIVING')).toBe('ARRIVING');
    expect(() => driverTripStatusSchema.parse('COMPLETED')).toThrow();
    expect(SocketEvents.TRIP_LOCATION_UPDATED).toBe('trip:location_updated');
    expect(SocketEvents.NOTIFICATION_NEW).toBe('notification:new');
  });
});
