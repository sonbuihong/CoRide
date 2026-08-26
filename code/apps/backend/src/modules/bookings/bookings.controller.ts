import { Request, Response, NextFunction } from 'express';
import { BookingsService } from './bookings.service';

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await BookingsService.createBooking(req.user!.id, req.body);
    res.status(201).json({
      message: booking.status === 'CONFIRMED' ? 'Đặt chỗ đã được xác nhận' : 'Đã gửi yêu cầu, tài xế có 15 phút để phản hồi',
      booking,
    });
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
    // Axios có thể gửi PATCH không body từ các màn hình cũ. Không destructure
    // trực tiếp `undefined` vì sẽ biến một lỗi nghiệp vụ thành HTTP 500.
    const cancelReason = req.body?.cancelReason ?? 'Hành khách chủ động hủy đặt chỗ';
    const booking = await BookingsService.cancelBooking(
      req.user!.id,
      (req.params.id as string),
      cancelReason
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
    const bookings = await BookingsService.getRideBookings(
      req.user!.id,
      req.params.rideId as string
    );
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

export const getActiveBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await BookingsService.getActiveBooking(req.user!.id);
    res.json({ activeBooking: result });
  } catch (error) {
    next(error);
  }
};

export const confirmPassengerPickup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await BookingsService.confirmPassengerPickup(
      req.user!.id,
      req.params.id as string
    );
    res.json({ message: 'Đã xác nhận đón hành khách', booking });
  } catch (error) {
    next(error);
  }
};

export const markDriverArrived = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await BookingsService.markDriverArrived(
      req.user!.id,
      req.params.id as string
    );
    res.json({ message: 'Đã thông báo tài xế tới điểm đón', booking });
  } catch (error) {
    next(error);
  }
};

export const dropoffPassenger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await BookingsService.dropoffPassenger(
      req.user!.id,
      req.params.id as string
    );
    res.json({ message: 'Đã hoàn thành trả khách', booking });
  } catch (error) {
    next(error);
  }
};
