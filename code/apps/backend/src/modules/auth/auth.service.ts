import bcrypt from 'bcrypt';
import * as jose from 'jose';
import { extendedPrisma as prisma } from '@repo/database';
import { RegisterInput, LoginInput } from '@repo/shared';
import { AppError } from '../../shared/errors/AppError';

const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';
const BCRYPT_SALT_ROUNDS = 10;

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'super-secret-fallback-key'
  );

export class AuthService {
  static async registerUser(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email đã tồn tại trong hệ thống', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async loginUser(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Dùng cùng message để tránh user enumeration attack
    // (không để lộ email nào đã tồn tại trong hệ thống)
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    const tokens = await this.generateTokenPair(user.id);
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  static async generateTokenPair(userId: string) {
    const secret = getSecret();

    // Tạo 2 token song song để tối ưu thời gian
    const [accessToken, refreshToken] = await Promise.all([
      new jose.SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRES)
        .sign(secret),
      new jose.SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRES)
        .sign(secret),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  static async refreshTokens(token: string) {
    const secret = getSecret();
    let userId: string;

    try {
      const { payload } = await jose.jwtVerify(token, secret);
      userId = payload.userId as string;
    } catch {
      throw new AppError('Refresh token không hợp lệ', 401);
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (
      !storedToken ||
      storedToken.revoked ||
      storedToken.expiresAt < new Date()
    ) {
      throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
    }

    // Token rotation: thu hồi token cũ, cấp cặp token mới
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    return this.generateTokenPair(userId);
  }

  static async logout(token: string) {
    // Gracefully fail nếu token không tìm thấy (ví dụ: đã logout rồi)
    await prisma.refreshToken
      .update({ where: { token }, data: { revoked: true } })
      .catch(() => null);
  }
}
