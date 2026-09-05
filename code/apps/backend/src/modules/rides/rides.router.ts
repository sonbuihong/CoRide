import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { createRideScheduleSchema, createRideSchema, searchRideSchema, updateRideStatusSchema } from '@repo/shared';
import * as ridesController from './rides.controller';

const router = Router();
const cancelRideScheduleSchema = z.object({
  cancelReason: z.string().trim().min(1, 'Vui lòng cung cấp lý do hủy lịch chuyến').max(500),
});
const updateRoutePickupSharingSchema = z.object({ enabled: z.boolean() });

// Public routes — không cần đăng nhập để tìm và xem chuyến đi
router.get('/', validate(searchRideSchema, 'query'), ridesController.searchRides);
router.get('/mine', authenticate, ridesController.getMyRides);
router.get('/:id', ridesController.getRideById);

// Protected routes — cần đăng nhập
router.post('/', authenticate, validate(createRideSchema), ridesController.createRide);
router.post('/schedules', authenticate, validate(createRideScheduleSchema), ridesController.createRideSchedule);
router.patch('/schedules/:scheduleId/cancel', authenticate, validate(cancelRideScheduleSchema), ridesController.cancelRideSchedule);
router.patch('/:id/status', authenticate, validate(updateRideStatusSchema), ridesController.updateRideStatus);
router.patch('/:id/route-pickup-sharing', authenticate, validate(updateRoutePickupSharingSchema), ridesController.updateRoutePickupSharing);
router.patch('/:id', authenticate, validate(createRideSchema.partial()), ridesController.updateRide);
router.delete('/:id', authenticate, ridesController.deleteRide);


export default router;
