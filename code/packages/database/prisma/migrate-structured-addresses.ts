/**
 * Data migration script for structured addresses
 * Converts existing ride data from string addresses to structured format
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRides() {
  console.log('Starting migration of ride addresses...');

  const rides = await prisma.ride.findMany({
    where: {
      OR: [
        { originHouseNumber: null },
        { destHouseNumber: null },
      ],
    },
  });

  console.log(`Found ${rides.length} rides to migrate`);

  for (const ride of rides) {
    try {
      // Parse origin address using Nominatim if coordinates are available
      if (ride.originLat && ride.originLng) {
        const { reverseGeocodeStructured } = await import('../../apps/web/src/lib/nominatim');
        const structuredOrigin = await reverseGeocodeStructured(ride.originLat, ride.originLng);
        
        await prisma.ride.update({
          where: { id: ride.id },
          data: {
            originHouseNumber: structuredOrigin.houseNumber,
            originStreet: structuredOrigin.street,
            originWard: structuredOrigin.ward,
            originDistrict: structuredOrigin.district,
            originProvince: structuredOrigin.province,
            originAddressType: 'NEW',
            addressDetailLevel: structuredOrigin.houseNumber && structuredOrigin.street ? 'FULL' : structuredOrigin.ward ? 'WARD' : 'DISTRICT',
          },
        });
      }

      // Parse destination address using Nominatim if coordinates are available
      if (ride.destinationLat && ride.destinationLng) {
        const { reverseGeocodeStructured } = await import('../../apps/web/src/lib/nominatim');
        const structuredDest = await reverseGeocodeStructured(ride.destinationLat, ride.destinationLng);
        
        await prisma.ride.update({
          where: { id: ride.id },
          data: {
            destHouseNumber: structuredDest.houseNumber,
            destStreet: structuredDest.street,
            destWard: structuredDest.ward,
            destDistrict: structuredDest.district,
            destProvince: structuredDest.province,
            destAddressType: 'NEW',
          },
        });
      }

      console.log(`Migrated ride ${ride.id}`);
    } catch (error) {
      console.error(`Failed to migrate ride ${ride.id}:`, error);
    }
  }

  console.log('Migration completed');
}

async function main() {
  try {
    await migrateRides();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
