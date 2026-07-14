import { Request, Response } from 'express';
import { VehiclesService } from './vehicles.service';
import { VehicleType, VehicleStatus } from '@repo/database';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const getMyVehicles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const vehicles = await VehiclesService.getMyVehicles(req.user!.id);
  res.json(vehicles);
});

export const getVehicleById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const vehicle = await VehiclesService.getVehicleById(req.user!.id, req.params.id as string);
  res.json(vehicle);
});

export const createVehicle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { licensePlate, type, color, imageUrl } = req.body;
  
  // Basic validation
  if (!licensePlate || !type) {
    res.status(400).json({ message: 'Vui lòng cung cấp biển số và loại xe' });
    return;
  }

  const vehicle = await VehiclesService.createVehicle(req.user!.id, {
    licensePlate,
    type: type as VehicleType,
    color,
    imageUrl
  });
  
  res.status(201).json({ message: 'Thêm phương tiện thành công', vehicle });
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { type, color, status, imageUrl } = req.body;
  
  const vehicle = await VehiclesService.updateVehicle(req.user!.id, req.params.id as string, {
    type: type as VehicleType | undefined,
    color,
    status: status as VehicleStatus | undefined,
    imageUrl
  });
  
  res.json({ message: 'Cập nhật phương tiện thành công', vehicle });
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await VehiclesService.deleteVehicle(req.user!.id, req.params.id as string);
  res.json({ message: 'Xóa phương tiện thành công' });
});
