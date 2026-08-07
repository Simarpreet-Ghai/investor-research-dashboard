import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pool from '../src/db.js';

const sectors = [
  'Technology',
  'Healthcare',
  'Energy',
  'Financial Services',
  'Industrials',
  'Mining',
];

const regions = [
  'Ontario',
  'British Columbia',
  'Alberta',
  'Quebec',
  'New York',
  'California',
  'Texas',
  'Illinois',
];

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(scriptDirectory, '..', 'schema.sql');

async function seedDatabase() {
  const schema = await readFile(schemaPath, 'utf8');

  await pool.query('BEGIN');
  try {
    await pool.query(schema);
    await pool.query('TRUNCATE TABLE investors RESTART IDENTITY');

    const insertQuery = `
      INSERT INTO investors
        (name, sector, region, min_investment, max_investment, email, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    for (let number = 1; number <= 500; number += 1) {
      const paddedNumber = String(number).padStart(3, '0');
      const sector = sectors[(number - 1) % sectors.length];
      const region = regions[(number - 1) % regions.length];
      const minInvestment = 100000 + ((number - 1) % 10) * 50000;
      const maxInvestment = minInvestment + 500000 + ((number - 1) % 5) * 100000;

      await pool.query(insertQuery, [
        `Investor ${paddedNumber}`,
        sector,
        region,
        minInvestment,
        maxInvestment,
        `investor${paddedNumber}@example.test`,
        'New',
      ]);
    }

    await pool.query('COMMIT');
    console.log('Seed complete: 500 simulated investors across 6 sectors.');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  } finally {
    await pool.end();
  }
}

seedDatabase().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
});
