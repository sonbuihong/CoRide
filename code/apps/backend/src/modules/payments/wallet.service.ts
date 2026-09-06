import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { TransactionType, TransactionStatus } from '@repo/database';

export class WalletService {
  /**
   * Lấy ví của người dùng, nếu chưa có thì tạo mới.
   */
  static async getOrCreateWallet(userId: string) {
    // Concurrent simulator confirmations may both reach this before claiming a booking.
    return prisma.wallet.upsert({
      where: { userId },
      create: { userId, rideBalance: 0, driverEarnings: 0 },
      update: {},
    });
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

  /**
   * Nạp tiền vào số dư đi xe (rideBalance) của người dùng.
   */
  static async depositToWallet(userId: string, amount: number, method: string = 'SIMULATOR') {
    if (!amount || amount < 10000) {
      throw new AppError('Số tiền nạp tối thiểu là 10.000đ', 400);
    }
    if (amount > 100000000) {
      throw new AppError('Số tiền nạp tối đa mỗi lần là 100.000.000đ', 400);
    }

    const wallet = await this.getOrCreateWallet(userId);
    const externalId = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const description = `Nạp tiền vào ví CoRide qua ${method === 'QR' ? 'VietQR' : method === 'ATM' ? 'Thẻ ATM/Ngân hàng' : 'Cổng thanh toán CoRide'}`;

    return this.updateRideBalance(
      wallet.id,
      amount,
      TransactionType.DEPOSIT,
      description,
      externalId
    );
  }

  /**
   * Rút tiền từ ví về tài khoản ngân hàng.
   * Hỗ trợ rút từ thu nhập tài xế (driverEarnings) hoặc số dư chuyến đi (rideBalance).
   */
  static async withdrawFromWallet(
    userId: string,
    data: {
      amount: number;
      source: 'driverEarnings' | 'rideBalance';
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }
  ) {
    const { amount, source, bankName, accountNumber, accountHolder } = data;

    if (!amount || amount < 50000) {
      throw new AppError('Số tiền rút tối thiểu là 50.000đ', 400);
    }
    if (!bankName || !bankName.trim()) {
      throw new AppError('Vui lòng chọn hoặc nhập tên ngân hàng nhận tiền', 400);
    }
    if (!accountNumber || !accountNumber.trim()) {
      throw new AppError('Vui lòng nhập số tài khoản ngân hàng nhận tiền', 400);
    }
    if (!accountHolder || !accountHolder.trim()) {
      throw new AppError('Vui lòng nhập tên chủ tài khoản ngân hàng', 400);
    }

    const wallet = await this.getOrCreateWallet(userId);
    const externalId = `WDR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const description = `Rút tiền về ${bankName.trim()} - ${accountNumber.trim()} (${accountHolder.trim().toUpperCase()})`;

    if (source === 'driverEarnings') {
      return this.updateDriverEarnings(
        wallet.id,
        -amount,
        TransactionType.WITHDRAWAL,
        description,
        externalId
      );
    } else {
      return this.updateRideBalance(
        wallet.id,
        -amount,
        TransactionType.WITHDRAWAL,
        description,
        externalId
      );
    }
  }
}
