import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { AppError } from '../../shared/errors/AppError';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // req.user được set bởi authenticate middleware (đã có id)
  const user = await UsersService.getUserById(req.user!.id);
  res.json(user);
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await UsersService.getUserById((req.params.id as string));
  res.json(user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // req.body đã được validate bởi validate(updateProfileSchema) trong router
  const updatedUser = await UsersService.updateProfile(req.user!.id, req.body);
  res.json({ message: 'Cập nhật hồ sơ thành công', user: updatedUser });
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw new AppError('Vui lòng chọn một tập tin để tải lên', 400);
  }
  // multer-storage-cloudinary cung cấp Cloudinary URL qua req.file.path
  const avatarUrl = (req.file as Express.Multer.File & { path: string }).path;
  const updatedUser = await UsersService.updateAvatar(req.user!.id, avatarUrl);
  res.json({ message: 'Tải ảnh đại diện thành công', user: updatedUser });
});

export const uploadKycFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw new AppError('Vui lòng chọn một tập tin để tải lên', 400);
  }
  const filename = req.file.filename;
  const fileUrl = `/uploads/${filename}`;
  res.json({
    status: 'success',
    message: 'Tải tập tin lên thành công',
    url: fileUrl,
  });
});
