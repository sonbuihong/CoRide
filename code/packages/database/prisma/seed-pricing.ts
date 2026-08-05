import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function main() {
  // Cấu hình giá xe máy (BIKE)
  // Công thức: baseFare + distanceKm * pricePerKm + durationMin * pricePerMinute
  // Ví dụ 5km ~ 12000 + 5*4500 = 34500 → làm tròn 35000
  const bike = await prisma.pricingConfig.upsert({
    where: { vehicleType: 'BIKE' },
    update: {
      baseFare: 12000,
      pricePerKm: 4500,
      pricePerMinute: 0,
      baseDistance: 0,
      minFare: 12000,
      isActive: true,
    },
    create: {
      vehicleType: 'BIKE',
      baseFare: 12000,
      pricePerKm: 4500,
      pricePerMinute: 0,
      baseDistance: 0,
      minFare: 12000,
      isActive: true,
    },
  });

  // Cấu hình giá ô tô (CAR)
  // Ví dụ 5km ~ 20000 + 5*7000 = 55000
  const car = await prisma.pricingConfig.upsert({
    where: { vehicleType: 'CAR' },
    update: {
      baseFare: 20000,
      pricePerKm: 7000,
      pricePerMinute: 0,
      baseDistance: 0,
      minFare: 20000,
      isActive: true,
    },
    create: {
      vehicleType: 'CAR',
      baseFare: 20000,
      pricePerKm: 7000,
      pricePerMinute: 0,
      baseDistance: 0,
      minFare: 20000,
      isActive: true,
    },
  });

  console.log('PricingConfig seeded:');
  console.log(' BIKE:', bike);
  console.log(' CAR: ', car);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
