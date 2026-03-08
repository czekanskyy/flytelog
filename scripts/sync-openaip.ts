import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

config({ path: '.env' });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const API_KEY = process.env.OPENAIP_API_KEY;
const BASE_URL = 'https://api.core.openaip.net/api';
const HEADERS = {
  'x-openaip-api-key': API_KEY || '',
  Accept: 'application/json',
};

async function fetchPaginated(endpoint: string, country = 'PL') {
  let results: any[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    console.log(`Fetching ${endpoint} page ${page}/${totalPages}...`);
    const res = await fetch(`${BASE_URL}${endpoint}?country=${country}&page=${page}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
    const data = await res.json();

    results = results.concat(data.items);
    totalPages = data.pageCount || 1;
    page++;
  }
  return results;
}

async function sync() {
  if (!API_KEY) throw new Error('OPENAIP_API_KEY is not defined in .env');

  console.log('Starting OpenAIP sync for PL...');

  // 1. Airports
  const airports = await fetchPaginated('/airports');
  console.log(`Found ${airports.length} airports`);

  await prisma.$transaction(async tx => {
    await tx.airport.deleteMany();
    const records = airports.map(a => ({
      openaipId: a._id,
      name: a.name,
      icaoCode: a.icaoCode,
      type: a.type,
      lat: a.geometry.coordinates[1],
      lon: a.geometry.coordinates[0],
      elevation: a.elevation?.value,
      elevationUnit: a.elevation?.unit,
      country: a.country,
      trafficType: a.trafficType || [],
      ppr: a.ppr || false,
      private: a.private || false,
      skydiveActivity: a.skydiveActivity || false,
      winchOnly: a.winchOnly || false,
      runways: a.runways || [],
      frequencies: a.frequencies || [],
    }));
    await tx.airport.createMany({ data: records });
  });

  // 2. Navaids
  const navaids = await fetchPaginated('/navaids');
  console.log(`Found ${navaids.length} navaids`);

  await prisma.$transaction(async tx => {
    await tx.navaid.deleteMany();
    const records = navaids.map(n => ({
      openaipId: n._id,
      name: n.name,
      identifier: n.identifier,
      type: n.type,
      frequency: n.frequency?.value ? n.frequency.value.toString() : null,
      frequencyUnit: n.frequency?.unit,
      channel: n.channel,
      range: n.range?.value,
      rangeUnit: n.range?.unit,
      lat: n.geometry.coordinates[1],
      lon: n.geometry.coordinates[0],
      elevation: n.elevation?.value,
      elevationUnit: n.elevation?.unit,
      country: n.country,
      sourceUpdatedAt: n.updatedAt ? new Date(n.updatedAt) : null,
    }));
    await tx.navaid.createMany({ data: records });

    // Convert VFR intersections from navaids if applicable
    // OpenAIP v2 often stores VFR reporting points as navaids of type 'VRP' or 'REP'
  });

  // 3. Airspaces
  const airspaces = await fetchPaginated('/airspaces');
  console.log(`Found ${airspaces.length} airspaces`);

  await prisma.$transaction(async tx => {
    await tx.airspace.deleteMany();
    const records = airspaces.map(as => {
      let poly = as.geometry;
      return {
        openaipId: as._id,
        name: as.name,
        type: as.type,
        icaoClass: as.icaoClass,
        upperLimit: as.upperLimit?.value,
        lowerLimit: as.lowerLimit?.value,
        country: as.country,
        geometry: poly,
      };
    });
    for (const chunk of chunkArray(records, 50)) {
      await tx.airspace.createMany({ data: chunk });
    }
  });

  console.log('Sync complete!');
}

function chunkArray(arr: any[], size: number) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
}

sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
