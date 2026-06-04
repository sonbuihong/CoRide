import { Request, Response, NextFunction } from 'express';
import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { ZaloPayService } from './zalopay.service';
import { WalletService } from './wallet.service';
import { TransactionType, TransactionStatus, PaymentStatus } from '@repo/database';

export class PaymentsController {
  /**
   * Tạo yêu cầu thanh toán cho một Booking qua ZaloPay
   */
  static async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Không xác định được người dùng', 401);
      }

      // 1. Kiểm tra Booking
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { ride: true },
      });

      if (!booking) {
        throw new AppError('Không tìm thấy đơn đặt chuyến', 404);
      }

      if (booking.passengerId !== userId) {
        throw new AppError('Bạn không có quyền thanh toán cho đơn đặt chuyến này', 403);
      }

      if (booking.paymentStatus === PaymentStatus.PAID) {
        throw new AppError('Đơn đặt chuyến này đã được thanh toán trước đó', 400);
      }

      // 2. Gọi ZaloPay API tạo đơn hàng
      const amount = booking.totalPrice;
      const description = `CoRide - Thanh toán đơn đặt chuyến #${booking.id.slice(0, 8)}`;
      
      const zalopayOrder = await ZaloPayService.createOrder(
        booking.id,
        amount,
        description,
        userId
      );

      if (zalopayOrder.return_code !== 1) {
        throw new AppError(`Lỗi ZaloPay: ${zalopayOrder.return_message}`, 500);
      }

      // 3. Tạo bản ghi giao dịch (Transaction) ở trạng thái PENDING
      const wallet = await WalletService.getOrCreateWallet(userId);
      await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: amount, // Số tiền dương vì đây là dòng tiền đi vào hệ thống/thanh toán
          type: TransactionType.PAYMENT,
          status: TransactionStatus.PENDING,
          description: `Thanh toán qua ZaloPay: ${description}`,
          externalId: zalopayOrder.app_trans_id,
          bookingId: booking.id,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Tạo đơn hàng thanh toán thành công',
        data: {
          order_url: zalopayOrder.order_url,
          app_trans_id: zalopayOrder.app_trans_id,
          order_token: zalopayOrder.order_token
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xử lý Callback từ ZaloPay (Webhook)
   * Phản hồi lại cho ZaloPay theo định dạng JSON yêu cầu.
   */
  static async handleCallback(req: Request, res: Response) {
    let result: { return_code: number; return_message: string } = {
      return_code: 0,
      return_message: '',
    };

    try {
      const { data: dataStr, mac } = req.body;

      // 1. Xác thực chữ ký MAC
      const isValid = ZaloPayService.verifyCallback(dataStr, mac);
      if (!isValid) {
        result.return_code = -1;
        result.return_message = 'mac invalid';
        return res.json(result);
      }

      // 2. Parse dữ liệu và tìm Transaction
      const dataJson = JSON.parse(dataStr);
      const app_trans_id = dataJson.app_trans_id;

      const transaction = await prisma.transaction.findUnique({
        where: { externalId: app_trans_id },
      });

      if (!transaction) {
        result.return_code = 1; // Vẫn trả về thành công để ZaloPay không gọi lại
        result.return_message = 'transaction not found';
        return res.json(result);
      }

      // 3. Nếu đã xử lý rồi (Idempotency)
      if (transaction.status === TransactionStatus.SUCCESS) {
        result.return_code = 1;
        result.return_message = 'already processed';
        return res.json(result);
      }

      // 4. Cập nhật trạng thái thành công cho Transaction và Booking
      await prisma.$transaction(async (tx) => {
        // Cập nhật Transaction
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.SUCCESS },
        });

        // Cập nhật Booking
        if (transaction.bookingId) {
          await tx.booking.update({
            where: { id: transaction.bookingId },
            data: { paymentStatus: PaymentStatus.PAID },
          });
        }
      });

      result.return_code = 1;
      result.return_message = 'success';
      res.json(result);
    } catch (error) {
      console.error('[ZaloPay Callback Error]:', error);
      result.return_code = 2;
      result.return_message = error instanceof Error ? error.message : 'internal error';
      res.json(result);
    }
  }

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
}
