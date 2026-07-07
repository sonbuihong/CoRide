import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://test_user:test_password@localhost:5433/coride_test' } }
});
(async () => {
  const currentDb = await prisma.$queryRaw`SELECT current_database(), current_user, inet_server_port() as port;`;
  console.log(currentDb);
  const indexes = await prisma.$queryRaw`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Booking';`;
  console.log(indexes);
  await prisma.$disconnect();
})();
