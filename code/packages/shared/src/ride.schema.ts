import { z } from 'zod';

export const bookingPolicySchema = z.enum(['INSTANT', 'DRIVER_APPROVAL']);

export const rideStopInputSchema = z.object({
  name: z.string().trim().max(200).optional(),
  address: z.string().trim().min(2, 'Địa chỉ điểm dừng là bắt buộc').max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const futureIsoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Thời gian khởi hành không hợp lệ',
}).refine((value) => new Date(value) > new Date(), {
  message: 'Thời gian khởi hành phải ở tương lai',
});

export const createRideSchema = z.object({
  // Structured origin address
  originHouseNumber: z.string().optional(),
  originStreet: z.string().optional(),
  originWard: z.string().optional(),
  originDistrict: z.string().optional(),
  originProvince: z.string({
    required_error: "Tỉnh/Thành phố là bắt buộc",
  }),
  originAddressType: z.enum(['OLD', 'NEW']).optional(),

  // Structured destination address
  destHouseNumber: z.string().optional(),
  destStreet: z.string().optional(),
  destWard: z.string().optional(),
  destDistrict: z.string().optional(),
  destProvince: z.string({
    required_error: "Tỉnh/Thành phố là bắt buộc",
  }),
  destAddressType: z.enum(['OLD', 'NEW']).optional(),

  // Metadata
  addressDetailLevel: z.enum(['FULL', 'WARD', 'DISTRICT']).optional(),

  // Keep existing fields for backward compatibility
  origin: z.string().optional(),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  destination: z.string().optional(),
  destinationLat: z.number().optional(),
  destinationLng: z.number().optional(),
  distance: z.number().optional(),
  duration: z.number().optional(),
  routePolyline: z.string().optional(),
  departureTime: futureIsoDate,
  availableSeats: z.coerce.number({
    required_error: "Số chỗ trống là bắt buộc",
  }).int().min(1, "Phải có ít nhất 1 chỗ trống"),
  pricePerSeat: z.coerce.number({
    required_error: "Giá mỗi chỗ là bắt buộc",
  }).min(0, "Giá không được âm"),
  description: z.string().max(1000, "Mô tả không được vượt quá 1000 ký tự").optional().or(z.literal('')),
  // Quy định chuyến đi — mặc định được xử lý ở backend nếu không truyền
  allowRoutePickup: z.boolean().optional(),
  allowSmoking: z.boolean().optional(),
  allowPets: z.boolean().optional(),
  allowLuggage: z.boolean().optional(),
  bookingPolicy: bookingPolicySchema.optional(),
  stops: z.array(rideStopInputSchema).max(3, 'Chỉ được thêm tối đa 3 điểm dừng').optional(),
  // Phương tiện — optional, tài xế có thể không chọn
  vehicleId: z.string().uuid("vehicleId không hợp lệ").optional(),
});

export const searchRideSchema = z.object({
  origin: z.string().optional().or(z.literal('')),
  originLat: z.coerce.number().min(-90).max(90).optional(),
  originLng: z.coerce.number().min(-180).max(180).optional(),
  destination: z.string().optional().or(z.literal('')),
  destinationLat: z.coerce.number().min(-90).max(90).optional(),
  destinationLng: z.coerce.number().min(-180).max(180).optional(),
  date: z.string().optional().or(z.literal('')),
  seats: z.coerce.number().int().min(1).max(10).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  departurePeriod: z.enum(['MORNING', 'AFTERNOON', 'EVENING']).optional(),
  vehicleType: z.enum(['BIKE', 'CAR']).optional(),
  driverId: z.string().optional().or(z.literal('')),
});

export const createRideScheduleSchema = createRideSchema.omit({ departureTime: true }).extend({
  departureTimes: z.array(futureIsoDate).min(1, 'Chọn ít nhất một ngày khởi hành').max(30, 'Chỉ được chọn tối đa 30 ngày'),
  timezone: z.literal('Asia/Ho_Chi_Minh').default('Asia/Ho_Chi_Minh'),
}).superRefine((value, ctx) => {
  const timestamps = value.departureTimes.map((item) => new Date(item).getTime());
  if (new Set(timestamps).size !== timestamps.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['departureTimes'], message: 'Ngày khởi hành không được trùng nhau' });
  }
  const maximum = new Date();
  maximum.setMonth(maximum.getMonth() + 6);
  maximum.setHours(23, 59, 59, 999);
  value.departureTimes.forEach((item, index) => {
    if (new Date(item) > maximum) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['departureTimes', index], message: 'Ngày khởi hành không được quá 6 tháng' });
    }
  });
});

export const updateRideStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'], {
    required_error: "Trạng thái chuyến đi là bắt buộc",
  }),
  cancelReason: z.string().optional(),
});

export type CreateRideInput = z.infer<typeof createRideSchema>;
export type CreateRideScheduleInput = z.infer<typeof createRideScheduleSchema>;
export type RideStopInput = z.infer<typeof rideStopInputSchema>;
export type BookingPolicy = z.infer<typeof bookingPolicySchema>;
export type SearchRideInput = z.infer<typeof searchRideSchema>;
export type UpdateRideStatusInput = z.infer<typeof updateRideStatusSchema>;

