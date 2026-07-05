
import { extendedPrisma as prisma } from '@repo/database';

jest.mock('../socket/socket.events', () => ({
  SocketEventService: {
    emitToUser: jest.fn(),
    emitToRoom: jest.fn(),
  }
}));

afterAll(async () => {
  await prisma.$disconnect();
});
