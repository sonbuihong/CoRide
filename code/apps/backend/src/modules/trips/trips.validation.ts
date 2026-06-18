import { z } from 'zod';

// ─── Validation cho Trips API ────────────────────────────────────────────────

/**
 * Schema validate request tạo TripRequest (hành khách gọi xe).
 */
export const createTripRequestSchema = z.object({
  // Điểm đón — bắt buộc
  originAddress: z.string({ required_error: 'Địa chỉ điểm đón là bắt buộc' })
    .min(1, 'Địa chỉ điểm đón không được rỗng'),
  originLat: z.number({ required_error: 'Vĩ độ điểm đón là bắt buộc' })
    .min(-90).max(90),
  originLng: z.number({ required_error: 'Kinh độ điểm đón là bắt buộc' })
    .min(-180).max(180),

  // Điểm đến — bắt buộc
  destAddress: z.string({ required_error: 'Địa chỉ điểm đến là bắt buộc' })
    .min(1, 'Địa chỉ điểm đến không được rỗng'),
  destLat: z.number({ required_error: 'Vĩ độ điểm đến là bắt buộc' })
    .min(-90).max(90),
  destLng: z.number({ required_error: 'Kinh độ điểm đến là bắt buộc' })
    .min(-180).max(180),

  // Loại phương tiện
  vehicleType: z.enum(['BIKE', 'CAR']).optional().default('BIKE'),
});

export type CreateTripRequestInput = z.infer<typeof createTripRequestSchema>;
