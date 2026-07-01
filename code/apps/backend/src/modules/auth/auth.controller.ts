import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày (ms)
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // req.body đã được validate bởi validate(registerSchema) trong router
    const user = await AuthService.registerUser(req.body);
    res.status(201).json({ message: 'Đăng ký tài khoản thành công', user });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user, accessToken, refreshToken } = await AuthService.loginUser(req.body);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ message: 'Đăng nhập thành công', user, accessToken });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    if (!refreshToken) {
      res.clearCookie('refreshToken');
      res.status(401).json({ message: 'Không tìm thấy refresh token' });
      return;
    }

    try {
      const { accessToken, refreshToken: newRefreshToken } =
        await AuthService.refreshTokens(refreshToken);

      res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({ message: 'Làm mới token thành công', accessToken });
    } catch (refreshError) {
      // Tự động clear cookie lỗi để dev/user không bị kẹt
      res.clearCookie('refreshToken');
      throw refreshError;
    }
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Vui lòng cung cấp email' });
      return;
    }
    const result = await AuthService.forgotPassword(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400).json({ message: 'Vui lòng cung cấp đủ thông tin email, otp và mật khẩu mới' });
      return;
    }
    const result = await AuthService.resetPassword(email, otp, newPassword);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

