import { Request, Response } from 'express';
import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { DriverVerificationService } from '../users/driver-verification.service';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await prisma.user.delete({
    where: { id: req.params.id as string },
  });

  res.json({ message: 'Xóa người dùng thành công' });
});

export const getAllRides = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

export const getRideById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

export const updateRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

export const deleteRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

export const getAllBookings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

export const getBookingById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id as string },
    include: {
      ride: true,
      passenger: true,
    },
  });

  if (!booking) throw new AppError('Đặt chỗ không tồn tại', 404);

  res.json({ booking });
});

export const updateBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

export const deleteBooking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

export const getAllTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

export const getSystemStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});

// ==============================
// Driver Verification (KYC) — Admin Endpoints
// ==============================

export const getPendingVerifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const verifications = await DriverVerificationService.getPendingVerifications();

  res.json({
    status: 'success',
    results: verifications.length,
    data: verifications,
  });
});

export const reviewDriverVerification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
});