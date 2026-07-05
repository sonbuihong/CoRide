process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';

const testUrl = process.env.DATABASE_URL_TEST
  ?? 'postgresql://test_user:test_password@localhost:5433/coride_test';

const parsed = new URL(testUrl);

if (
  parsed.hostname !== 'localhost' ||
  parsed.port !== '5433' ||
  parsed.pathname !== '/coride_test'
) {
  throw new Error(`Unsafe test database: ${parsed.hostname}:${parsed.port}${parsed.pathname}`);
}

process.env.DATABASE_URL_TEST = testUrl;
process.env.DATABASE_URL = testUrl;

// Xóa singleton Prisma để các file test trong cùng session sẽ tạo lại instance
// với DATABASE_URL đã được gán đúng ở trên.
(globalThis as any).prisma = undefined;

console.log(
  `[TEST DATABASE] ${parsed.hostname}:${parsed.port}${parsed.pathname}`
);
