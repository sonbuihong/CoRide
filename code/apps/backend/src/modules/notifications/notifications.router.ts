import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import * as notificationsController from './notifications.controller';

const router = Router();

// Tất cả notification routes đều cần xác thực
router.use(authenticate);

router.get('/', notificationsController.getNotifications);

// Đặt /subscribe và /read-all TRƯỚC /:id
router.get('/subscribe', notificationsController.subscribe);
router.patch('/read-all', notificationsController.markAllAsRead);
router.patch('/:id/read', notificationsController.markAsRead);

export default router;
