import request from 'supertest';
import app from '../../../app';
import { extendedPrisma as prisma } from '@repo/database';
import { cleanDatabase } from '../../../test/database';
import { createFixtureUser, createFixtureDriver, createFixtureVehicle, signTestToken } from '../../../test/fixtures';

describe('Driver Verification & Creation Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('TC-DRIVER-01: User chưa duyệt tạo Ride', async () => {
    const user = await createFixtureUser({ isDriverVerified: false });
    const token = await signTestToken(user.id);
    const vehicle = await createFixtureVehicle(user.id);

    const payload = {
      origin: 'A',
      originProvince: 'Ha Noi',
      destination: 'B',
      destProvince: 'Hai Phong',
      vehicleId: vehicle.id,
      availableSeats: 4,
      pricePerSeat: 100,
      departureTime: new Date(Date.now() + 86400000).toISOString()
    };

    const res = await request(app).post('/api/rides').set('Authorization', `Bearer ${token}`).send(payload);

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('DRIVER_NOT_APPROVED');
    const ridesCount = await prisma.ride.count();
    expect(ridesCount).toBe(0);
  });

  it('TC-DRIVER-02: Vehicle của người khác', async () => {
    const driver = await createFixtureDriver();
    const otherUser = await createFixtureUser();
    const otherVehicle = await createFixtureVehicle(otherUser.id);
    
    const token = await signTestToken(driver.id);
    const payload = {
      origin: 'A',
      originProvince: 'Ha Noi',
      destination: 'B',
      destProvince: 'Hai Phong',
      vehicleId: otherVehicle.id,
      availableSeats: 4,
      pricePerSeat: 100,
      departureTime: new Date(Date.now() + 86400000).toISOString()
    };

    const res = await request(app).post('/api/rides').set('Authorization', `Bearer ${token}`).send(payload);

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('VEHICLE_NOT_OWNED');
    const ridesCount = await prisma.ride.count();
    expect(ridesCount).toBe(0);
  });

  it('TC-DRIVER-03: Driver và Vehicle hợp lệ', async () => {
    const driver = await createFixtureDriver();
    const vehicle = await createFixtureVehicle(driver.id);
    
    const token = await signTestToken(driver.id);
    const payload = { 
      origin: 'A',
      originProvince: 'Ha Noi',
      destination: 'B',
      destProvince: 'Hai Phong',
      vehicleId: vehicle.id,
      originLat: 21.0, originLng: 105.8, destinationLat: 20.8, destinationLng: 106.6,
      availableSeats: 4,
      pricePerSeat: 100,
      departureTime: new Date(Date.now() + 86400000).toISOString() 
    };
    const res = await request(app).post('/api/rides').set('Authorization', `Bearer ${token}`).send(payload);

    expect(res.status).toBe(201);
    const rideId = res.body.ride?.id;
    const dbRide = await prisma.ride.findUnique({ where: { id: rideId } });
    expect(dbRide?.driverId).toBe(driver.id);
    expect(dbRide?.status).toBe('SCHEDULED');
  });

});
