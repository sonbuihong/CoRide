import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.middleware';
import { registerSchema, loginSchema } from '@repo/shared';
import * as authController from './auth.controller';

const router = Router();

// validate() middleware xử lý Zod validation — controller không cần try/catch ZodError nữa
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
