import pg from 'pg';
import { config } from './config.js';
import { pool, query } from './database.js';
import { globalSchemaSql } from './schema.js';
import { seedDatabase } from './seed.js';

const ensureDatabaseExists = async () => {
  const url = new URL(config.databaseUrl);
  const databaseName = url.pathname.replace(/^\//, '');
  if (!databaseName) return;

  const adminUrl = new URL(config.databaseUrl);
  adminUrl.pathname = '/postgres';

  const client = new pg.Client({ connectionString: adminUrl.toString() });
  try {
    await client.connect();
    const res = await client.query(
      'SELECT datname FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`Created PostgreSQL database "${databaseName}".`);
    }
  } finally {
    await client.end();
  }
};

try {
  await ensureDatabaseExists();

  // PostgreSQL doesn't support multiple statements in one query
  const statements = globalSchemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await query(stmt);
  }

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_borrowers_deleted ON borrowers(is_deleted)',
    'CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON loans(borrower_id)',
    'CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id)',
    'CREATE INDEX IF NOT EXISTS idx_fixed_deposits_borrower_id ON fixed_deposits(borrower_id)',
  ];
  for (const sql of indexes) {
    try { await query(sql); } catch (e) { /* ignore if exists */ }
  }

  await seedDatabase();
  console.log('PostgreSQL schema initialized and seed data applied.');
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('Could not connect to PostgreSQL. Start PostgreSQL or update DATABASE_URL in .env, then run npm run db:init again.');
  }
  throw error;
} finally {
  await pool.end();
}
