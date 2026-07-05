import { Router } from 'express';
import { createRide, searchRides, getRideDetail, updateRideStatus } from '../controllers/rideController';
import { verifyToken } from '../middlewares/verifyToken';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// Các route có thể thêm validation Middleware sau
router.post('/', verifyToken, asyncHandler(createRide));
router.get('/', asyncHandler(searchRides)); // Cho phép guest search
router.get('/:id', asyncHandler(getRideDetail));
router.patch('/:id/status', verifyToken, asyncHandler(updateRideStatus));

export default router;
