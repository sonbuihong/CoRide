import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import * as jose from 'jose';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import redis from '../lib/redis';

const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '30d';
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 ngày tính bằng giây
const BCRYPT_SALT_ROUNDS = 10;

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-fallback-key');

// Helper sinh cặp Token
const generateTokenPair = async (userId: string) => {
  const secret = getSecret();
  const jti = crypto.randomUUID(); // Unique ID cho refresh token (để lưu vào Redis)

  const accessToken = await new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES)
    .sign(secret);

  const refreshToken = await new jose.SignJWT({ userId, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES)
    .sign(secret);

  return { accessToken, refreshToken, jti };
};

export const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ success: false, error: 'Email đã tồn tại trong hệ thống' });
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword, // Lưu vào cột password theo đúng database schema
      firstName,
      lastName,
      phone,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  // Không tạo token, yêu cầu verify email (logic verify sẽ phát triển sau)
  res.status(201).json({ success: true, data: { user } });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
  }

  const { accessToken, refreshToken, jti } = await generateTokenPair(user.id);

  // Lưu refreshToken vào Redis với cấu trúc: refresh:{userId}:{jti}
  const redisKey = `refresh:${user.id}:${jti}`;
  await redis.set(redisKey, refreshToken, 'EX', REFRESH_TOKEN_TTL_SECONDS);

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    },
  });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ success: false, error: 'Vui lòng cung cấp Refresh Token' });
  }

  const secret = getSecret();
  let payload: jose.JWTPayload;

  try {
    const result = await jose.jwtVerify(refreshToken, secret);
    payload = result.payload;
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }

  const userId = payload.userId as string;
  const jti = payload.jti as string;

  if (!userId || !jti) {
    return res.status(401).json({ success: false, error: 'Token format không hợp lệ' });
  }

  const redisKey = `refresh:${userId}:${jti}`;
  const storedToken = await redis.get(redisKey);

  // Kiểm tra token có tồn tại trong Redis không
  if (!storedToken || storedToken !== refreshToken) {
    // Nếu token bị lộ, ta có thể thu hồi toàn bộ token của user ở đây, 
    // tạm thời xử lý đơn giản: từ chối cấp mới.
    return res.status(401).json({ success: false, error: 'Refresh token đã bị thu hồi hoặc không hợp lệ' });
  }

  // Xoá token cũ
  await redis.del(redisKey);

  // Tạo cặp token mới
  const { accessToken: newAccessToken, refreshToken: newRefreshToken, jti: newJti } = await generateTokenPair(userId);
  
  // Lưu token mới vào Redis
  const newRedisKey = `refresh:${userId}:${newJti}`;
  await redis.set(newRedisKey, newRefreshToken, 'EX', REFRESH_TOKEN_TTL_SECONDS);

  res.json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    try {
      const { payload } = await jose.jwtVerify(refreshToken, getSecret());
      const userId = payload.userId as string;
      const jti = payload.jti as string;
      
      if (userId && jti) {
        // Xoá token khỏi Redis
        await redis.del(`refresh:${userId}:${jti}`);
      }
    } catch (error) {
      // Ignored: Token có thể đã hết hạn hoặc không hợp lệ, không cần xử lý khi logout
    }
  }

  res.json({ success: true, data: { message: 'Đăng xuất thành công' } });
};

export const getMe = async (req: Request, res: Response) => {
  // req.user đã được gán bởi verifyToken middleware, và đã loại bỏ password
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
};
