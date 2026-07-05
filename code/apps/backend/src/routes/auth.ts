import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { register, login, refresh, logout, getMe } from '../controllers/authController';
import { verifyToken } from '../middlewares/verifyToken';
import { loginRateLimiter } from '../middlewares/rateLimiter';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// Zod schemas cho Request Body Validation
const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải chứa ít nhất 8 ký tự'),
  firstName: z.string().min(1, 'Họ không được để trống'),
  lastName: z.string().min(1, 'Tên không được để trống'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

// Middleware Validate Request
const validateRequest = (schema: z.AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => err.message).join(', ');
        res.status(400).json({ success: false, error: errors });
        return;
      }
      next(error);
    }
  };
};

// ─── Routes ─────────────────────────────────────────────────────────────

router.post('/register', validateRequest(registerSchema), asyncHandler(register));
router.post('/login', loginRateLimiter, validateRequest(loginSchema), asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', verifyToken, asyncHandler(getMe));

export default router;
