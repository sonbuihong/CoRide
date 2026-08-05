const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.pricingConfig.upsert({
    where: { vehicleType: 'BIKE' },
    update: { baseFare: 12000, pricePerKm: 4500, isActive: true },
    create: { vehicleType: 'BIKE', baseFare: 12000, pricePerKm: 4500, isActive: true }
  });
  await prisma.pricingConfig.upsert({
    where: { vehicleType: 'CAR' },
    update: { baseFare: 20000, pricePerKm: 7000, isActive: true },
    create: { vehicleType: 'CAR', baseFare: 20000, pricePerKm: 7000, isActive: true }
  });
  console.log('Seeded successfully!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
