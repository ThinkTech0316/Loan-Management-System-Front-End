import { AsyncLocalStorage } from 'node:async_hooks';
import { getTenantPool, clearTenantPool } from './db/tenant.js';
import { masterPool } from './db/master.js';

// This holds the tenantId (Client UUID) for the current async execution context
export const tenantContext = new AsyncLocalStorage();

// This holds the userId for the current async execution context
export const userContext = new AsyncLocalStorage();

export const query = async (text, params = []) => {
  const tenantId = tenantContext.getStore();
  
  // If no tenant context, default to the master database (for global operations)
  const pool = tenantId ? await getTenantPool(tenantId) : masterPool;
  
  const client = await pool.connect();
  try {
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
  const tenantId = tenantContext.getStore();
  const pool = tenantId ? await getTenantPool(tenantId) : masterPool;
  
  const client = await pool.connect();
  try {
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

export const closeDatabase = async () => {
    await masterPool.end();
};
