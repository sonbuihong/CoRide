import { z } from 'zod';

export const createBookingSchema = z.object({
  rideId: z.string({
    required_error: "Mã chuyến đi là bắt buộc",
  }).uuid("Mã chuyến đi không hợp lệ"),
  seats: z.coerce.number({
    required_error: "Số ghế đặt là bắt buộc",
  }).int().min(1, "Phải đặt ít nhất 1 ghế"),
  // Toạ độ vị trí hiện tại của hành khách — bắt buộc khi ghép chuyến ONGOING
  // Optional ở schema level; backend validate bắt buộc nếu ride đang ONGOING
  passengerLat: z.number().min(-90).max(90).optional(),
  passengerLng: z.number().min(-180).max(180).optional(),
  pickupAddress: z.string().max(500).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'REJECTED', 'CANCELLED'], {
    errorMap: () => ({ message: "Trạng thái không hợp lệ" }),
  }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
