import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { getIO } from '../socket/socket.server';

// Hàm helper để parse string -> Role enum (nếu cần thiết) hoặc chỉ dùng để emit socket
const emitNotification = (userId: string, title: string, content: string) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('notification:new', { title, content });
  } catch (error) {
    console.error('Socket emit notification error:', error);
  }
};

export const createBooking = async (req: Request, res: Response) => {
  const passengerId = req.user!.id;
  const { rideId, seats } = req.body;

  if (!seats || seats < 1) {
    return res.status(400).json({ success: false, error: 'Số ghế không hợp lệ' });
  }

  // Transaction để đảm bảo tính toàn vẹn dữ liệu
  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Kiểm tra chuyến đi có tồn tại và đang ở trạng thái SCHEDULED
      const ride = await tx.ride.findUnique({
        where: { id: rideId },
        select: { id: true, status: true, availableSeats: true, driverId: true, pricePerSeat: true },
      });

      if (!ride) throw new Error('Chuyến đi không tồn tại');
      if (ride.driverId === passengerId) throw new Error('Bạn không thể đặt chuyến đi của chính mình');
      if (ride.status !== 'SCHEDULED' && ride.status !== 'FULL') throw new Error('Chuyến đi này không còn nhận đặt chỗ');
      
      // Mặc dù status là SCHEDULED, ta vẫn kiểm tra availableSeats > 0 (Yêu cầu 5)
      if (ride.availableSeats < seats) throw new Error(`Chỉ còn ${ride.availableSeats} chỗ trống`);

      // 2. Kiểm tra khách chưa có booking PENDING/CONFIRMED cho chuyến này
      const existingBooking = await tx.booking.findFirst({
        where: {
          rideId,
          passengerId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (existingBooking) throw new Error('Bạn đã đặt chuyến đi này rồi');

      // 3. Tính toán tổng tiền
      const totalPrice = ride.pricePerSeat * seats;

      // 4. Tạo Booking
      const newBooking = await tx.booking.create({
        data: {
          rideId,
          passengerId,
          seats,
          totalPrice,
          status: 'PENDING',
        },
      });

      // 5. Cập nhật availableSeats và trạng thái Ride
      const newAvailableSeats = ride.availableSeats - seats;
      let newRideStatus = ride.status;
      
      // (Yêu cầu 6) Khi availableSeats về 0 sau booking: cập nhật ride.status = RideStatus.FULL
      if (newAvailableSeats === 0) {
        newRideStatus = 'FULL' as any; // Ép kiểu nếu Prisma Client chưa update kịp
      }

      await tx.ride.update({
        where: { id: rideId },
        data: {
          availableSeats: newAvailableSeats,
          status: newRideStatus,
        },
      });

      // 6. Tạo Notification trong DB cho tài xế
      await tx.notification.create({
        data: {
          userId: ride.driverId,
          title: 'Có người đặt chuyến',
          content: `Có người vừa đặt ${seats} chỗ cho chuyến đi của bạn.`,
          type: 'BOOKING_REQUEST',
        }
      });

      return { booking: newBooking, driverId: ride.driverId };
    });

    // 7. Emit socket ngoài transaction
    emitNotification(result.driverId, 'Có người đặt chuyến', `Có người vừa đặt ${seats} chỗ cho chuyến đi của bạn.`);

    res.status(201).json({ success: true, data: result.booking });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const confirmBooking = async (req: Request, res: Response) => {
  const driverId = req.user!.id;
  const { id } = req.params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { ride: true },
    });

    if (!booking) throw new Error('Không tìm thấy đặt chỗ');
    if (booking.ride.driverId !== driverId) throw new Error('Bạn không có quyền xác nhận đặt chỗ này');
    if (booking.status !== 'PENDING') throw new Error('Trạng thái không hợp lệ để xác nhận');

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    await prisma.notification.create({
      data: {
        userId: booking.passengerId,
        title: 'Đặt chỗ được xác nhận',
        content: `Tài xế đã xác nhận đặt chỗ của bạn.`,
        type: 'BOOKING_STATUS',
      }
    });

    emitNotification(booking.passengerId, 'Đặt chỗ được xác nhận', `Tài xế đã xác nhận đặt chỗ của bạn.`);

    res.json({ success: true, data: updatedBooking });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { cancelReason } = req.body;

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { ride: true },
      });

      if (!booking) throw new Error('Không tìm thấy đặt chỗ');
      
      const isPassenger = booking.passengerId === userId;
      const isDriver = booking.ride.driverId === userId;

      if (!isPassenger && !isDriver) throw new Error('Bạn không có quyền huỷ đặt chỗ này');
      if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status)) {
        throw new Error('Không thể huỷ đặt chỗ ở trạng thái hiện tại');
      }

      // 1. Cập nhật trạng thái Booking thành CANCELLED
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { 
          status: 'CANCELLED',
          cancelReason: cancelReason || (isPassenger ? 'Hành khách huỷ' : 'Tài xế huỷ')
        },
      });

      // 2. Hoàn trả availableSeats
      // (Yêu cầu 7) Khi booking bị huỷ và availableSeats > 0 trở lại: cập nhật ride.status = SCHEDULED
      const newAvailableSeats = booking.ride.availableSeats + booking.seats;
      let newRideStatus = booking.ride.status;
      
      if (newAvailableSeats > 0 && booking.ride.status === ('FULL' as any)) {
        newRideStatus = 'SCHEDULED';
      }

      await tx.ride.update({
        where: { id: booking.rideId },
        data: {
          availableSeats: newAvailableSeats,
          status: newRideStatus,
        },
      });

      // 3. Notification
      const targetUserId = isPassenger ? booking.ride.driverId : booking.passengerId;
      await tx.notification.create({
        data: {
          userId: targetUserId,
          title: 'Đặt chỗ đã bị huỷ',
          content: `Đặt chỗ cho chuyến đi đã bị huỷ bởi ${isPassenger ? 'hành khách' : 'tài xế'}.`,
          type: 'BOOKING_STATUS',
        }
      });

      return { booking: updatedBooking, targetUserId, isPassenger };
    });

    emitNotification(result.targetUserId, 'Đặt chỗ đã bị huỷ', `Đặt chỗ cho chuyến đi đã bị huỷ bởi ${result.isPassenger ? 'hành khách' : 'tài xế'}.`);

    res.json({ success: true, data: result.booking });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getMyBookings = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page = 1, limit = 10, role = 'passenger' } = req.query; // role: passenger | driver
  const skip = (Number(page) - 1) * Number(limit);

  const whereClause = role === 'passenger' 
    ? { passengerId: userId }
    : { ride: { driverId: userId } };

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      ride: {
        select: { id: true, origin: true, destination: true, departureTime: true, status: true, driver: { select: { firstName: true, lastName: true, phone: true } } }
      },
      passenger: {
        select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: Number(limit),
  });

  const total = await prisma.booking.count({ where: whereClause });

  res.json({ success: true, data: { bookings, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
};

export const getBookingDetail = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      ride: {
        include: { driver: { select: { id: true, firstName: true, lastName: true, phone: true } } }
      },
      passenger: { select: { id: true, firstName: true, lastName: true, phone: true } }
    },
  });

  if (!booking) return res.status(404).json({ success: false, error: 'Không tìm thấy đặt chỗ' });

  // Access control
  if (booking.passengerId !== userId && booking.ride.driverId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập' });
  }

  res.json({ success: true, data: booking });
};
