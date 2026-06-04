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
    const rides = await RidesService.searchRides(req.query as unknown as SearchRideInput);
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
    res.json({ message: 'Xóa chuyến đi thành công' });
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
    const { status } = req.body;
    const ride = await RidesService.updateRideStatus(
      (req.params.id as string),
      req.user!.id,
      status
    );
    res.json({ message: 'Cập nhật trạng thái chuyến đi thành công', ride });
  } catch (error) {
    next(error);
  }
};

