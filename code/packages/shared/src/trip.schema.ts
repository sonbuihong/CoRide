import { z } from 'zod';

export const vehicleTypeSchema = z.enum(['BIKE', 'CAR']);
export const tripStatusSchema = z.enum([
  'PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS',
  'WAITING_PAYMENT', 'COMPLETED', 'CANCELLED', 'NO_DRIVER',
]);
export const driverTripStatusSchema = z.enum(['ARRIVING', 'ARRIVED', 'IN_PROGRESS', 'WAITING_PAYMENT']);

export const completeTripSchema = z.object({
  confirmFarFromDestination: z.boolean().optional().default(false),
});

export const cancelTripSchema = z.object({
  cancelReason: z.string().trim().max(500, 'Lý do hủy không được vượt quá 500 ký tự').optional(),
  reason: z.string().trim().max(500, 'Lý do hủy không được vượt quá 500 ký tự').optional(),
});

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
export type CompleteTripInput = z.infer<typeof completeTripSchema>;
export type CancelTripInput = z.infer<typeof cancelTripSchema>;
export type VehicleType = z.infer<typeof vehicleTypeSchema>;
