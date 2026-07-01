import pg from 'pg';
import { config } from '../config.js';

// The Master Database pool (loan_master)
export const masterPool = new pg.Pool({ 
  connectionString: config.masterDbUrl 
});

// For executing administrative tasks like CREATE DATABASE (needs superuser privileges)
export const rootPool = new pg.Pool({
  connectionString: config.rootDbUrl
});
