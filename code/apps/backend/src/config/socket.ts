export const SOCKET_CONFIG = {
  CORS_ORIGIN: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  get JWT_SECRET() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return secret;
  },
};
