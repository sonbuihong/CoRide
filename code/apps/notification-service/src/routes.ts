import { Router } from 'express';
import { authenticate } from './middlewares/auth.middleware';
import * as controller from './controller';

const router = Router();

router.get('/', authenticate as any, controller.getNotifications as any);
router.patch('/read-all', authenticate as any, controller.markAllAsRead as any);
router.patch('/:id/read', authenticate as any, controller.markAsRead as any);
router.delete('/:id', authenticate as any, controller.deleteNotification as any);
router.patch('/:id/restore', authenticate as any, controller.restoreNotification as any);

export default router;
