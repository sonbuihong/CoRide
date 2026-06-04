import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { updateProfileSchema } from '@repo/shared';
import { upload, uploadKycImage } from '../../config/cloudinary';
import * as usersController from './users.controller';
import { DriverVerificationController } from './driver-verification.controller';

const router = Router();

// Routes protected — phải đặt TRƯỚC /:id để /me không bị match thành /:id = 'me'
// Express so sánh route theo thứ tự từ trên xuống, nếu /me đặt sau /:id thì sẽ không bao giờ được gọi
router.get('/me', authenticate, usersController.getMe);
router.patch('/me', authenticate, validate(updateProfileSchema), usersController.updateProfile);
router.post('/me/avatar', authenticate, upload.single('avatar'), usersController.uploadAvatar);
router.post('/upload-kyc', authenticate, uploadKycImage.single('file'), usersController.uploadKycFile);

// Driver Verification (KYC tài xế) — đặt trước /:id
router.post('/driver-verification', authenticate, DriverVerificationController.submit);
router.get('/driver-verification', authenticate, DriverVerificationController.getStatus);

// Route public — xem profile người dùng khác (ví dụ: xem profile tài xế)
// PHẢI đặt SAU /me và /driver-verification để tránh bị Express match như user ID
router.get('/:id', usersController.getUserById);

export default router;
