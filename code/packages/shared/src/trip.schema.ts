import { z } from 'zod';

export const vehicleTypeSchema = z.enum(['BIKE', 'CAR']);
export const tripStatusSchema = z.enum([
  'PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'IN_PROGRESS',
  'WAITING_PAYMENT', 'COMPLETED', 'CANCELLED', 'NO_DRIVER',
]);
export const driverTripStatusSchema = z.enum(['ARRIVING', 'IN_PROGRESS', 'WAITING_PAYMENT']);

export const createTripRequestSchema = z.object({
  originAddress: z.string().trim().min(1, 'Địa chỉ điểm đón là bắt buộc'),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destAddress: z.string().trim().min(1, 'Địa chỉ điểm đến là bắt buộc'),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  vehicleType: vehicleTypeSchema.default('BIKE'),
}).refine(
  (value) => value.originLat !== value.destLat || value.originLng !== value.destLng,
  { message: 'Điểm đón và điểm đến không được trùng nhau' },
);

export type CreateTripRequestInput = z.infer<typeof createTripRequestSchema>;
export type TripStatus = z.infer<typeof tripStatusSchema>;
export type DriverTripStatus = z.infer<typeof driverTripStatusSchema>;
export type VehicleType = z.infer<typeof vehicleTypeSchema>;
