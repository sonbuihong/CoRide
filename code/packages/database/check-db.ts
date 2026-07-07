import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const duplicates = await prisma.$queryRaw`
      SELECT
          "rideId",
          "passengerId",
          COUNT(*) AS total
      FROM "Booking"
      WHERE "status" IN ('PENDING', 'CONFIRMED')
      GROUP BY "rideId", "passengerId"
      HAVING COUNT(*) > 1;
    `;
    console.log("=== DUPLICATES ===");
    console.log(duplicates);

    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'Booking';
    `;
    console.log("=== INDEXES ===");
    console.log(indexes);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
