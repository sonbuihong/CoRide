import { Request, Response, NextFunction } from 'express';
import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { WalletService } from './wallet.service';
import { BookingStatus, TransactionType, TransactionStatus, PaymentStatus, PaymentMethod, TripStatus } from '@repo/database';
import { clearDriverBusy } from '../../shared/lib/redis';
import { emitTripUpdated } from '../trips/trip-realtime.service';
import { SocketEventService } from '../../socket/socket.events';
import { SocketEvents } from '@repo/shared';

export class PaymentsController {
  /**
   * Lấy danh sách toàn bộ giao dịch (Chỉ dành cho Admin)
   */
  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await prisma.transaction.findMany({
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          booking: {
            include: {
              ride: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        status: 'success',
        results: transactions.length,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thông tin ví của người dùng hiện tại (bao gồm số dư và lịch sử giao dịch)
   */
  static async getMyWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Không xác định được người dùng', 401);
      }

      // Lấy hoặc tạo ví
      const wallet = await WalletService.getOrCreateWallet(userId);

      // Lấy 20 giao dịch gần nhất
      const transactions = await prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      res.status(200).json({
        status: 'success',
        data: {
          wallet,
          transactions,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Sinh mã QR thanh toán mô phỏng (Payment Simulator)
   * Sử dụng VietQR để tạo mã thanh toán tĩnh/động.
   */
  static async getSimulatorQR(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;

      let amount = 0;
      let description = '';
      let isAllowed = false;

      const trip = await prisma.tripRequest.findUnique({ where: { id } });
      if (trip) {
        isAllowed = trip.passengerId === userId;
        if (trip.status !== TripStatus.WAITING_PAYMENT) {
          throw new AppError('Chuyến đi chưa sẵn sàng để thanh toán', 400);
        }
        amount = trip.finalPrice ?? trip.estimatedPrice;
        description = `Thanh toan chuyen di ${trip.id.substring(0, 8)}`;
      } else {
        const booking = await prisma.booking.findUnique({ where: { id }, include: { ride: true } });
        if (!booking) {
          throw new AppError('Không tìm thấy chuyến đi hoặc đặt chỗ', 404);
        }
        if (booking.status !== BookingStatus.COMPLETED) {
          throw new AppError('Chỉ có thể thanh toán sau khi đã hoàn thành điểm trả khách', 400);
        }
        if (booking.paymentStatus !== PaymentStatus.UNPAID) {
          throw new AppError('Thanh toán đã được xử lý hoặc đã hoàn tiền', 409, true, 'PAYMENT_ALREADY_PROCESSED');
        }
        isAllowed = booking.passengerId === userId;
        amount = booking.totalPrice;
        description = `Thanh toan dat cho ${booking.id.substring(0, 8)}`;
      }

      if (!isAllowed) {
        throw new AppError('Bạn không có quyền truy cập thanh toán của giao dịch này', 403);
      }

      // URL cấu hình VietQR (có thể đưa bankId và accountName vào env)
      const bankId = process.env.PAYMENT_BANK_ID || 'mb';
      const accountNo = process.env.PAYMENT_ACCOUNT_NO || '0987654321';
      const accountName = process.env.PAYMENT_ACCOUNT_NAME || 'CORIDE SYSTEM';
      
      const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;

      res.status(200).json({
        success: true,
        data: {
          qrUrl,
          amount,
          description,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xác nhận thanh toán (Mô phỏng người dùng bấm nút "Tôi đã thanh toán")
   */
  static async confirmSimulatorPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Không xác định được người dùng', 401);
      }

      let amount = 0;
      let isTrip = false;
      const trip = await prisma.tripRequest.findUnique({ where: { id } });
      const booking = await prisma.booking.findUnique({ where: { id }, include: { ride: true } });

      if (trip) {
        if (trip.passengerId !== userId) throw new AppError('Chỉ hành khách mới có thể xác nhận thanh toán', 403);
        if (trip.status !== TripStatus.WAITING_PAYMENT) throw new AppError('Chuyến đi chưa sẵn sàng để thanh toán', 400);
        if (trip.paymentStatus === PaymentStatus.PAID) throw new AppError('Chuyến đi này đã được thanh toán', 400);
        amount = trip.finalPrice ?? trip.estimatedPrice;
        isTrip = true;
      } else if (booking) {
        if (booking.passengerId !== userId) throw new AppError('Chỉ hành khách mới có thể xác nhận thanh toán', 403);
        if (booking.status !== BookingStatus.COMPLETED) throw new AppError('Chỉ có thể thanh toán sau khi đã hoàn thành điểm trả khách', 400);
        if (booking.paymentStatus !== PaymentStatus.UNPAID) throw new AppError('Thanh toán đã được xử lý hoặc đã hoàn tiền', 409, true, 'PAYMENT_ALREADY_PROCESSED');
        amount = booking.totalPrice;
        isTrip = false;
      } else {
        throw new AppError('Không tìm thấy chuyến đi hoặc đặt chỗ', 404);
      }

      // Ride-Hailing payment is completed synchronously and idempotently. The
      // conditional update serializes concurrent confirmations; realtime is
      // emitted only after the database transaction commits.
      if (isTrip && trip) {
        const wallet = await WalletService.getOrCreateWallet(userId);
        const result = await prisma.$transaction(async (tx) => {
          const claimed = await tx.tripRequest.updateMany({
            where: {
              id,
              passengerId: userId,
              status: TripStatus.WAITING_PAYMENT,
              paymentStatus: PaymentStatus.UNPAID,
            },
            data: {
              paymentStatus: PaymentStatus.PAID,
              paymentMethod: PaymentMethod.QR,
              status: TripStatus.COMPLETED,
              completedAt: new Date(),
            },
          });
          if (claimed.count !== 1) {
            throw new AppError(
              'Thanh toán đã được xử lý hoặc trạng thái chuyến đã thay đổi',
              409,
              true,
              'PAYMENT_ALREADY_PROCESSED',
            );
          }

          const transaction = await tx.transaction.create({
            data: {
              walletId: wallet.id,
              amount,
              type: TransactionType.PAYMENT,
              status: TransactionStatus.SUCCESS,
              description: `Thanh toán mô phỏng #${id.slice(0, 8)}`,
              tripRequestId: id,
            },
          });
          const updatedTrip = await tx.tripRequest.findUnique({ where: { id } });
          if (!updatedTrip) throw new AppError('Không tìm thấy chuyến đi', 404);
          return { transaction, updatedTrip };
        });

        emitTripUpdated(result.updatedTrip, {
          previousStatus: TripStatus.WAITING_PAYMENT,
          message: 'Thanh toán thành công. Chuyến đi đã hoàn tất.',
        });
        if (result.updatedTrip.driverId) {
          await clearDriverBusy(result.updatedTrip.driverId);
        }

        res.status(200).json({
          success: true,
          message: 'Thanh toán thành công',
          data: {
            transactionId: result.transaction.id,
            trip: result.updatedTrip,
          },
        });
        return;
      }

      if (!booking) throw new AppError('Không tìm thấy đặt chỗ', 404);

      // A conditional update makes repeated taps or duplicate requests safe:
      // exactly one payment can claim the completed booking.
      const wallet = await WalletService.getOrCreateWallet(userId);
      const result = await prisma.$transaction(async (tx) => {
        const claimed = await tx.booking.updateMany({
          where: {
            id,
            passengerId: userId,
            status: BookingStatus.COMPLETED,
            paymentStatus: PaymentStatus.UNPAID,
          },
          data: { paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.QR },
        });
        if (claimed.count !== 1) {
          throw new AppError('Thanh toán đã được xử lý hoặc trạng thái đặt chỗ đã thay đổi', 409, true, 'PAYMENT_ALREADY_PROCESSED');
        }
        const transaction = await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount,
            type: TransactionType.PAYMENT,
            status: TransactionStatus.SUCCESS,
            description: `Thanh toán mô phỏng #${id.slice(0, 8)}`,
            bookingId: id,
          },
        });
        return { transaction };
      });

      SocketEventService.emitToRooms(
        [`user:${booking.passengerId}`, `user:${booking.ride.driverId}`, `ride:${booking.rideId}`],
        SocketEvents.PAYMENT_STATUS_CHANGED,
        { bookingId: id, rideId: booking.rideId, paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.QR },
      );

      res.status(200).json({
        success: true,
        message: 'Thanh toán thành công',
        data: { transactionId: result.transaction.id },
      });

    } catch (error) {
      next(error);
    }
  }
}
