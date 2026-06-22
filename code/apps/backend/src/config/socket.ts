export const SOCKET_CONFIG = {
  CORS_ORIGIN: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET ?? 'super-secret-fallback-key',
};
