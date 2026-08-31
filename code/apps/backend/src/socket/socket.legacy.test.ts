import type { Server, Socket } from 'socket.io';

import { refreshDriverOnline, updateDriverLocation } from '../shared/lib/redis';
import { registerLegacySocket } from './socket.legacy';

jest.mock('../modules/chat/chat.service', () => ({
  ChatService: { saveMessage: jest.fn() },
}));

jest.mock('../shared/lib/redis', () => ({
  setDriverOnline: jest.fn(),
  setDriverOffline: jest.fn(),
  updateDriverLocation: jest.fn(),
  removeDriverLocation: jest.fn(),
  refreshDriverOnline: jest.fn(),
}));

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    user: { findUnique: jest.fn() },
    ride: { findFirst: jest.fn() },
  },
}));

describe('legacy driver location listener', () => {
  it('does not double-handle an active-trip location payload', async () => {
    const handlers = new Map<string, (data: unknown) => unknown>();
    const socket = {
      data: {},
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      on: jest.fn((event: string, handler: (data: unknown) => unknown) => {
        handlers.set(event, handler);
        return socket;
      }),
    } as unknown as Socket;
    const io = { to: jest.fn() } as unknown as Server;

    registerLegacySocket(io, socket, 'driver-1');
    const locationHandler = handlers.get('driver:update_location');
    expect(locationHandler).toBeDefined();

    await locationHandler?.({
      tripId: 'trip-1',
      latitude: 21.0285,
      longitude: 105.8542,
    });
    expect(updateDriverLocation).not.toHaveBeenCalled();
    expect(refreshDriverOnline).not.toHaveBeenCalled();

    await locationHandler?.({ latitude: 21.0285, longitude: 105.8542 });
    expect(updateDriverLocation).toHaveBeenCalledTimes(1);
    expect(refreshDriverOnline).toHaveBeenCalledTimes(1);
  });
});
