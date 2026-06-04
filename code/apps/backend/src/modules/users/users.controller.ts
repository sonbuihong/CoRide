import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { AppError } from '../../shared/errors/AppError';

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // req.user được set bởi authenticate middleware (đã có id)
    const user = await UsersService.getUserById(req.user!.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await UsersService.getUserById((req.params.id as string));
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // req.body đã được validate bởi validate(updateProfileSchema) trong router
    const updatedUser = await UsersService.updateProfile(req.user!.id, req.body);
    res.json({ message: 'Cập nhật hồ sơ thành công', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Vui lòng chọn một tập tin để tải lên', 400);
    }
    // multer-storage-cloudinary cung cấp Cloudinary URL qua req.file.path
    const avatarUrl = (req.file as Express.Multer.File & { path: string }).path;
    const updatedUser = await UsersService.updateAvatar(req.user!.id, avatarUrl);
    res.json({ message: 'Tải ảnh đại diện thành công', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const uploadKycFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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
  } catch (error) {
    next(error);
  }
};
