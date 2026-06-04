/**
 * Custom error class mang HTTP status code theo cùng.
 * Thay thế pattern fragile: throw new Error('NOT_FOUND') rồi check message string.
 *
 * Cách dùng:
 *   throw new AppError('Không tìm thấy chuyến đi', 404);
 *   throw new AppError('Bạn không có quyền', 403);
 */
export class AppError extends Error {
  public readonly statusCode: number;

  // isOperational = true  → lỗi có chủ ý (business logic): 400, 401, 403, 404...
  // isOperational = false → lỗi không mong đợi (bug/crash): cần log và không expose detail
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Giúp stack trace trỏ đúng nơi throw lỗi, không trỏ vào dòng constructor này
    Error.captureStackTrace(this, this.constructor);
  }
}
