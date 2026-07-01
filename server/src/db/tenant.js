import pg from 'pg';
import { masterPool } from './master.js';

// Cache for tenant connection pools (tenantId -> pg.Pool)
const tenantPools = new Map();

/**
 * Retrieves a PostgreSQL connection pool for the specified tenant.
 * If a pool doesn't exist, it queries the master database to get credentials,
 * creates a new pool, caches it, and returns it.
 */
export const getTenantPool = async (tenantId) => {
  if (!tenantId) {
    const { badRequest } = await import('../errors.js');
    throw badRequest('Tenant ID is required to get a database connection.');
  }

  // Validate if tenantId is a valid UUID
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(tenantId)) {
    const { unauthorized } = await import('../errors.js');
    throw unauthorized(`Invalid organization session. Please log out and log back in to clear your browser cache.`);
  }

  if (tenantPools.has(tenantId)) {
    return tenantPools.get(tenantId);
  }

  // Fetch DB credentials from Master DB
  const res = await masterPool.query(
    'SELECT db_name, db_user, db_password FROM master_users WHERE id = $1 AND role = $2 AND status = $3',
    [tenantId, 'admin', 'active']
  );

  if (res.rowCount === 0) {
    throw new Error('Tenant not found or suspended');
  }

  const { db_name, db_user, db_password } = res.rows[0];

  const pool = new pg.Pool({
    host: 'localhost', // Or get from config/env
    port: 5432,
    database: db_name,
    user: db_user,
    password: db_password,
    max: 10, // Max 10 connections per tenant to avoid exhausting DB connections
    idleTimeoutMillis: 30000,
  });

  tenantPools.set(tenantId, pool);

  return pool;
};

/**
 * Clears the cached pool for a tenant (useful if credentials change or on suspend)
 */
export const clearTenantPool = async (tenantId) => {
  const pool = tenantPools.get(tenantId);
  if (pool) {
    await pool.end();
    tenantPools.delete(tenantId);
  }
};
