import { Request, Response } from 'express';
import { BookingsService } from './bookings.service';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const createBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const booking = await BookingsService.createBooking(req.user!.id, req.body);
  res.status(201).json({ message: 'Gửi yêu cầu đặt chỗ thành công', booking });
});

export const getBookingById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const booking = await BookingsService.getBookingById(
    req.user!.id,
    req.params.id as string
  );
  res.json({ booking });
});

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const booking = await BookingsService.updateBookingStatus(
    req.user!.id,
    (req.params.id as string),
    req.body
  );

  const statusMessages: Record<string, string> = {
    CONFIRMED: 'Đã xác nhận đặt chỗ',
    REJECTED: 'Đã từ chối đặt chỗ',
  };

  const message =
    statusMessages[req.body.status as string] ?? 'Cập nhật trạng thái thành công';
  res.json({ message, booking });
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { cancelReason } = req.body;
  const booking = await BookingsService.cancelBooking(
    req.user!.id,
    (req.params.id as string),
    cancelReason
  );
  res.json({ message: 'Đã hủy yêu cầu đặt chỗ', booking });
});

export const getMyBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const bookings = await BookingsService.getUserBookings(req.user!.id);
  res.json({ bookings });
});

export const getRideBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const bookings = await BookingsService.getRideBookings((req.params.rideId as string));
  res.json({ bookings });
});

export const getDriverBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const bookings = await BookingsService.getDriverBookings(req.user!.id);
  res.json({ bookings });
});

export const getActiveBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await BookingsService.getActiveBooking(req.user!.id);
  res.json({ activeBooking: result });
});

export const confirmPassengerPickup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const booking = await BookingsService.confirmPassengerPickup(
    req.user!.id,
    req.params.id as string
  );
  res.json({ message: 'Đã xác nhận đón hành khách', booking });
});

export const dropoffPassenger = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const booking = await BookingsService.dropoffPassenger(
    req.user!.id,
    req.params.id as string
  );
  res.json({ message: 'Đã hoàn thành trả khách', booking });
});
