import { Request, Response } from 'express';
import { RidesService } from './rides.service';
import { SearchRideInput } from '@repo/shared';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const createRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const ride = await RidesService.createRide(req.user!.id, req.body);
  res.status(201).json({ message: 'Đăng chuyến đi thành công', ride });
});

export const searchRides = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // req.query đã được validate bởi validate(searchRideSchema, 'query') trong router
  const rides = await RidesService.searchRides(req.query as unknown as SearchRideInput);
  res.json({ rides, total: rides.length });
});

export const getRideById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const ride = await RidesService.getRideById((req.params.id as string));
  res.json(ride);
});

export const updateRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const ride = await RidesService.updateRide(
    (req.params.id as string),
    req.user!.id,
    req.body
  );
  res.json({ message: 'Cập nhật chuyến đi thành công', ride });
});

export const deleteRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await RidesService.deleteRide((req.params.id as string), req.user!.id);
  res.json({ message: 'Xóa chuyến đi thành công' });
});

export const updateRideStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status, cancelReason } = req.body;
  const ride = await RidesService.updateRideStatus(
    (req.params.id as string),
    req.user!.id,
    status,
    cancelReason
  );
  res.json({ message: 'Cập nhật trạng thái chuyến đi thành công', ride });
});

