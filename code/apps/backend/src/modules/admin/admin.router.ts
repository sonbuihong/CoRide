import { Router } from 'express';
import { authenticate, restrictTo } from '../../shared/middlewares/auth.middleware';
import * as adminController from './admin.controller';

const router = Router();

// Tất cả admin routes đều cần xác thực và role ADMIN
router.use(authenticate);
router.use(restrictTo('ADMIN'));

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Ride management
router.get('/rides', adminController.getAllRides);
router.get('/rides/:id', adminController.getRideById);
router.patch('/rides/:id', adminController.updateRide);
router.delete('/rides/:id', adminController.deleteRide);

// Booking management
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/:id', adminController.getBookingById);
router.patch('/bookings/:id', adminController.updateBooking);
router.delete('/bookings/:id', adminController.deleteBooking);

// Transaction management
router.get('/transactions', adminController.getAllTransactions);

// Driver Verification (KYC) management
router.get('/driver-verifications', adminController.getPendingVerifications);
router.patch('/driver-verifications/:id', adminController.reviewDriverVerification);

// Statistics
router.get('/stats', adminController.getSystemStats);

export default router;