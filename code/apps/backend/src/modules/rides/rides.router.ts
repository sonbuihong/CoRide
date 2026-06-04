import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { createRideSchema, searchRideSchema, updateRideStatusSchema } from '@repo/shared';
import * as ridesController from './rides.controller';

const router = Router();

// Public routes — không cần đăng nhập để tìm và xem chuyến đi
router.get('/', validate(searchRideSchema, 'query'), ridesController.searchRides);
router.get('/:id', ridesController.getRideById);

// Protected routes — cần đăng nhập
router.post('/', authenticate, validate(createRideSchema), ridesController.createRide);
router.patch('/:id/status', authenticate, validate(updateRideStatusSchema), ridesController.updateRideStatus);
router.patch('/:id', authenticate, validate(createRideSchema.partial()), ridesController.updateRide);
router.delete('/:id', authenticate, ridesController.deleteRide);


export default router;
