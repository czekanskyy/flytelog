import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const airport = await prisma.airport.findFirst({
    where: {
      runways: { not: undefined }, // just get first one and see
    },
  });
  console.log('--- AIRPORT ---');
  console.log(JSON.stringify(airport?.runways, null, 2));
  console.log(JSON.stringify(airport?.frequencies, null, 2));

  const navaid = await prisma.navaid.findFirst();
  console.log('--- NAVAID ---');
  console.log(JSON.stringify(navaid, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
