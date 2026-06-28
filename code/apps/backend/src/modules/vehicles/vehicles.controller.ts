import { Request, Response, NextFunction } from 'express';
import { VehiclesService } from './vehicles.service';
import { VehicleType, VehicleStatus } from '@repo/database';

export const getMyVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicles = await VehiclesService.getMyVehicles(req.user!.id);
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
};

export const getVehicleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicle = await VehiclesService.getVehicleById(req.user!.id, req.params.id as string);
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
};

export const createVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, color, status, imageUrl } = req.body;
    
    const vehicle = await VehiclesService.updateVehicle(req.user!.id, req.params.id as string, {
      type: type as VehicleType | undefined,
      color,
      status: status as VehicleStatus | undefined,
      imageUrl
    });
    
    res.json({ message: 'Cập nhật phương tiện thành công', vehicle });
  } catch (error) {
    next(error);
  }
};

export const deleteVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await VehiclesService.deleteVehicle(req.user!.id, req.params.id as string);
    res.json({ message: 'Xóa phương tiện thành công' });
  } catch (error) {
    next(error);
  }
};
