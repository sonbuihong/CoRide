import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { upload } from '../../config/cloudinary';
import { AppError } from '../../shared/errors/AppError';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

router.post(
  '/image',
  authenticate,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('Vui lòng chọn một tập tin để tải lên', 400);
    }

    // multer-storage-cloudinary lưu URL trong req.file.path
    const fileUrl = (req.file as Express.Multer.File & { path: string }).path;

    res.json({
      message: 'Tải ảnh lên thành công',
      url: fileUrl,
    });
  })
);

export default router;
