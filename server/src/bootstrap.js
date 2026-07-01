import pg from 'pg';
import { config } from './config.js';

const ensureDatabaseExists = async () => {
  const url = new URL(config.masterDbUrl);
  const databaseName = url.pathname.replace(/^\//, '');
  if (!databaseName) return;

  const adminUrl = new URL(config.rootDbUrl);
  const client = new pg.Client({ connectionString: adminUrl.toString() });
  try {
    await client.connect();
    const res = await client.query(
      'SELECT datname FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`[Bootstrap] Created PostgreSQL database "${databaseName}".`);
    }
  } finally {
    await client.end();
  }
};

export const bootstrapDatabase = async () => {
  try {
    await ensureDatabaseExists();

    const { query } = await import('./database.js');
    const { masterSchemaSql } = await import('./schema.js');
    const { seedMasterDatabase } = await import('./seed.js');

    // Run master migrations
    const statements = masterSchemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await query(stmt);
    }

    await seedMasterDatabase();
    console.log('[Bootstrap] Master Database schema and seed data ready.');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('[Bootstrap] Could not connect to PostgreSQL.');
    }
    throw error;
  }
};
