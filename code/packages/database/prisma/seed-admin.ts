import { PrismaClient } from '@repo/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@coride.com' },
    update: {},
    create: {
      email: 'admin@coride.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'CoRide',
      phone: '0123456789',
      role: 'ADMIN',
      bio: 'Administrator of CoRide system',
    },
  });

  console.log('Admin user created:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });