import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper bắt lỗi async/await, tự động chuyển lỗi cho middleware xử lý lỗi (next)
 * mà không cần phải dùng try/catch lặp lại trong mỗi controller.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
