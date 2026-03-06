'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const client_1 = require('@prisma/client');
const axios_1 = __importDefault(require('axios'));
const prisma = new client_1.PrismaClient();
// MUST SET MANUALLY FOR SCRIPT
const API_KEY = 'dfe9f5266c3df032f5c998e0ed1965dc';
const BASE_URL = 'https://api.core.openaip.net/api';
const HEADERS = {
  'x-openaip-api-key': API_KEY,
  Accept: 'application/json',
};
async function fetchPaginated(endpoint, country = 'PL') {
  let results = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    console.log(`Fetching ${endpoint} page ${page}...`);
    const res = await axios_1.default.get(`${BASE_URL}${endpoint}`, {
      params: { country, page },
      headers: HEADERS,
    });
    results = results.concat(res.data.items);
    totalPages = res.data.pageCount || 1;
    page++;
  }
  return results;
}
function chunkArray(arr, size) {
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
        country: a.country,
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
        type: n.type,
        frequency: n.frequency?.value ? n.frequency.value.toString() : null,
        lat: n.geometry.coordinates[1],
        lon: n.geometry.coordinates[0],
        elevation: n.elevation?.value,
        country: n.country,
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
    console.log('--- SYNC COMPLETE ---');
  } catch (err) {
    console.error('SYNC ERROR:', err.response?.data || err.message || err);
  }
}
sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
