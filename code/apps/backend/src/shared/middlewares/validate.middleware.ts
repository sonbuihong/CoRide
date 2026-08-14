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

    // Ghi đè body/params sau khi parse. Riêng Express 5 cung cấp req.query
    // qua getter nên lưu kết quả đã coerce vào res.locals cho controller dùng.
    if (target === 'body') {
      req.body = result.data;
    } else if (target === 'query') {
      res.locals.validatedQuery = result.data;
    } else if (target === 'params') {
      Object.assign(req.params, result.data);
    }

    next();
  };
};
