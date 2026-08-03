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
 * @route POST /api/payments/create
 * @desc Tạo đơn hàng thanh toán qua ZaloPay
 * @access Private
 */
router.post('/create', authenticate, PaymentsController.createPayment);

/**
 * @route POST /api/payments/callback
 * @desc Webhook nhận phản hồi từ ZaloPay
 * @access Public
 */
router.post('/callback', PaymentsController.handleCallback);

/**
 * @route GET /api/payments/simulator/qr/:tripId
 * @desc Lấy mã QR giả lập thanh toán
 * @access Private
 */
router.get('/simulator/qr/:tripId', authenticate, PaymentsController.getSimulatorQR);

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
