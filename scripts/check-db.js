const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function check() {
  const client = new Client({ connectionString });
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Obstacle'");
  console.log(
    'Columns in Obstacle:',
    res.rows.map(r => r.column_name),
  );
  await client.end();
}

check().catch(console.error);
