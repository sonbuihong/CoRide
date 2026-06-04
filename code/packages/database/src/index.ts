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
          
          const ratingField = isDriverReview ? 'driverRating' : 'passengerRating';
          const countField = isDriverReview ? 'driverRatingCount' : 'passengerRatingCount';

          const reviewee = await prisma.user.findUnique({
            where: { id: revieweeId },
            select: { [ratingField]: true, [countField]: true }
          });

          if (reviewee) {
            const currentRating = (reviewee as any)[ratingField] as number;
            const currentCount = (reviewee as any)[countField] as number;
            const newCount = currentCount + 1;
            const newRating = (currentRating * currentCount + rating) / newCount;
            
            await prisma.user.update({
              where: { id: revieweeId },
              data: {
                [ratingField]: newRating,
                [countField]: { increment: 1 }
              }
            });
          }
        }

        return result;
      },
    },
  },
});

export type ExtendedPrismaClient = typeof extendedPrisma;

export default extendedPrisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export * from '../generated/client';
