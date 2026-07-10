export const SOCKET_CONFIG = {
  CORS_ORIGIN: [
    process.env.FRONTEND_URL ?? 'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:8082'
  ],
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET ?? 'super-secret-fallback-key',
};
