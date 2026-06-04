import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { TransactionType, TransactionStatus } from '@repo/database';

export class WalletService {
  /**
   * Lấy ví của người dùng, nếu chưa có thì tạo mới.
   */
  static async getOrCreateWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, rideBalance: 0, driverEarnings: 0 },
      });
    }

    return wallet;
  }

  /**
   * Cập nhật số dư đi xe (passenger) và tạo bản ghi giao dịch (Atomic Transaction).
   * Dùng khi hành khách thanh toán cho chuyến đi.
   */
  static async updateRideBalance(
    walletId: string,
    amount: number,
    type: TransactionType,
    description?: string,
    externalId?: string,
    bookingId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) throw new AppError('Không tìm thấy ví', 404);

      const newBalance = wallet.rideBalance + amount;
      if (newBalance < 0) {
        throw new AppError('Số dư ví không đủ để thực hiện giao dịch', 400);
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: { rideBalance: newBalance },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId,
          amount,
          type,
          description,
          externalId,
          bookingId,
          status: TransactionStatus.SUCCESS,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  /**
   * Cập nhật thu nhập tài xế và tạo bản ghi giao dịch (Atomic Transaction).
   * Dùng khi tài xế nhận thanh toán từ hành khách hoặc rút tiền.
   */
  static async updateDriverEarnings(
    walletId: string,
    amount: number,
    type: TransactionType,
    description?: string,
    externalId?: string,
    bookingId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) throw new AppError('Không tìm thấy ví', 404);

      // Khi rút tiền (amount âm), kiểm tra đủ earnings
      const newEarnings = wallet.driverEarnings + amount;
      if (newEarnings < 0) {
        throw new AppError('Thu nhập tài xế không đủ để rút', 400);
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: { driverEarnings: newEarnings },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId,
          amount,
          type,
          description,
          externalId,
          bookingId,
          status: TransactionStatus.SUCCESS,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }
}
