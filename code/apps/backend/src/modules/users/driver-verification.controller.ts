import { Request, Response, NextFunction } from 'express';
import { DriverVerificationService } from './driver-verification.service';
import { AppError } from '../../shared/errors/AppError';

export class DriverVerificationController {
  /**
   * POST /users/driver-verification
   * User gửi yêu cầu xác thực tài xế (upload giấy tờ).
   */
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Không xác định được người dùng', 401);

      const {
        licenseFrontImageUrl,
        licenseBackImageUrl,
        registrationFrontImageUrl,
        registrationBackImageUrl,
        vehiclePlate,
        vehicleModel,
        vehicleType,
      } = req.body;

      if (
        !licenseFrontImageUrl ||
        !licenseBackImageUrl ||
        !registrationFrontImageUrl ||
        !registrationBackImageUrl ||
        !vehiclePlate ||
        !vehicleModel ||
        !vehicleType
      ) {
        throw new AppError(
          'Vui lòng cung cấp đầy đủ: ảnh bằng lái xe (2 mặt), ảnh đăng ký xe (2 mặt), biển số xe, hãng xe, và loại phương tiện',
          400
        );
      }

      if (!['BIKE', 'CAR'].includes(vehicleType)) {
        throw new AppError(
          'Loại phương tiện không hợp lệ. Phải là BIKE hoặc CAR',
          400
        );
      }

      const verification = await DriverVerificationService.submitVerification(
        userId,
        {
          licenseFrontImageUrl,
          licenseBackImageUrl,
          registrationFrontImageUrl,
          registrationBackImageUrl,
          vehiclePlate,
          vehicleModel,
          vehicleType,
        }
      );

      res.status(201).json({
        status: 'success',
        message: 'Yêu cầu xác thực đã được gửi. Vui lòng chờ admin duyệt.',
        data: verification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/driver-verification
   * User xem trạng thái xác thực tài xế hiện tại.
   */
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Không xác định được người dùng', 401);

      const verification = await DriverVerificationService.getVerificationStatus(userId);

      res.status(200).json({
        status: 'success',
        data: verification, // null nếu chưa gửi lần nào
      });
    } catch (error) {
      next(error);
    }
  }
}
