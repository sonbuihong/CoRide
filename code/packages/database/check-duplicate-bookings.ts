import { PrismaClient } from './generated/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const duplicates = await prisma.$queryRaw`SELECT "rideId", "passengerId", COUNT(id) FROM "Booking" WHERE status IN ('PENDING', 'CONFIRMED') GROUP BY "rideId", "passengerId" HAVING COUNT(id) > 1;`;
    console.log(JSON.stringify(duplicates, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
check();
