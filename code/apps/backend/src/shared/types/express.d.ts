import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      role: string;
      createdAt: Date;
      updatedAt: Date;
      };
    }
  }
}

export {};
