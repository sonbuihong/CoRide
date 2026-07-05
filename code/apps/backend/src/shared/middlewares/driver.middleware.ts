import { Request, Response, NextFunction } from 'express';
import { extendedPrisma as prisma } from '@repo/database';

export const requireApprovedDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isDriverVerified: true }
    });

    if (!user || !user.isDriverVerified) {
      return res.status(403).json({ success: false, errorCode: 'DRIVER_NOT_APPROVED', error: 'DRIVER_NOT_APPROVED' });
    }

    const { vehicleId } = req.body;
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId }
      });
      if (!vehicle) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy phương tiện' });
      }
      if (vehicle.userId !== userId) {
        return res.status(403).json({ success: false, errorCode: 'VEHICLE_NOT_OWNED', error: 'VEHICLE_NOT_OWNED' });
      }
      if (vehicle.status !== 'ACTIVE') {
        return res.status(400).json({ success: false, error: 'Phương tiện không hợp lệ để tạo chuyến' });
      }
    }

    next();
  } catch(e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
};
