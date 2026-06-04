import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../errors/AppError';

type RequestTarget = 'body' | 'query' | 'params';

/**
 * Middleware factory để validate dữ liệu đầu vào bằng Zod schema.
 * Thay thế việc lặp lại try/catch ZodError trong mọi controller.
 *
 * Cách dùng trong routes:
 *   router.post('/register', validate(registerSchema), authController.register)
 *   router.get('/', validate(searchRideSchema, 'query'), ridesController.search)
 */
export const validate = (schema: ZodSchema, target: RequestTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      // Trả về lỗi đầu tiên (message đã được định nghĩa trong schema bằng tiếng Việt)
      const firstError = result.error.errors[0];
      return next(
        new AppError(firstError?.message ?? 'Dữ liệu không hợp lệ', 400)
      );
    }

    // Ghi đè dữ liệu đã parse vào req
    // Lưu ý: Express 5 không cho phép gán lại req.query trực tiếp (getter-only)
    // Dùng Object.assign để mutate object thay vì thay thế reference
    if (target === 'body') {
      req.body = result.data;
    } else if (target === 'query') {
      // Xóa keys cũ rồi copy keys mới vào (tránh lỗi getter-only của Express 5)
      Object.keys(req.query).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (req.query as Record<string, unknown>)[key];
      });
      Object.assign(req.query, result.data);
    } else if (target === 'params') {
      Object.assign(req.params, result.data);
    }

    next();
  };
};
