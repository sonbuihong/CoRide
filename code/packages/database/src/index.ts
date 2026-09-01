import { PrismaClient } from '../generated/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export const extendedPrisma = prisma.$extends({
  query: {
    review: {
      async create({ args, query }) {
        const result = (await query(args)) as any;
        
        // Auto-update rating tách biệt theo ReviewType
        // DRIVER → cập nhật driverRating (hành khách đánh giá tài xế)
        // PASSENGER → cập nhật passengerRating (tài xế đánh giá hành khách)
        const { revieweeId, rating, type } = result;

        if (revieweeId && typeof rating === 'number' && type) {
          const isDriverReview = type === 'DRIVER';

          // One SQL statement keeps the rolling average correct when multiple
          // reviews arrive concurrently. A driver's initial 5.0 is not counted
          // as a fake review because driverRatingCount starts at zero.
          if (isDriverReview) {
            await prisma.$executeRaw`
              UPDATE "User"
              SET "driverRating" = (
                    "driverRating" * "driverRatingCount" + ${rating}
                  ) / ("driverRatingCount" + 1),
                  "driverRatingCount" = "driverRatingCount" + 1
              WHERE "id" = ${revieweeId}
            `;
          } else {
            await prisma.$executeRaw`
              UPDATE "User"
              SET "passengerRating" = (
                    "passengerRating" * "passengerRatingCount" + ${rating}
                  ) / ("passengerRatingCount" + 1),
                  "passengerRatingCount" = "passengerRatingCount" + 1
              WHERE "id" = ${revieweeId}
            `;
          }
        }

        return result;
      },
    },
  },
});

export type ExtendedPrismaClient = typeof extendedPrisma;

export default extendedPrisma;

const nodeEnv = (globalThis as typeof globalThis & {
  process?: { env?: { NODE_ENV?: string } };
}).process?.env?.NODE_ENV;

if (nodeEnv !== 'production') globalThis.prisma = prisma;

export * from '../generated/client';
