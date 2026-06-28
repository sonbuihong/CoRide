import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { VehicleType, VehicleStatus } from '@repo/database';

interface CreateVehicleInput {
  licensePlate: string;
  type: VehicleType;
  color?: string;
  imageUrl?: string;
}

interface UpdateVehicleInput {
  type?: VehicleType;
  color?: string;
  status?: VehicleStatus;
  imageUrl?: string;
}

export class VehiclesService {
  static async getMyVehicles(userId: string) {
    return prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getVehicleById(userId: string, vehicleId: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new AppError('Không tìm thấy phương tiện', 404);
    }
    
    if (vehicle.userId !== userId) {
      throw new AppError('Bạn không có quyền truy cập phương tiện này', 403);
    }

    return vehicle;
  }

  static async createVehicle(userId: string, data: CreateVehicleInput) {
    // Check if license plate already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: data.licensePlate },
    });

    if (existingVehicle) {
      throw new AppError('Biển số xe đã được đăng ký', 400);
    }

    return prisma.vehicle.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  static async updateVehicle(userId: string, vehicleId: string, data: UpdateVehicleInput) {
    // Verify ownership
    await this.getVehicleById(userId, vehicleId);

    return prisma.vehicle.update({
      where: { id: vehicleId },
      data,
    });
  }

  static async deleteVehicle(userId: string, vehicleId: string) {
    // Verify ownership
    await this.getVehicleById(userId, vehicleId);

    // Instead of hard delete, maybe just mark as inactive, or hard delete if not linked to completed rides
    // To keep it simple as requested, let's hard delete
    return prisma.vehicle.delete({
      where: { id: vehicleId },
    });
  }
}
