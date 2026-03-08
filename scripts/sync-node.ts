import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import axios from 'axios';

config({ path: '.env' });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// MUST SET MANUALLY FOR SCRIPT
const API_KEY = 'dfe9f5266c3df032f5c998e0ed1965dc';
const BASE_URL = 'https://api.core.openaip.net/api';
const HEADERS = {
  'x-openaip-api-key': API_KEY,
  Accept: 'application/json',
};

async function fetchPaginated(endpoint: string, country = 'PL') {
  let results: any[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    console.log(`Fetching ${endpoint} page ${page}...`);
    const res = await axios.get(`${BASE_URL}${endpoint}`, {
      params: { country, page },
      headers: HEADERS,
    });

    results = results.concat(res.data.items);
    totalPages = res.data.pageCount || 1;
    page++;
  }
  return results;
}

function chunkArray(arr: any[], size: number) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
}

async function sync() {
  console.log('--- STARTING OPENAIP SYNC (NODE) ---');

  try {
    // 1. Airports
    console.log('Fetching airports...');
    const airports = await fetchPaginated('/airports');
    console.log(`Saving ${airports.length} airports...`);
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
    console.log('Airports saved.');

    // 2. Navaids
    console.log('Fetching navaids...');
    const navaids = await fetchPaginated('/navaids');
    console.log(`Saving ${navaids.length} navaids...`);
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
    });
    console.log('Navaids saved.');

    // 3. Airspaces
    console.log('Fetching airspaces...');
    const airspaces = await fetchPaginated('/airspaces');
    console.log(`Saving ${airspaces.length} airspaces...`);
    await prisma.$transaction(async tx => {
      await tx.airspace.deleteMany();
      const records = airspaces.map(as => ({
        openaipId: as._id,
        name: as.name,
        type: as.type,
        icaoClass: as.icaoClass,
        upperLimit: as.upperLimit?.value,
        lowerLimit: as.lowerLimit?.value,
        country: as.country,
        geometry: as.geometry,
      }));
      for (const chunk of chunkArray(records, 20)) {
        await tx.airspace.createMany({ data: chunk });
      }
    });
    console.log('Airspaces saved.');

    // 4. Reporting Points
    console.log('Fetching reporting points...');
    const reportingPoints = await fetchPaginated('/reporting-points');
    console.log(`Saving ${reportingPoints.length} reporting points...`);
    await prisma.$transaction(async tx => {
      await tx.reportingPoint.deleteMany();
      const records = reportingPoints.map(rp => ({
        openaipId: rp._id,
        name: rp.name,
        type: rp.type ?? null,
        lat: rp.geometry.coordinates[1],
        lon: rp.geometry.coordinates[0],
        elevation: rp.elevation?.value,
        country: rp.country ?? 'PL',
      }));
      await tx.reportingPoint.createMany({ data: records });
    });
    console.log('Reporting points saved.');

    // 5. Obstacles
    console.log('Fetching obstacles...');
    const obstacles = await fetchPaginated('/obstacles');
    console.log(`Saving ${obstacles.length} obstacles...`);
    await prisma.$transaction(async tx => {
      await tx.obstacle.deleteMany();
      const records = obstacles.map(o => ({
        openaipId: o._id,
        type: o.type,
        lat: o.geometry.coordinates[1],
        lon: o.geometry.coordinates[0],
        elevation: o.elevation?.value ?? 0,
        heightAgl: o.heightAgl ?? 0,
        country: o.country ?? 'PL',
      }));
      for (const chunk of chunkArray(records, 100)) {
        await tx.obstacle.createMany({ data: chunk });
      }
    });
    console.log('Obstacles saved.');

    console.log('--- SYNC COMPLETE ---');
  } catch (err: any) {
    console.error('SYNC ERROR:', err.response?.data || err.message || err);
  }
}

sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
