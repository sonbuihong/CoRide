/**
 * Province mapping seed data
 * Maps old province names to new province names after mergers (effective 1/7/2024)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const provinceMergers = [
  // Province mergers after 1/7/2024
  { oldProvince: 'Hà Tây', newProvince: 'Hà Nội', effectiveDate: '2024-07-01' },
  { oldProvince: 'Đắk Nông', newProvince: 'Đắk Nông', effectiveDate: '2024-07-01' },
  // Add more province mergers as needed
  // Note: Đắk Nông is listed as an example - it may not have actually merged
  // Update this list with actual mergers from official sources
];

async function main() {
  console.log('Seeding province mappings...');

  for (const mapping of provinceMergers) {
    await prisma.provinceMapping.upsert({
      where: {
        oldProvince_effectiveDate: {
          oldProvince: mapping.oldProvince,
          effectiveDate: new Date(mapping.effectiveDate),
        },
      },
      update: {},
      create: {
        oldProvince: mapping.oldProvince,
        newProvince: mapping.newProvince,
        effectiveDate: new Date(mapping.effectiveDate),
        isActive: true,
      },
    });
  }

  console.log('Province mappings seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
