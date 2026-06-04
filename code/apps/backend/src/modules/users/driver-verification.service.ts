import { extendedPrisma as prisma } from '@repo/database';
import { VerificationStatus } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';

interface SubmitVerificationInput {
  licenseFrontImageUrl: string;
  licenseBackImageUrl: string;
  registrationFrontImageUrl: string;
  registrationBackImageUrl: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleType: string;
}

export class DriverVerificationService {
  /**
   * Gửi yêu cầu xác thực tài xế (KYC).
   * Nếu đã có bản ghi bị REJECTED → cho phép gửi lại (upsert).
   */
  static async submitVerification(userId: string, data: SubmitVerificationInput) {
    const existing = await prisma.driverVerification.findUnique({
      where: { userId },
    });

    // Nếu đã APPROVED → không cho gửi lại
    if (existing?.status === VerificationStatus.APPROVED) {
      throw new AppError('Tài khoản của bạn đã được xác thực tài xế', 400);
    }

    // Nếu đang PENDING → không cho gửi lại (chờ admin duyệt)
    if (existing?.status === VerificationStatus.PENDING) {
      throw new AppError(
        'Yêu cầu xác thực của bạn đang chờ admin duyệt. Vui lòng đợi.',
        400
      );
    }

    // Upsert: tạo mới hoặc cập nhật nếu bị REJECTED
    return prisma.driverVerification.upsert({
      where: { userId },
      create: {
        userId,
        licenseFrontImageUrl: data.licenseFrontImageUrl,
        licenseBackImageUrl: data.licenseBackImageUrl,
        registrationFrontImageUrl: data.registrationFrontImageUrl,
        registrationBackImageUrl: data.registrationBackImageUrl,
        vehiclePlate: data.vehiclePlate,
        vehicleModel: data.vehicleModel,
        vehicleType: data.vehicleType,
        status: VerificationStatus.PENDING,
      },
      update: {
        licenseFrontImageUrl: data.licenseFrontImageUrl,
        licenseBackImageUrl: data.licenseBackImageUrl,
        registrationFrontImageUrl: data.registrationFrontImageUrl,
        registrationBackImageUrl: data.registrationBackImageUrl,
        vehiclePlate: data.vehiclePlate,
        vehicleModel: data.vehicleModel,
        vehicleType: data.vehicleType,
        status: VerificationStatus.PENDING,
        rejectionReason: null,
        reviewedAt: null,
      },
    });
  }

  /**
   * Lấy trạng thái xác thực tài xế hiện tại.
   */
  static async getVerificationStatus(userId: string) {
    const verification = await prisma.driverVerification.findUnique({
      where: { userId },
    });

    return verification;
  }

  /**
   * [ADMIN] Lấy danh sách tất cả yêu cầu xác thực đang PENDING.
   */
  static async getPendingVerifications() {
    return prisma.driverVerification.findMany({
      where: { status: VerificationStatus.PENDING },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * [ADMIN] Duyệt hoặc từ chối yêu cầu xác thực.
   * Khi APPROVED → cập nhật isDriverVerified = true trên User.
   */
  static async reviewVerification(
    verificationId: string,
    decision: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ) {
    const verification = await prisma.driverVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new AppError('Không tìm thấy yêu cầu xác thực', 404);
    }

    if (verification.status !== VerificationStatus.PENDING) {
      throw new AppError('Yêu cầu này đã được xử lý trước đó', 400);
    }

    if (decision === 'REJECTED' && !rejectionReason) {
      throw new AppError('Vui lòng cung cấp lý do từ chối', 400);
    }

    // Atomic: cập nhật verification + user.isDriverVerified
    return prisma.$transaction(async (tx) => {
      const updated = await tx.driverVerification.update({
        where: { id: verificationId },
        data: {
          status: decision === 'APPROVED'
            ? VerificationStatus.APPROVED
            : VerificationStatus.REJECTED,
          rejectionReason: decision === 'REJECTED' ? rejectionReason : null,
          reviewedAt: new Date(),
        },
      });

      // Chỉ bật cờ isDriverVerified khi APPROVED
      if (decision === 'APPROVED') {
        await tx.user.update({
          where: { id: verification.userId },
          data: { isDriverVerified: true },
        });
      }

      return updated;
    });
  }
}
