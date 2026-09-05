import { Request, Response, NextFunction } from 'express';
import { RidesService } from './rides.service';
import { SearchRideInput } from '@repo/shared';

export const createRide = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ride = await RidesService.createRide(req.user!.id, req.body);
    res.status(201).json({ message: 'Đăng chuyến đi thành công', ride });
  } catch (error) {
    next(error);
  }
};

export const searchRides = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // req.query đã được validate bởi validate(searchRideSchema, 'query') trong router
    const filters = (res.locals.validatedQuery ?? req.query) as SearchRideInput;
    const rides = await RidesService.searchRides(filters);
    res.json({ rides, total: rides.length });
  } catch (error) {
    next(error);
  }
};

export const createRideSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await RidesService.createRideSchedule(req.user!.id, req.body);
    res.status(201).json({ message: `Đã đăng ${result.rides.length} chuyến đi`, ...result });
  } catch (error) {
    next(error);
  }
};

export const getMyRides = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rides = await RidesService.searchRides({ driverId: req.user!.id });
    res.json({ rides, total: rides.length });
  } catch (error) {
    next(error);
  }
};

export const getRideById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ride = await RidesService.getRideById((req.params.id as string));
    res.json(ride);
  } catch (error) {
    next(error);
  }
};

export const updateRide = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ride = await RidesService.updateRide(
      (req.params.id as string),
      req.user!.id,
      req.body
    );
    res.json({ message: 'Cập nhật chuyến đi thành công', ride });
  } catch (error) {
    next(error);
  }
};

export const deleteRide = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await RidesService.deleteRide((req.params.id as string), req.user!.id);
    res.json({ message: 'Đã hủy chuyến đi thành công' });
  } catch (error) {
    next(error);
  }
};

export const updateRideStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, cancelReason } = req.body;
    const ride = await RidesService.updateRideStatus(
      (req.params.id as string),
      req.user!.id,
      status,
      cancelReason
    );
    res.json({ message: 'Cập nhật trạng thái chuyến đi thành công', ride });
  } catch (error) {
    next(error);
  }
};

export const cancelRideSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await RidesService.cancelRideSchedule(
      req.params.scheduleId as string,
      req.user!.id,
      req.body.cancelReason,
    );
    res.json({
      message: result.cancelledCount > 0
        ? `Đã hủy ${result.cancelledCount} chuyến trong lịch`
        : 'Lịch chuyến không còn ngày nào có thể hủy',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoutePickupSharing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ride = await RidesService.updateRoutePickupSharing(
      req.params.id as string,
      req.user!.id,
      req.body.enabled,
    );
    res.json({
      message: req.body.enabled
        ? 'Đã bật tiếp tục nhận khách dọc đường'
        : 'Đã tắt nhận thêm khách dọc đường',
      ride,
    });
  } catch (error) {
    next(error);
  }
};

