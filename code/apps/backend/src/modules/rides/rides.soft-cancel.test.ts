const mockRideFindUnique = jest.fn();
const mockRideUpdate = jest.fn();
const mockRideDelete = jest.fn();
const mockEmitGlobal = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    ride: { findUnique: mockRideFindUnique, update: mockRideUpdate, delete: mockRideDelete },
  },
  Prisma: {},
}));

jest.mock('../../socket/socket.events', () => ({
  SocketEventService: { emitGlobal: mockEmitGlobal },
}));

import { RidesService } from './rides.service';

describe('RidesService soft cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the ride record and marks it CANCELLED with a default reason', async () => {
    mockRideFindUnique.mockResolvedValue({ id: 'ride-1', driverId: 'driver-1', status: 'SCHEDULED', cancelReason: null });
    mockRideUpdate.mockResolvedValue({ id: 'ride-1', driverId: 'driver-1', status: 'CANCELLED', cancelReason: 'Tài xế đã hủy chuyến' });

    await expect(RidesService.deleteRide('ride-1', 'driver-1')).resolves.toMatchObject({ status: 'CANCELLED' });
    expect(mockRideUpdate).toHaveBeenCalledWith({
      where: { id: 'ride-1' },
      data: { status: 'CANCELLED', cancelReason: 'Tài xế đã hủy chuyến' },
    });
    expect(mockRideDelete).not.toHaveBeenCalled();
    expect(mockEmitGlobal).toHaveBeenCalledWith('ride:updated', expect.objectContaining({ status: 'CANCELLED' }));
  });

  it('rejects cancellation by another driver', async () => {
    mockRideFindUnique.mockResolvedValue({ id: 'ride-1', driverId: 'driver-2', status: 'SCHEDULED' });
    await expect(RidesService.deleteRide('ride-1', 'driver-1')).rejects.toMatchObject({ statusCode: 403 });
    expect(mockRideUpdate).not.toHaveBeenCalled();
  });

  it('does not cancel an ongoing ride', async () => {
    mockRideFindUnique.mockResolvedValue({ id: 'ride-1', driverId: 'driver-1', status: 'ONGOING' });
    await expect(RidesService.deleteRide('ride-1', 'driver-1')).rejects.toMatchObject({ statusCode: 400 });
    expect(mockRideUpdate).not.toHaveBeenCalled();
  });
});
