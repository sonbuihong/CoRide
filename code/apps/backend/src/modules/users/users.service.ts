import { extendedPrisma as prisma } from '@repo/database';
import { UpdateProfileInput } from '@repo/shared';
import { AppError } from '../../shared/errors/AppError';

// Select dùng chung — không bao giờ trả về password ra ngoài
const USER_SAFE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  bio: true,
  // Rating tách biệt theo vai trò: tài xế vs hành khách
  driverRating: true,
  driverRatingCount: true,
  passengerRating: true,
  passengerRatingCount: true,
  // KYC tài xế
  isDriverVerified: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class UsersService {
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_SAFE_SELECT,
    });

    if (!user) throw new AppError('Người dùng không tồn tại', 404);
    return user;
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        bio: data.bio ?? null,
      },
      select: USER_SAFE_SELECT,
    });
  }

  static async updateAvatar(userId: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: USER_SAFE_SELECT,
    });
  }
}
