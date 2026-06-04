import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

// Cấu hình cookie cho refresh token — HttpOnly ngăn JS client đọc (chống XSS)
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
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
      res.status(401).json({ message: 'Không tìm thấy refresh token' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await AuthService.refreshTokens(refreshToken);

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ message: 'Làm mới token thành công', accessToken });
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
