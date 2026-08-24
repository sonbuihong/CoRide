import { Router } from 'express';
import { TripsController } from './trips.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();

// Tất cả routes cần xác thực
router.use(authenticate);

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Tạo yêu cầu đặt xe (Ride-Hailing)
 *     tags: [Trips]
 */
router.post('/', TripsController.createTrip);

/**
 * @swagger
 * /api/trips/active:
 *   get:
 *     summary: Lấy trip đang active của hành khách
 *     tags: [Trips]
 */
router.get('/active', TripsController.getActiveTrip);

/**
 * @swagger
 * /api/trips/active-driver:
 *   get:
 *     summary: Lấy trip đang active của tài xế
 *     tags: [Trips]
 */
router.get('/active-driver', TripsController.getActiveDriverTrip);

/**
 * @swagger
 * /api/trips/history:
 *   get:
 *     summary: Lấy lịch sử chuyến đi (phân trang)
 *     tags: [Trips]
 */
router.get('/history', TripsController.getTripHistory);

router.post('/:id/accept', TripsController.acceptTrip);
router.post('/:id/reject', TripsController.rejectTrip);

/**
 * @swagger
 * /api/trips/:id/cancel:
 *   patch:
 *     summary: Hủy yêu cầu đặt xe
 *     tags: [Trips]
 */
router.patch('/:id/cancel', TripsController.cancelTrip);

/**
 * @swagger
 * /api/trips/:id/status:
 *   patch:
 *     summary: Tài xế cập nhật trạng thái chuyến đi
 *     tags: [Trips]
 */
router.patch('/:id/status', TripsController.updateTripStatus);

export default router;
