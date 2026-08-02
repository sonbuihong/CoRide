import { Router } from 'express';
import { authenticate } from './middlewares/auth.middleware';
import * as controller from './controller';

const router = Router();

router.get('/', authenticate as any, controller.getNotifications as any);
router.patch('/read-all', authenticate as any, controller.markAllAsRead as any);
router.patch('/:id/read', authenticate as any, controller.markAsRead as any);

export default router;
