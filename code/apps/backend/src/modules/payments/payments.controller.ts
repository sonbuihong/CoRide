import { Request, Response, NextFunction } from 'express';
import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { WalletService } from './wallet.service';
import { TransactionType, TransactionStatus, PaymentStatus, PaymentMethod, TripStatus } from '@repo/database';
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
        isAllowed = booking.passengerId === userId || booking.ride.driverId === userId;
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
        if (booking.paymentStatus === PaymentStatus.PAID) throw new AppError('Đặt chỗ này đã được thanh toán', 400);
        amount = booking.totalPrice;
        isTrip = false;
      } else {
        throw new AppError('Không tìm thấy chuyến đi hoặc đặt chỗ', 404);
      }

      // 1. Lấy ví của hành khách
      const wallet = await WalletService.getOrCreateWallet(userId);

      // 2. Tạo Transaction PENDING
      const transaction = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          type: TransactionType.PAYMENT,
          status: TransactionStatus.PENDING,
          description: `Thanh toán mô phỏng #${id.slice(0, 8)}`,
          ...(isTrip ? { tripRequestId: id } : { bookingId: id }),
        }
      });

      // 3. Trả về cho client trước để hiển thị màn hình Processing
      res.status(200).json({
        success: true,
        message: 'Đang xử lý thanh toán...',
        data: { transactionId: transaction.id }
      });

      // 4. Bắt đầu Background job để mô phỏng delay ngân hàng (3 giây)
      setTimeout(async () => {
        try {
          await prisma.$transaction(async (tx) => {
            // Cập nhật Transaction
            await tx.transaction.update({
              where: { id: transaction.id },
              data: { status: TransactionStatus.SUCCESS },
            });

            if (isTrip && trip) {
              const updatedTrip = await tx.tripRequest.update({
                where: { id },
                data: {
                  paymentStatus: PaymentStatus.PAID,
                  paymentMethod: PaymentMethod.QR,
                  status: TripStatus.COMPLETED,
                  completedAt: new Date(),
                }
              });
              SocketEventService.emitToUser(updatedTrip.passengerId, SocketEvents.TRIP_UPDATED, updatedTrip);
              if (updatedTrip.driverId) SocketEventService.emitToUser(updatedTrip.driverId, SocketEvents.TRIP_UPDATED, updatedTrip);
            } else if (!isTrip && booking) {
              const updatedBooking = await tx.booking.update({
                where: { id },
                data: {
                  paymentStatus: PaymentStatus.PAID,
                  // Tự động set isDroppedOff nếu tài xế cấu hình
                  isDroppedOff: true,
                }
              });
              // Thông báo cho tài xế và hành khách
              // Không có BookingEvents spec nào ở đây, nên cứ emit chung hoặc bỏ qua
            }
          });
          console.log(`[Simulator] Thanh toán thành công cho #${id}`);
        } catch (err) {
          console.error(`[Simulator] Lỗi khi xử lý background payment cho #${id}`, err);
          await prisma.transaction.update({
             where: { id: transaction.id },
             data: { status: TransactionStatus.FAILED }
          }).catch(e => console.error(e));
        }
      }, 3000);

    } catch (error) {
      next(error);
    }
  }
}
