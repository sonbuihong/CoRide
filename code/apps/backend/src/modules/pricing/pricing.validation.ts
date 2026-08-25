import { z } from 'zod';

// ─── Validation cho Pricing API ──────────────────────────────────────────────

/**
 * Schema validate request ước tính giá.
 * Tất cả toạ độ đều bắt buộc — không cho phép ước tính khi thiếu thông tin.
 */
export const estimatePriceSchema = z.object({
  originLat: z.number({ required_error: 'Vĩ độ điểm đón là bắt buộc' })
    .min(-90).max(90),
  originLng: z.number({ required_error: 'Kinh độ điểm đón là bắt buộc' })
    .min(-180).max(180),
  destLat: z.number({ required_error: 'Vĩ độ điểm đến là bắt buộc' })
    .min(-90).max(90),
  destLng: z.number({ required_error: 'Kinh độ điểm đến là bắt buộc' })
    .min(-180).max(180),
  vehicleType: z.enum(['BIKE', 'CAR']).optional(),
});

export const estimateCarpoolPriceSchema = estimatePriceSchema.extend({
  vehicleType: z.enum(['BIKE', 'CAR']),
  offeredSeats: z.coerce.number().int().min(1).max(7),
  tollCost: z.coerce.number().min(0).optional(),
});

export const estimateCarpoolRouteSchema = estimateCarpoolPriceSchema.extend({
  waypoints: z.array(z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })).max(3).default([]),
  routePolyline: z.string().min(1).max(100000).optional(),
});

/**
 * Schema validate request upsert PricingConfig (Admin).
 */
export const upsertPricingConfigSchema = z.object({
  vehicleType: z.enum(['BIKE', 'CAR'], {
    required_error: 'Loại phương tiện là bắt buộc (BIKE hoặc CAR)',
  }),
  baseFare: z.number({ required_error: 'Giá mở cửa là bắt buộc' })
    .min(0, 'Giá mở cửa không được âm'),
  pricePerKm: z.number({ required_error: 'Giá mỗi km là bắt buộc' })
    .min(0, 'Giá mỗi km không được âm'),
  pricePerMinute: z.number().min(0, 'Giá mỗi phút không được âm').optional(),
  baseDistance: z.number().min(0).optional(),
  minFare: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  fuelPrice: z.number().positive().optional(),
  fuelConsumption: z.number().positive().optional(),
  vehicleOverheadRatio: z.number().min(0).max(2).optional(),
  minimumDriverShare: z.number().min(0.2).max(1).optional(),
  driverPriceAdjustment: z.number().min(0).max(0.2).optional(),
  roundingUnit: z.number().int().positive().optional(),
  maxDetourKm: z.number().positive().optional(),
  maxDetourRatio: z.number().positive().max(1).optional(),
});

export type EstimatePriceInput = z.infer<typeof estimatePriceSchema>;
export type UpsertPricingConfigInput = z.infer<typeof upsertPricingConfigSchema>;
