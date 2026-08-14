import express from 'express';
import request from 'supertest';
import { searchRideSchema } from '@repo/shared';
import { validate } from './validate.middleware';

describe('validate query middleware', () => {
  it('giữ lại giá trị query đã được Zod chuyển sang number trên Express 5', async () => {
    const app = express();
    app.get('/rides', validate(searchRideSchema, 'query'), (_req, res) => {
      res.json(res.locals.validatedQuery);
    });

    const response = await request(app).get('/rides').query({
      originLat: '21.0287',
      originLng: '105.8522',
      destinationLat: '20.9646',
      destinationLng: '105.8422',
      seats: '2',
      maxPrice: '100000',
      departurePeriod: 'MORNING',
      vehicleType: 'CAR',
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      originLat: 21.0287,
      originLng: 105.8522,
      destinationLat: 20.9646,
      destinationLng: 105.8422,
      seats: 2,
      maxPrice: 100000,
      departurePeriod: 'MORNING',
      vehicleType: 'CAR',
    });
  });
});
