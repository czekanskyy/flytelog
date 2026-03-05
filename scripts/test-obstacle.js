const { Client } = require('pg');
require('dotenv').config();

async function test() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(
      `
      INSERT INTO "Obstacle" ("id", "openaipId", "type", "lat", "lon", "elevation", "heightAgl", "country", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `,
      ['test-id', 'test-openaip-id', 1, 52.0, 21.0, 100, 50, 'PL'],
    );
    console.log('Success:', res.rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

test();
