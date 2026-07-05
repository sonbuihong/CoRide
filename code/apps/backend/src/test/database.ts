import { extendedPrisma as prisma } from '@repo/database';

export const cleanDatabase = async () => {
  const currentDb = await prisma.$queryRaw<{current_database: string}[]>`SELECT current_database()`;
  if (currentDb[0].current_database !== 'coride_test') {
    throw new Error('cleanDatabase aborted: not connected to coride_test database');
  }

  // Truncate all tables safely
  const tables = await prisma.$queryRaw<{tablename: string}[]>`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';`;
  for (const { tablename } of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`);
  }
};
