import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Bọc một async route handler và tự động forward mọi lỗi tới next(),
 * để errorHandler middleware xử lý tập trung.
 *
 * Thay thế pattern lặp lại ở mọi controller:
 *   try { ... } catch (error) { next(error); }
 *
 * Cách dùng:
 *   export const getUser = asyncHandler(async (req, res) => { ... });
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncRequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
