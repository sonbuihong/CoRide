import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { listActivities } from './activities.controller';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);
router.get('/', listActivities);

export default router;
