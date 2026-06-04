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

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          driverRating: true,
          driverRatingCount: true,
          passengerRating: true,
          passengerRatingCount: true,
          isDriverVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
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
    const { firstName, lastName, phone, role, bio } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: {
        firstName,
        lastName,
        phone,
        role,
        bio,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
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
    await prisma.user.delete({
      where: { id: req.params.id as string },
    });

    res.json({ message: 'Xóa người dùng thành công' });
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
    await prisma.ride.delete({
      where: { id: req.params.id as string },
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
    await prisma.booking.delete({
      where: { id: req.params.id as string },
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