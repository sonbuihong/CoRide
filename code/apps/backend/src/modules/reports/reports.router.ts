import { Router } from 'express';
import * as reportsController from './reports.controller';
import { authenticate, restrictTo } from '../../shared/middlewares/auth.middleware';

const router = Router();

// All report routes require authentication
router.use(authenticate);

// Lấy danh sách reports (Admin only)
router.get('/', restrictTo('ADMIN'), reportsController.getReports);

// Gửi report mới (User)
router.post('/', reportsController.createReport);

// Xử lý report (Admin only)
router.patch('/:id/resolve', restrictTo('ADMIN'), reportsController.resolveReport);

export default router;
