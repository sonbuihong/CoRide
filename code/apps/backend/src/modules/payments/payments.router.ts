import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { authenticate, restrictTo } from '../../shared/middlewares/auth.middleware';

const router = Router();

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
