const mockTripFindFirst = jest.fn();
const mockTripFindUnique = jest.fn();
const mockTripUpdateMany = jest.fn();
const mockTripCreate = jest.fn();
const mockPricingEstimate = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    tripRequest: {
      findFirst: mockTripFindFirst,
      findUnique: mockTripFindUnique,
      updateMany: mockTripUpdateMany,
      create: mockTripCreate,
    },
  },
}));

jest.mock('../../shared/lib/redis', () => ({
  clearDriverBusy: jest.fn(),
  clearTripOffers: jest.fn(),
  getDriverLocation: jest.fn(),
}));

jest.mock('../pricing/pricing.service', () => ({
  PricingService: { estimate: mockPricingEstimate },
}));

jest.mock('../rides/ride-matching.service', () => ({
  RideMatchingService: { haversine: jest.fn() },
}));

import { TripsService } from './trips.service';

describe('TripsService Ride-Hailing authorization', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not allow another passenger to cancel a trip', async () => {
    mockTripFindUnique.mockResolvedValue({
      id: 'trip-1',
      passengerId: 'passenger-owner',
      driverId: 'driver-owner',
      status: 'ARRIVING',
    });

    await expect(TripsService.cancelTrip('trip-1', 'passenger-other')).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(mockTripUpdateMany).not.toHaveBeenCalled();
  });

  it('does not allow another driver to transition a trip', async () => {
    mockTripFindUnique.mockResolvedValue({
      id: 'trip-1',
      passengerId: 'passenger-owner',
      driverId: 'driver-owner',
      status: 'ARRIVING',
    });

    await expect(TripsService.updateTripStatus(
      'trip-1',
      'driver-other',
      'ARRIVED',
    )).rejects.toMatchObject({ statusCode: 403 });
    expect(mockTripUpdateMany).not.toHaveBeenCalled();
  });

  it('blocks a second active request before pricing or creation', async () => {
    mockTripFindFirst.mockResolvedValue({ id: 'trip-active' });

    await expect(TripsService.createTrip('passenger-owner', {
      originAddress: 'A',
      originLat: 21,
      originLng: 105.8,
      destAddress: 'B',
      destLat: 21.1,
      destLng: 105.9,
      vehicleType: 'BIKE',
    })).rejects.toMatchObject({
      statusCode: 409,
      code: 'PASSENGER_HAS_ACTIVE_TRIP',
    });
    expect(mockPricingEstimate).not.toHaveBeenCalled();
    expect(mockTripCreate).not.toHaveBeenCalled();
  });
});
