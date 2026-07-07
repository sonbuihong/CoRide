process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5433/coride_test';
import { cleanDatabase } from './apps/backend/src/test/database';
import { createFixtureDriver, createFixtureVehicle } from './apps/backend/src/test/fixtures';

async function run() {
  await cleanDatabase();
  const driver = await createFixtureDriver();
  console.log("Driver created:", driver.id);
  try {
    const v = await createFixtureVehicle(driver.id);
    console.log("Vehicle created:", v.id);
  } catch(e: any) {
    console.error("ERROR", e);
  }
}
run();
