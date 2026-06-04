import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';

/**
 * Global error handler — phải đặt CUỐI CÙNG trong Express middleware chain.
 * Nhận tất cả lỗi được forward bởi next(error) từ controllers.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // next là bắt buộc để Express nhận diện đây là error middleware (4 tham số)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Lỗi có chủ ý (AppError) — trả về message trực tiếp cho client
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // Prisma unique constraint violation (ví dụ: email đã tồn tại)
  if (
    err instanceof Error &&
    err.constructor.name === 'PrismaClientKnownRequestError'
  ) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({ message: 'Dữ liệu đã tồn tại trong hệ thống' });
      return;
    }
    res.status(400).json({ message: 'Lỗi thao tác với cơ sở dữ liệu' });
    return;
  }

  // Lỗi không xác định — log để debug, không expose stack trace ra production
  console.error('[UNHANDLED ERROR]:', err);
  res.status(500).json({
    message: 'Lỗi hệ thống nội bộ',
    ...(process.env.NODE_ENV === 'development' &&
      err instanceof Error && { stack: err.stack }),
  });
};
