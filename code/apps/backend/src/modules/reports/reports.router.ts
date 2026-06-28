import { Router } from 'express';
import * as reportsController from './reports.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();

// Lấy danh sách reports (Admin only)
router.get('/', authenticate, reportsController.getReports);

// Gửi report mới (User)
router.post('/', authenticate, reportsController.createReport);

// Xử lý report (Admin only)
router.patch('/:id/resolve', authenticate, reportsController.resolveReport);

export default router;
