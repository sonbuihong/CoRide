import { Router } from 'express';
import { authenticate } from './middlewares/auth.middleware';
import * as controller from './controller';

const router = Router();

router.use(authenticate as any);

router.get('/', controller.getNotifications as any);
router.patch('/read-all', controller.markAllAsRead as any);
router.patch('/:id/read', controller.markAsRead as any);

export default router;
