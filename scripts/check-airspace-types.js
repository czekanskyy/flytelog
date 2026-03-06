const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const res = await c.query('SELECT type, COUNT(*) as cnt FROM "Airspace" GROUP BY type ORDER BY type');
  for (const r of res.rows) console.log('type', r.type, '->', r.cnt, 'records');
  await c.end();
}
run().catch(console.error);
