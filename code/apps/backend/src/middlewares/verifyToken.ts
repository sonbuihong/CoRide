import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import prisma from '../lib/prisma';

// Mở rộng giao diện Request của Express để chứa thông tin user
declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
};

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      res.status(401).json({ success: false, error: 'Không tìm thấy token xác thực' });
      return;
    }

    const { payload } = await jose.jwtVerify(token, getSecret());
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isDriverVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Người dùng không tồn tại hoặc đã bị xóa' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    const joseErr = error as { code?: string };
    if (joseErr.code === 'ERR_JWT_EXPIRED') {
      res.status(401).json({ success: false, error: 'Token đã hết hạn' });
      return;
    }
    res.status(401).json({ success: false, error: 'Token không hợp lệ' });
    return;
  }
};
