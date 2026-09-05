import { Request, Response, NextFunction } from 'express';
import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { DriverVerificationService } from '../users/driver-verification.service';

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string)?.trim();

    const where: Record<string, any> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          deletedAt: true,
          driverRating: true,
          driverRatingCount: true,
          passengerRating: true,
          passengerRatingCount: true,
          isDriverVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        role: true,
        status: true,
        deletedAt: true,
        driverRating: true,
        driverRatingCount: true,
        passengerRating: true,
        passengerRatingCount: true,
        isDriverVerified: true,
        createdAt: true,
        updatedAt: true,
        ridesAsDriver: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true,
            status: true,
          },
        },
        bookings: {
          select: {
            id: true,
            seats: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, phone, role, bio, status } = req.body;

    const dataToUpdate: Record<string, any> = {};
    if (firstName !== undefined) dataToUpdate.firstName = firstName;
    if (lastName !== undefined) dataToUpdate.lastName = lastName;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (role !== undefined) dataToUpdate.role = role;
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === 'DELETED') {
        dataToUpdate.deletedAt = new Date();
      } else if (status === 'ACTIVE') {
        dataToUpdate.deletedAt = null;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        deletedAt: true,
        bio: true,
      },
    });

    res.json({ message: 'Cập nhật người dùng thành công', user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id as string;

    // Không cho phép Admin tự xóa chính mình
    if ((req.user as any)?.id === userId) {
      throw new AppError('Bạn không thể tự xóa tài khoản của chính mình', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            ridesAsDriver: true,
            bookings: true,
            tripsAsPassenger: true,
            tripsAsDriver: true,
            reviewsSent: true,
            reviewsReceived: true,
            reportsSent: true,
            reportsReceived: true,
            sentMessages: true,
            receivedMessages: true,
          },
        },
      },
    });

    if (!targetUser) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    const totalRelations =
      targetUser._count.ridesAsDriver +
      targetUser._count.bookings +
      targetUser._count.tripsAsPassenger +
      targetUser._count.tripsAsDriver +
      targetUser._count.reviewsSent +
      targetUser._count.reviewsReceived +
      targetUser._count.reportsSent +
      targetUser._count.reportsReceived +
      targetUser._count.sentMessages +
      targetUser._count.receivedMessages;

    // 1. Thu hồi toàn bộ Refresh Token của người dùng này để buộc đăng xuất
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    // 2. Hủy các chuyến đi đang lên lịch (SCHEDULED) của tài xế này nếu có
    await prisma.ride.updateMany({
      where: {
        driverId: userId,
        status: 'SCHEDULED',
      },
      data: {
        status: 'CANCELLED',
        cancelReason: 'Tài khoản tài xế đã bị vô hiệu hóa bởi Quản trị viên',
      },
    });

    // 3. Hủy các booking PENDING hoặc CONFIRMED của hành khách này nếu có
    await prisma.booking.updateMany({
      where: {
        passengerId: userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      data: {
        status: 'CANCELLED',
        cancelReason: 'Tài khoản hành khách đã bị vô hiệu hóa bởi Quản trị viên',
      },
    });

    // 4. Nếu có yêu cầu hard delete và người dùng hoàn toàn chưa có liên kết dữ liệu
    if (req.query.hard === 'true') {
      if (totalRelations > 0) {
        throw new AppError(
          'Không thể xóa vĩnh viễn do người dùng đã có dữ liệu liên kết (chuyến đi, vé đặt, đánh giá hoặc giao dịch). Đã tự động chuyển sang vô hiệu hóa tài khoản.',
          400
        );
      }

      await prisma.user.delete({
        where: { id: userId },
      });

      res.json({ message: 'Đã xóa vĩnh viễn người dùng khỏi cơ sở dữ liệu' });
      return;
    }

    // 5. Mặc định: Xóa mềm an toàn (Soft Delete)
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    res.json({
      message: 'Đã vô hiệu hóa tài khoản người dùng thành công (dữ liệu lịch sử chuyến đi và tài chính được bảo toàn)',
    });
  } catch (error) {
    next(error);
  }
};

export const restoreUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    res.json({
      message: 'Khôi phục tài khoản người dùng thành công',
      user: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRides = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        skip,
        take: limit,
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          bookings: {
            select: {
              id: true,
              seats: true,
              status: true,
              passenger: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ride.count(),
    ]);

    res.json({
      rides,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
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
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id as string },
      include: {
        driver: true,
        bookings: {
          include: {
            passenger: true,
          },
        },
      },
    });

    if (!ride) throw new AppError('Chuyến đi không tồn tại', 404);

    res.json({ ride });
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
    const { status } = req.body;

    const ride = await prisma.ride.update({
      where: { id: req.params.id as string },
      data: { status },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

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
    const id = req.params.id as string;

    await prisma.$transaction(async (tx) => {
      // 1. Xóa các đánh giá liên quan
      await tx.review.deleteMany({ where: { rideId: id } });

      // 2. Xóa các tin nhắn liên quan
      await tx.message.deleteMany({ where: { rideId: id } });

      // 3. Xử lý các booking
      const bookings = await tx.booking.findMany({ where: { rideId: id } });
      const bookingIds = bookings.map((b) => b.id);

      if (bookingIds.length > 0) {
        // Ngắt liên kết transaction với booking (set null) thay vì xóa lịch sử giao dịch
        await tx.transaction.updateMany({
          where: { bookingId: { in: bookingIds } },
          data: { bookingId: null },
        });

        // Xóa các booking
        await tx.booking.deleteMany({ where: { rideId: id } });
      }

      // 4. Xóa chuyến đi
      await tx.ride.delete({
        where: { id },
      });
    });

    res.json({ message: 'Xóa chuyến đi thành công' });
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        skip,
        take: limit,
        include: {
          ride: {
            select: {
              id: true,
              origin: true,
              destination: true,
              departureTime: true,
            },
          },
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count(),
    ]);

    res.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
      include: {
        ride: true,
        passenger: true,
      },
    });

    if (!booking) throw new AppError('Đặt chỗ không tồn tại', 404);

    res.json({ booking });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;

    const booking = await prisma.booking.update({
      where: { id: req.params.id as string },
      data: { status },
      include: {
        ride: {
          select: {
            id: true,
            origin: true,
            destination: true,
          },
        },
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ message: 'Cập nhật đặt chỗ thành công', booking });
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    await prisma.$transaction(async (tx) => {
      // Ngắt liên kết transaction trước
      await tx.transaction.updateMany({
        where: { bookingId: id },
        data: { bookingId: null },
      });

      // Xóa booking
      await tx.booking.delete({
        where: { id },
      });
    });

    res.json({ message: 'Xóa đặt chỗ thành công' });
  } catch (error) {
    next(error);
  }
};

export const getAllTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take: limit,
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count(),
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalRides,
      totalBookings,
      totalTransactions,
      recentUsers,
      recentRides,
      recentBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.ride.count(),
      prisma.booking.count(),
      prisma.transaction.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          },
        },
      }),
      prisma.ride.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalRides,
        totalBookings,
        totalTransactions,
        recentUsers,
        recentRides,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// Driver Verification (KYC) — Admin Endpoints
// ==============================

export const getPendingVerifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const verifications = await DriverVerificationService.getPendingVerifications();

    res.json({
      status: 'success',
      results: verifications.length,
      data: verifications,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewDriverVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { decision, rejectionReason } = req.body;

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      throw new AppError('Decision phải là APPROVED hoặc REJECTED', 400);
    }

    const verification = await DriverVerificationService.reviewVerification(
      id,
      decision,
      rejectionReason
    );

    res.json({
      status: 'success',
      message: decision === 'APPROVED'
        ? 'Đã duyệt xác thực tài xế thành công'
        : 'Đã từ chối yêu cầu xác thực',
      data: verification,
    });
  } catch (error) {
    next(error);
  }
};