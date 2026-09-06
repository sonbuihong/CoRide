import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { authenticate, restrictTo } from '../../shared/middlewares/auth.middleware';

const router = Router();

/**
 * @route GET /api/payments/wallet
 * @desc Lấy thông tin ví và giao dịch của người dùng
 * @access Private
 */
router.get('/wallet', authenticate, PaymentsController.getMyWallet);

/**
 * @route POST /api/payments/wallet/deposit
 * @desc Nạp tiền vào ví CoRide
 * @access Private
 */
router.post('/wallet/deposit', authenticate, PaymentsController.deposit);

/**
 * @route POST /api/payments/wallet/withdraw
 * @desc Rút tiền từ ví về tài khoản ngân hàng
 * @access Private
 */
router.post('/wallet/withdraw', authenticate, PaymentsController.withdraw);


/**
 * @route GET /api/payments/simulator/qr/:tripId
 * @desc Lấy mã QR giả lập thanh toán
 * @access Private
 */
router.get('/simulator/qr/:id', authenticate, PaymentsController.getSimulatorQR);

/**
 * @route POST /api/payments/simulator/confirm
 * @desc Xác nhận đã thanh toán giả lập
 * @access Private
 */
router.post('/simulator/confirm', authenticate, PaymentsController.confirmSimulatorPayment);

/**
 * @route GET /api/payments/admin/transactions
 * @desc Lấy danh sách giao dịch toàn hệ thống
 * @access Private (Admin only)
 */
router.get(
  '/admin/transactions',
  authenticate,
  restrictTo('ADMIN'),
  PaymentsController.getTransactions
);

export default router;
