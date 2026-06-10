import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { createBookingSchema, updateBookingStatusSchema } from '@repo/shared';
import * as bookingsController from './bookings.controller';

const router = Router();

// Tất cả booking routes đều cần xác thực
router.use(authenticate);

router.post('/', validate(createBookingSchema), bookingsController.createBooking);

// Đặt `/my` và `/driver` và `/active` TRƯỚC `/:id` để tránh bị match nhầm
router.get('/my', bookingsController.getMyBookings);
router.get('/driver', bookingsController.getDriverBookings);
router.get('/active', bookingsController.getActiveBooking);
router.get('/ride/:rideId', bookingsController.getRideBookings);
router.get('/:id', bookingsController.getBookingById);

router.patch('/:id/status', validate(updateBookingStatusSchema), bookingsController.updateBookingStatus);
router.patch('/:id/cancel', bookingsController.cancelBooking);

export default router;
