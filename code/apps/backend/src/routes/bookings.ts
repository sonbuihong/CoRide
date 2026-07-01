import { Router } from 'express';
import { createBooking, confirmBooking, cancelBooking, getMyBookings, getBookingDetail } from '../controllers/bookingController';
import { verifyToken } from '../middlewares/verifyToken';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

router.use(verifyToken); // Tất cả route booking đều yêu cầu đăng nhập

router.post('/', asyncHandler(createBooking));
router.patch('/:id/confirm', asyncHandler(confirmBooking));
router.patch('/:id/cancel', asyncHandler(cancelBooking));
router.get('/', asyncHandler(getMyBookings));
router.get('/:id', asyncHandler(getBookingDetail));

export default router;
