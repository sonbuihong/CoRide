// Augment Express Request interface để req.user có type đầy đủ
// Dùng module augmentation (không phải global namespace) để tương thích với tsconfig strict
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
  }
}
