import request from 'supertest';
import app from '../../../app';
import { extendedPrisma as prisma } from '@repo/database';
import { SocketEventService } from '../../../socket/socket.events';
import {
  cleanDatabase,
} from '../../../test/database';
import {
  createFixtureUser,
  createFixtureDriver,
  createFixtureVehicle,
  createFixtureRide,
  createFixtureBooking,
  signTestToken,
} from '../../../test/fixtures';

describe('Booking Concurrency & Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  it('TC-BOOKING-01: PENDING không trừ ghế', async () => {
    const driver = await createFixtureDriver();
    const vehicle = await createFixtureVehicle(driver.id);
    const ride = await createFixtureRide(driver.id, vehicle.id, { availableSeats: 4 });
    const passenger = await createFixtureUser();
    const token = await signTestToken(passenger.id);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ rideId: ride.id, seats: 1, passengerLat: 21.0, passengerLng: 105.8 });

    expect(res.status).toBe(201);
    
    const dbBooking = await prisma.booking.findFirst({ where: { rideId: ride.id } });
    expect(dbBooking?.status).toBe('PENDING');

    const dbRide = await prisma.ride.findUnique({ where: { id: ride.id } });
    expect(dbRide?.availableSeats).toBe(4);
    expect(dbRide?.status).toBe('SCHEDULED');

    // Socket: BOOKING_NEW_REQUEST
    expect(SocketEventService.emitToUser).toHaveBeenCalledWith(
      driver.id,
      'booking:new_request',
      expect.objectContaining({ bookingId: dbBooking?.id })
    );
  });

  it('TC-BOOKING-02: Hai Booking tranh một ghế cuối', async () => {
    const driver = await createFixtureDriver();
    const vehicle = await createFixtureVehicle(driver.id);
    const ride = await createFixtureRide(driver.id, vehicle.id, { availableSeats: 1 });
    const p1 = await createFixtureUser();
    const p2 = await createFixtureUser();
    
    const b1 = await createFixtureBooking(ride.id, p1.id, { seats: 1 });
    const b2 = await createFixtureBooking(ride.id, p2.id, { seats: 1 });

    const driverToken = await signTestToken(driver.id);

    const req1 = request(app)
      .patch(`/api/bookings/${b1.id}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'CONFIRMED' });

    const req2 = request(app)
      .patch(`/api/bookings/${b2.id}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'CONFIRMED' });

    const results = await Promise.allSettled([req1, req2]);
    const statuses = results.map((r: any) => r.value.status).sort();
    
    expect(statuses).toEqual([200, 409]); // Một success, một conflict

    const dbRide = await prisma.ride.findUnique({ where: { id: ride.id } });
    expect(dbRide?.availableSeats).toBe(0);
    expect(dbRide?.status).toBe('FULL');

    const bookings = await prisma.booking.findMany({ where: { rideId: ride.id } });
    const bStatuses = bookings.map(b => b.status).sort();
    expect(bStatuses).toEqual(['CONFIRMED', 'PENDING']);
  });

  it('TC-BOOKING-03: Confirm cùng Booking hai lần', async () => {
    const driver = await createFixtureDriver();
    const vehicle = await createFixtureVehicle(driver.id);
    const ride = await createFixtureRide(driver.id, vehicle.id, { availableSeats: 4 });
    const p1 = await createFixtureUser();
    const b1 = await createFixtureBooking(ride.id, p1.id, { seats: 1 });
    const driverToken = await signTestToken(driver.id);

    const req1 = request(app).patch(`/api/bookings/${b1.id}/status`).set('Authorization', `Bearer ${driverToken}`).send({ status: 'CONFIRMED' });
    const req2 = request(app).patch(`/api/bookings/${b1.id}/status`).set('Authorization', `Bearer ${driverToken}`).send({ status: 'CONFIRMED' });

    const results = await Promise.allSettled([req1, req2]);
    const statuses = results.map((r: any) => r.value.status).sort();
    
    expect(statuses).toEqual([200, 409]); // Chỉ một lần trừ ghế thành công
    
    const dbRide = await prisma.ride.findUnique({ where: { id: ride.id } });
    expect(dbRide?.availableSeats).toBe(3);
  });

  it('TC-BOOKING-04: Hủy PENDING', async () => {
    const driver = await createFixtureDriver();
    const vehicle = await createFixtureVehicle(driver.id);
    const ride = await createFixtureRide(driver.id, vehicle.id, { availableSeats: 4 });
    const p1 = await createFixtureUser();
    const b1 = await createFixtureBooking(ride.id, p1.id, { seats: 1, status: 'PENDING' });
    
    const passengerToken = await signTestToken(p1.id);
    const res = await request(app).patch(`/api/bookings/${b1.id}/cancel`).set('Authorization', `Bearer ${passengerToken}`).send({ cancelReason: 'Doi y' });

    
    expect(res.status).toBe(200);
    const dbRide = await prisma.ride.findUnique({ where: { id: ride.id } });
    expect(dbRide?.availableSeats).toBe(4); // Không đổi
    expect(dbRide?.status).toBe('SCHEDULED');
  });

  it('TC-BOOKING-05: Hủy CONFIRMED đồng thời', async () => {
    const driver = await createFixtureDriver();
    const vehicle = await createFixtureVehicle(driver.id);
    const ride = await createFixtureRide(driver.id, vehicle.id, { availableSeats: 3 }); // đã trừ 1
    const p1 = await createFixtureUser();
    const b1 = await createFixtureBooking(ride.id, p1.id, { seats: 1, status: 'CONFIRMED' });
    
    const passengerToken = await signTestToken(p1.id);
    const req1 = request(app).patch(`/api/bookings/${b1.id}/cancel`).set('Authorization', `Bearer ${passengerToken}`).send({ cancelReason: 'Test' });
    const req2 = request(app).patch(`/api/bookings/${b1.id}/cancel`).set('Authorization', `Bearer ${passengerToken}`).send({ cancelReason: 'Test' });

    const results = await Promise.allSettled([req1, req2]);
    const statuses = results.map((r: any) => r.value.status).sort();
    expect(statuses).toEqual([200, 409]);

    const dbRide = await prisma.ride.findUnique({ where: { id: ride.id } });
    expect(dbRide?.availableSeats).toBe(4); // Chỉ hoàn ghế 1 lần
  });

  it('TC-BOOKING-06: FULL về SCHEDULED', async () => {
    const driver = await createFixtureDriver();
    const vehicle = await createFixtureVehicle(driver.id);
    const ride = await createFixtureRide(driver.id, vehicle.id, { availableSeats: 0, status: 'FULL' }); 
    const p1 = await createFixtureUser();
    const b1 = await createFixtureBooking(ride.id, p1.id, { seats: 2, status: 'CONFIRMED' });
    
    const passengerToken = await signTestToken(p1.id);
    const res = await request(app).patch(`/api/bookings/${b1.id}/cancel`).set('Authorization', `Bearer ${passengerToken}`).send({ cancelReason: 'Test' });

    expect(res.status).toBe(200);
    const dbRide = await prisma.ride.findUnique({ where: { id: ride.id } });
    expect(dbRide?.availableSeats).toBe(2); 
    expect(dbRide?.status).toBe('SCHEDULED'); // Đã roll về
  });

  it('TC-BOOKING-07: Create Booking trùng đồng thời', async () => {
    const driver = await createFixtureDriver();
    const vehicle = await createFixtureVehicle(driver.id);
    const ride = await createFixtureRide(driver.id, vehicle.id, { availableSeats: 4 });
    const p1 = await createFixtureUser();
    const token = await signTestToken(p1.id);

    const payload = { rideId: ride.id, seats: 1, passengerLat: 21.0, passengerLng: 105.8 };
    const req1 = request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(payload);
    const req2 = request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(payload);

    const results = await Promise.allSettled([req1, req2]);
    const statuses = results.map((r: any) => r.value.status).sort();
    
    expect(statuses).toEqual([201, 409]); // Conflict vì partial unique index
    
    const bookings = await prisma.booking.findMany({ where: { passengerId: p1.id } });
    expect(bookings.length).toBe(1);
  });

  it('TC-AUTH-01: Người ngoài confirm', async () => {
    const driver = await createFixtureDriver();
    const vehicle = await createFixtureVehicle(driver.id);
    const ride = await createFixtureRide(driver.id, vehicle.id, { availableSeats: 4 });
    const p1 = await createFixtureUser();
    const p2 = await createFixtureUser(); // Hacker
    const b1 = await createFixtureBooking(ride.id, p1.id, { seats: 1 });
    
    const hackerToken = await signTestToken(p2.id);
    const res = await request(app)
      .patch(`/api/bookings/${b1.id}/status`)
      .set('Authorization', `Bearer ${hackerToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('FORBIDDEN_BOOKING_ACCESS');
  });

});
