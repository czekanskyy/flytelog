const { Client } = require('pg');
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.OPENAIP_API_KEY;
const BASE_URL = 'https://api.core.openaip.net/api';
const HEADERS = {
  'x-openaip-api-key': API_KEY,
  Accept: 'application/json',
};

const connectionString = process.env.DATABASE_URL;

async function fetchPaginated(endpoint, country = 'PL', limit = 10) {
  let results = [];
  let page = 1;
  let totalPages = 1;

  while (page <= Math.min(totalPages, limit)) {
    console.log(`Fetching ${endpoint} page ${page}/${totalPages}...`);
    try {
      const res = await axios.get(`${BASE_URL}${endpoint}`, {
        params: { country, page },
        headers: HEADERS,
      });
      results = results.concat(res.data.items);
      totalPages = res.data.pageCount || 1;
    } catch (err) {
      console.error(`Error on ${endpoint} page ${page}:`, err.response?.data || err.message);
      break;
    }
    page++;
  }
  return results;
}

function chunkArray(arr, size) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
}

async function sync() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to Neon PostgreSQL.');

  try {
    // 1. Airports
    console.log('Syncing Airports...');
    const airports = await fetchPaginated('/airports', 'PL', 10);
    await client.query('DELETE FROM "Airport" WHERE "country" = $1', ['PL']);
    for (const chunk of chunkArray(airports, 50)) {
      const values = [];
      const placeholders = [];
      let i = 1;
      for (const a of chunk) {
        placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, NOW())`);
        values.push(
          require('crypto').randomUUID(),
          a._id,
          a.name || 'UNKNOWN',
          a.icaoCode || null,
          a.type,
          a.geometry.coordinates[1],
          a.geometry.coordinates[0],
          a.elevation?.value || null,
          a.country || 'PL',
        );
      }
      await client.query(
        `INSERT INTO "Airport" ("id", "openaipId", "name", "icaoCode", "type", "lat", "lon", "elevation", "country", "updatedAt") VALUES ${placeholders.join(', ')}`,
        values,
      );
    }

    // 2. Navaids
    console.log('Syncing Navaids...');
    const navaids = await fetchPaginated('/navaids', 'PL', 10);
    await client.query('DELETE FROM "Navaid" WHERE "country" = $1', ['PL']);
    for (const chunk of chunkArray(navaids, 50)) {
      const values = [];
      const placeholders = [];
      let i = 1;
      for (const n of chunk) {
        placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, NOW())`);
        values.push(
          require('crypto').randomUUID(),
          n._id,
          n.name || 'UNKNOWN',
          n.type,
          n.frequency?.value ? n.frequency.value.toString() : null,
          n.geometry.coordinates[1],
          n.geometry.coordinates[0],
          n.elevation?.value || null,
          n.country || 'PL',
        );
      }
      await client.query(
        `INSERT INTO "Navaid" ("id", "openaipId", "name", "type", "frequency", "lat", "lon", "elevation", "country", "updatedAt") VALUES ${placeholders.join(', ')}`,
        values,
      );
    }

    // 3. Airspaces
    console.log('Syncing Airspaces...');
    const airspaces = await fetchPaginated('/airspaces', 'PL', 25);
    await client.query('DELETE FROM "Airspace" WHERE "country" = $1', ['PL']);
    for (const chunk of chunkArray(airspaces, 20)) {
      const values = [];
      const placeholders = [];
      let i = 1;
      for (const as of chunk) {
        placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}::json, NOW())`);
        values.push(
          require('crypto').randomUUID(),
          as._id,
          as.name || 'UNKNOWN',
          as.type,
          as.icaoClass || null,
          as.upperLimit?.value || null,
          as.lowerLimit?.value || null,
          as.country || 'PL',
          JSON.stringify(as.geometry),
        );
      }
      await client.query(
        `INSERT INTO "Airspace" ("id", "openaipId", "name", "type", "icaoClass", "upperLimit", "lowerLimit", "country", "geometry", "updatedAt") VALUES ${placeholders.join(', ')}`,
        values,
      );
    }

    // 4. Reporting Points
    console.log('Syncing Reporting Points...');
    const rps = await fetchPaginated('/reporting-points', 'PL', 10);
    await client.query('DELETE FROM "ReportingPoint" WHERE "country" = $1', ['PL']);
    for (const chunk of chunkArray(rps, 50)) {
      const values = [];
      const placeholders = [];
      let i = 1;
      for (const rp of chunk) {
        placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, NOW())`);
        values.push(
          require('crypto').randomUUID(),
          rp._id,
          rp.name || rp.identifier || 'UNNAMED',
          rp.type,
          rp.geometry.coordinates[1],
          rp.geometry.coordinates[0],
          rp.elevation?.value || null,
          rp.country || 'PL',
        );
      }
      await client.query(
        `INSERT INTO "ReportingPoint" ("id", "openaipId", "name", "type", "lat", "lon", "elevation", "country", "updatedAt") VALUES ${placeholders.join(', ')}`,
        values,
      );
    }

    // 5. Obstacles
    console.log('Syncing Obstacles...');
    const obstacles = await fetchPaginated('/obstacles', 'PL', 20);
    await client.query('DELETE FROM "Obstacle" WHERE "country" = $1', ['PL']);
    for (const chunk of chunkArray(obstacles, 50)) {
      const values = [];
      const placeholders = [];
      let i = 1;
      for (const o of chunk) {
        placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, NOW())`);
        values.push(
          require('crypto').randomUUID(),
          o._id,
          o.type,
          o.geometry.coordinates[1],
          o.geometry.coordinates[0],
          o.elevation?.value || 0,
          o.heightAgl || 0,
          o.country || 'PL',
        );
      }
      await client.query(
        `INSERT INTO "Obstacle" ("id", "openaipId", "type", "lat", "lon", "elevation", "heightAgl", "country", "updatedAt") VALUES ${placeholders.join(', ')}`,
        values,
      );
    }

    console.log('--- ALL SYNC COMPLETE ---');
  } catch (error) {
    console.error('SYNC ERROR:', error.message);
  } finally {
    await client.end();
  }
}

sync();
