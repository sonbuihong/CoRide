import { extendedPrisma as prisma } from '@repo/database';
import * as jose from 'jose';

export const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? 'super-secret-fallback-key');

export const signTestToken = async (userId: string, role: string = 'USER') => {
  return await new jose.SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(getSecret());
};

let phoneCounter = 100000;
export const createFixtureUser = async (overrides: any = {}) => {
  phoneCounter++;
  return await prisma.user.create({
    data: {
      email: `test${phoneCounter}@coride.local`,
      password: 'password123',
      phone: `09${Math.floor(10000000 + Math.random() * 90000000)}${phoneCounter}`.substring(0, 15),
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      ...overrides,
    }
  });
};

export const createFixtureDriver = async (overrides: any = {}) => {
  return await createFixtureUser({
    isDriverVerified: true,
    ...overrides,
  });
};

let vehicleCounter = 100000;
export const createFixtureVehicle = async (userId: string, overrides: any = {}) => {
  vehicleCounter++;
  return await prisma.vehicle.create({
    data: {
      userId,
      licensePlate: `29A-${vehicleCounter}`,
      color: 'White',
      status: 'ACTIVE',
      type: 'CAR',
      ...overrides,
    }
  });
};

export const createFixtureRide = async (driverId: string, vehicleId: string, overrides: any = {}) => {
  return await prisma.ride.create({
    data: {
      driverId,
      vehicleId,
      origin: 'Hanoi',
      originLat: 21.0,
      originLng: 105.8,
      destination: 'Hai Phong',
      destinationLat: 20.8,
      destinationLng: 106.6,
      departureTime: new Date(Date.now() + 86400000), // tomorrow
      availableSeats: 4,
      pricePerSeat: 100000,
      status: 'SCHEDULED',
      ...overrides,
    }
  });
};

export const createFixtureBooking = async (rideId: string, passengerId: string, overrides: any = {}) => {
  return await prisma.booking.create({
    data: {
      rideId,
      passengerId,
      seats: 1,
      totalPrice: 100000,
      status: 'PENDING',
      ...overrides,
    }
  });
};
