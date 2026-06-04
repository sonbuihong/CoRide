import { Router } from 'express';
import { ChatController } from './chat.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();

// Tất cả route chat đều cần đăng nhập
router.use(authenticate);

router.get('/history/:rideId/:otherUserId', ChatController.getHistory);
router.patch('/read/:rideId/:senderId', ChatController.markRead);

export { router as chatRouter };
