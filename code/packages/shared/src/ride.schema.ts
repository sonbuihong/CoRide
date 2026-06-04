import { z } from 'zod';

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
  departureTime: z.string({
    required_error: "Thời gian khởi hành là bắt buộc",
  }).refine((val) => !isNaN(Date.parse(val)), {
    message: "Thời gian khởi hành không hợp lệ",
  }).refine((val) => new Date(val) > new Date(), {
    message: "Thời gian khởi hành phải ở tương lai",
  }),
  availableSeats: z.coerce.number({
    required_error: "Số chỗ trống là bắt buộc",
  }).int().min(1, "Phải có ít nhất 1 chỗ trống"),
  pricePerSeat: z.coerce.number({
    required_error: "Giá mỗi chỗ là bắt buộc",
  }).min(0, "Giá không được âm"),
  description: z.string().max(1000, "Mô tả không được vượt quá 1000 ký tự").optional().or(z.literal('')),
});

export const searchRideSchema = z.object({
  origin: z.string().optional().or(z.literal('')),
  destination: z.string().optional().or(z.literal('')),
  date: z.string().optional().or(z.literal('')),
  driverId: z.string().optional().or(z.literal('')),
});

export const updateRideStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'], {
    required_error: "Trạng thái chuyến đi là bắt buộc",
  }),
});

export type CreateRideInput = z.infer<typeof createRideSchema>;
export type SearchRideInput = z.infer<typeof searchRideSchema>;
export type UpdateRideStatusInput = z.infer<typeof updateRideStatusSchema>;

