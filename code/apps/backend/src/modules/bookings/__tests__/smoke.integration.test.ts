import { extendedPrisma as prisma } from '@repo/database';

test('connects only to coride_test', async () => {
  const result = await prisma.$queryRaw<
    Array<{
      database: string;
      current_user: string;
      port: number;
    }>
  >`
    SELECT
      current_database() AS database,
      current_user,
      inet_server_port() AS port
  `;

  expect(result[0].database).toBe('coride_test');
  expect(result[0].current_user).toBe('test_user');
  expect(result[0].port).toBe(5432);
});
