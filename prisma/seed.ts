import { prisma, seedDatabaseIfEmpty } from '../src/config/database';

seedDatabaseIfEmpty()
  .then(async () => {
    console.log('✅ Database seed completed.');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
