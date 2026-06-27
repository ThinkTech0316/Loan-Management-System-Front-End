import pg from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

// This holds the tenant schema name for the current async execution context
export const tenantContext = new AsyncLocalStorage();

export const query = async (text, params = []) => {
  const tenantSchema = tenantContext.getStore();
  const client = await pool.connect();
  try {
    if (tenantSchema) {
      await client.query(`SET search_path TO "${tenantSchema}", public`);
    } else {
      await client.query('SET search_path TO public');
    }
    const result = await client.query(text, params);
    return {
      rows: result.rows ?? [],
      rowCount: result.rowCount ?? 0,
    };
  } finally {
    client.release();
  }
};

export const transaction = async (callback) => {
  const tenantSchema = tenantContext.getStore();
  const client = await pool.connect();
  try {
    if (tenantSchema) {
      await client.query(`SET search_path TO "${tenantSchema}", public`);
    } else {
      await client.query('SET search_path TO public');
    }
    await client.query('BEGIN');
    const wrapped = {
      query: async (text, params = []) => {
        const result = await client.query(text, params);
        return {
          rows: result.rows ?? [],
          rowCount: result.rowCount ?? 0,
        };
      },
    };
    const result = await callback(wrapped);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const closeDatabase = () => pool.end();
