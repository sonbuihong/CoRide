import { Request, Response, NextFunction } from 'express';
import { BookingsService } from './bookings.service';

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await BookingsService.createBooking(req.user!.id, req.body);
    res.status(201).json({ message: 'Gửi yêu cầu đặt chỗ thành công', booking });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await BookingsService.getBookingById(
      req.user!.id,
      req.params.id as string
    );
    res.json({ booking });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await BookingsService.cancelBooking(
      req.user!.id,
      (req.params.id as string)
    );
    res.json({ message: 'Đã hủy yêu cầu đặt chỗ', booking });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bookings = await BookingsService.getUserBookings(req.user!.id);
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

export const getRideBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bookings = await BookingsService.getRideBookings((req.params.rideId as string));
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

export const getDriverBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bookings = await BookingsService.getDriverBookings(req.user!.id);
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};
