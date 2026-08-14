import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { ZodError } from 'zod';

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
  
  // Lỗi xác thực dữ liệu (Zod)
  if (err instanceof ZodError) {
    res.status(400).json({ 
      message: 'Dữ liệu không hợp lệ', 
      errors: err.errors 
    });
    return;
  }

  // Prisma unique constraint violation (ví dụ: email đã tồn tại)
  if (
    err instanceof Error &&
    err.constructor.name === 'PrismaClientKnownRequestError'
  ) {
    const prismaErr = err as { code?: string; message?: string; meta?: unknown };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({ message: 'Dữ liệu đã tồn tại trong hệ thống' });
      return;
    }

    // Lỗi truy vấn/kết nối Prisma phát sinh ở server, không phải request sai.
    // Giữ chi tiết trong log để chẩn đoán nhưng không làm lộ nội bộ qua API.
    console.error('[PRISMA ERROR]:', {
      code: prismaErr.code,
      message: prismaErr.message,
      meta: prismaErr.meta,
    });
    res.status(500).json({ message: 'Lỗi thao tác với cơ sở dữ liệu' });
    return;
  }

  // Lỗi không xác định — log để debug, không expose stack trace ra production
  console.error('[UNHANDLED ERROR]:', err);
  res.status(500).json({
    message: err instanceof Error ? err.message : 'Lỗi hệ thống nội bộ',
    stack: err instanceof Error ? err.stack : undefined,
  });
};
