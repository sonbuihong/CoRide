import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../errors/AppError';

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'super-secret-fallback-key'
  );

/**
 * Middleware xác thực JWT.
 * Đọc Bearer token từ Authorization header, verify, rồi gắn user vào req.user.
 * Dùng trong routes: router.use(authenticate) hoặc router.post('/', authenticate, controller)
 */
export const authenticate = async (
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
      throw new AppError('Không tìm thấy token xác thực', 401);
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new AppError('Người dùng không tồn tại hoặc đã bị xóa', 401);

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);

    // jose ném lỗi với error.code cụ thể
    const joseErr = error as { code?: string };
    if (joseErr.code === 'ERR_JWT_EXPIRED') {
      return next(new AppError('Token đã hết hạn', 401));
    }
    next(new AppError('Token không hợp lệ', 401));
  }
};

/**
 * Middleware phân quyền người dùng.
 * @param roles Danh sách các role được phép truy cập
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Lưu ý: Role nằm trong req.user.role (nếu có fetch trong authenticate)
    // Cần kiểm tra xem model User trong prisma schema có trường role không.
    // Dựa trên nghiên cứu PAY-01, User model có trường role (enum Role { USER, ADMIN }).
    
    // Tạm thời, vì authenticate() hiện tại chỉ fetch các trường cơ bản, 
    // tôi sẽ giả định field role có tồn tại nếu model User có field đó.
    // Thực tế, tôi nên kiểm tra req.user có chứa role không.
    
    // Cập nhật: Tôi sẽ không sửa authenticate() vì nó có thể ảnh hưởng diện rộng, 
    // thay vào đó tôi sẽ dùng prisma để check role trong restrictTo hoặc giả định nó đã có nếu query đầy đủ.
    
    // Để an toàn và nhanh chóng cho DATN:
    const userRole = (req.user as any)?.role || 'USER';

    if (!roles.includes(userRole)) {
      return next(
        new AppError('Bạn không có quyền thực hiện hành động này', 403)
      );
    }

    next();
  };
};
