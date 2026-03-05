const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding mock aviation data for testing...');

  await prisma.airport.createMany({
    data: [
      { openaipId: 'mock-epll', name: 'Łódź Władysław Reymont', icaoCode: 'EPLL', type: 1, lat: 51.7219, lon: 19.3981, elevation: 604, country: 'PL' },
      { openaipId: 'mock-epwa', name: 'Warsaw Chopin', icaoCode: 'EPWA', type: 1, lat: 52.1657, lon: 20.9671, elevation: 361, country: 'PL' },
      { openaipId: 'mock-epkk', name: 'Kraków John Paul II', icaoCode: 'EPKK', type: 1, lat: 50.0777, lon: 19.7848, elevation: 791, country: 'PL' },
      { openaipId: 'mock-epkt', name: 'Katowice Wojciech Korfanty', icaoCode: 'EPKT', type: 1, lat: 50.4743, lon: 20.08, elevation: 994, country: 'PL' },
      { openaipId: 'mock-epgd', name: 'Gdańsk Lech Wałęsa', icaoCode: 'EPGD', type: 1, lat: 54.3775, lon: 18.4661, elevation: 489, country: 'PL' },
      { openaipId: 'mock-epwr', name: 'Wrocław Copernicus', icaoCode: 'EPWR', type: 1, lat: 51.1027, lon: 16.8858, elevation: 404, country: 'PL' },
    ],
    skipDuplicates: true,
  });

  await prisma.navaid.createMany({
    data: [
      { openaipId: 'mock-nav-1', name: 'LOZ VOR/DME', type: 2, frequency: '112.4', lat: 51.721, lon: 19.398, elevation: 604, country: 'PL' },
      { openaipId: 'mock-nav-2', name: 'WAR VOR/DME', type: 2, frequency: '114.9', lat: 52.165, lon: 20.967, elevation: 361, country: 'PL' },
    ],
    skipDuplicates: true,
  });

  // A simple square TMA around Warsaw for testing intersections
  const epwaTmaPoly = {
    type: 'Polygon',
    coordinates: [
      [
        [20.5, 51.8],
        [21.5, 51.8],
        [21.5, 52.5],
        [20.5, 52.5],
        [20.5, 51.8],
      ],
    ],
  };

  // A simple Restricted area for testing Danger intersections
  const epr1Poly = {
    type: 'Polygon',
    coordinates: [
      [
        [19.0, 51.0],
        [19.5, 51.0],
        [19.5, 51.5],
        [19.0, 51.5],
        [19.0, 51.0],
      ],
    ],
  };

  await prisma.airspace.createMany({
    data: [
      { openaipId: 'mock-as-1', name: 'TMA WARSZAWA', type: 2, icaoClass: 3, upperLimit: 6500, lowerLimit: 1500, country: 'PL', geometry: epwaTmaPoly },
      { openaipId: 'mock-as-2', name: 'EP R1 MOCK', type: 6, icaoClass: 7, upperLimit: 10000, lowerLimit: 0, country: 'PL', geometry: epr1Poly },
    ],
    skipDuplicates: true,
  });

  console.log('Mock data seeded successfully!');
}

seed()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
