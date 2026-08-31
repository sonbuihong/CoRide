const mockEmitToRooms = jest.fn();

jest.mock('../../socket/socket.events', () => ({
  SocketEventService: { emitToRooms: mockEmitToRooms },
}));

import { SocketEvents } from '@repo/shared';
import { emitTripUpdated } from './trip-realtime.service';

describe('Ride-Hailing realtime contract', () => {
  beforeEach(() => jest.clearAllMocks());

  it('emits one canonical event to the union of participant and trip rooms', () => {
    const updatedAt = new Date('2026-08-30T12:00:00.000Z');
    const payload = emitTripUpdated({
      id: 'trip-1',
      status: 'ARRIVED',
      passengerId: 'passenger-1',
      driverId: 'driver-1',
      updatedAt,
    }, { previousStatus: 'ARRIVING' });

    expect(mockEmitToRooms).toHaveBeenCalledTimes(1);
    expect(mockEmitToRooms).toHaveBeenCalledWith(
      ['user:passenger-1', 'user:driver-1', 'trip:trip-1'],
      SocketEvents.TRIP_UPDATED,
      payload,
    );
    expect(payload).toMatchObject({
      tripId: 'trip-1',
      status: 'ARRIVED',
      previousStatus: 'ARRIVING',
      passengerId: 'passenger-1',
      driverId: 'driver-1',
      updatedAt: updatedAt.toISOString(),
    });
  });
});
