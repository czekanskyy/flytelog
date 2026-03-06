const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  for (const t of [18, 21, 28, 30]) {
    const res = await c.query('SELECT name FROM "Airspace" WHERE type = $1 LIMIT 5', [t]);
    console.log(`\n--- type ${t} ---`);
    for (const r of res.rows) console.log(` ${r.name}`);
  }
  await c.end();
}
run().catch(console.error);
