import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

const API_KEY = process.env.OPENAIP_API_KEY;
const BASE_URL = 'https://api.core.openaip.net/api';
const HEADERS = {
  'x-openaip-api-key': API_KEY || '',
  Accept: 'application/json',
};

async function fetchPaginated(endpoint: string, country = 'PL', limit = 10) {
  let results: any[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= Math.min(totalPages, limit)) {
    console.log(`Fetching ${endpoint} page ${page}...`);
    try {
      const res = await axios.get(`${BASE_URL}${endpoint}`, {
        params: { country, page },
        headers: HEADERS,
      });

      results = results.concat(res.data.items);
      totalPages = res.data.pageCount || 1;
      page++;
    } catch (err: any) {
      console.error(`Error on ${endpoint} page ${page}:`, err.response?.data || err.message);
      break;
    }
  }
  return results;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
}

export async function GET() {
  if (!API_KEY) return NextResponse.json({ error: 'OPENAIP_API_KEY missing' }, { status: 500 });

  try {
    console.log('--- STARTING COMPREHENSIVE OPENAIP SYNC ---');

    // 1. Airports
    console.log('Fetching airports...');
    const airports = await fetchPaginated('/airports', 'PL', 5);
    await prisma.$transaction(async tx => {
      await tx.airport.deleteMany({ where: { country: 'PL' } });
      const records = airports.map(a => ({
        openaipId: a._id,
        name: a.name,
        icaoCode: a.icaoCode,
        type: a.type,
        lat: a.geometry.coordinates[1],
        lon: a.geometry.coordinates[0],
        elevation: a.elevation?.value,
        country: a.country,
      }));
      await tx.airport.createMany({ data: records });
    });

    // 2. Navaids
    console.log('Fetching navaids...');
    const navaids = await fetchPaginated('/navaids', 'PL', 5);
    await prisma.$transaction(async tx => {
      await tx.navaid.deleteMany({ where: { country: 'PL' } });
      const records = navaids.map(n => ({
        openaipId: n._id,
        name: n.name,
        type: n.type,
        frequency: n.frequency?.value ? n.frequency.value.toString() : null,
        lat: n.geometry.coordinates[1],
        lon: n.geometry.coordinates[0],
        elevation: n.elevation?.value,
        country: n.country,
      }));
      await tx.navaid.createMany({ data: records });
    });

    // 3. Airspaces
    console.log('Fetching airspaces...');
    const airspaces = await fetchPaginated('/airspaces', 'PL', 25);
    await prisma.$transaction(async tx => {
      await tx.airspace.deleteMany({ where: { country: 'PL' } });
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

    // 4. Reporting Points
    console.log('Fetching reporting points...');
    const rps = await fetchPaginated('/reporting-points', 'PL', 10);
    await prisma.$transaction(async tx => {
      await tx.reportingPoint.deleteMany({ where: { country: 'PL' } });
      const records = rps.map(rp => ({
        openaipId: rp._id,
        name: rp.name,
        type: rp.type,
        lat: rp.geometry.coordinates[1],
        lon: rp.geometry.coordinates[0],
        elevation: rp.elevation?.value,
        country: rp.country,
      }));
      await tx.reportingPoint.createMany({ data: records });
    });

    // 5. Obstacles
    console.log('Fetching obstacles...');
    const obstacles = await fetchPaginated('/obstacles', 'PL', 20);
    await prisma.$transaction(async tx => {
      await tx.obstacle.deleteMany({ where: { country: 'PL' } });
      const records = obstacles.map(o => ({
        openaipId: o._id,
        type: o.type,
        lat: o.geometry.coordinates[1],
        lon: o.geometry.coordinates[0],
        elevation: o.elevation?.value || 0,
        heightAgl: o.heightAgl || 0,
        country: o.country || 'PL',
      }));
      for (const chunk of chunkArray(records, 50)) {
        await tx.obstacle.createMany({ data: chunk });
      }
    });

    await prisma.syncLog.create({
      data: {
        source: 'OpenAIP',
        itemsUpdated: airports.length + navaids.length + airspaces.length + rps.length + obstacles.length,
      },
    });

    console.log('--- SYNC COMPLETE ---');
    return NextResponse.json({
      success: true,
      counts: {
        airports: airports.length,
        navaids: navaids.length,
        airspaces: airspaces.length,
        reportingPoints: rps.length,
        obstacles: obstacles.length,
      },
    });
  } catch (err: any) {
    console.error('OPENAIP SYNC ERROR:', err.response?.data || err.message || err);
    return NextResponse.json(
      {
        error: err.message,
        details: err.response?.data,
        stack: err.stack,
      },
      { status: 500 },
    );
  }
}
