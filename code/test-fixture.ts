import { extendedPrisma as prisma } from '@repo/database';
import { cleanDatabase } from './apps/backend/src/test/database';
import { createFixtureDriver, createFixtureVehicle } from './apps/backend/src/test/fixtures';

async function run() {
  process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5433/coride_test';
  await cleanDatabase();
  const driver = await createFixtureDriver();
  console.log("Driver created:", driver.id);
  try {
    const v = await createFixtureVehicle(driver.id);
    console.log("Vehicle created:", v.id);
  } catch(e: any) {
    console.error(e.message);
  }
}
run();
