const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const tables = ['Airport', 'Navaid', 'Airspace', 'ReportingPoint', 'Obstacle'];
  for (const t of tables) {
    const res = await client.query(`SELECT COUNT(*) FROM "${t}"`);
    console.log(`${t}: ${res.rows[0].count}`);
  }
  await client.end();
}

check().catch(console.error);
