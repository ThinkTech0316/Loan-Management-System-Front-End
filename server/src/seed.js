import bcrypt from 'bcryptjs';
import { query } from './database.js';

export const seedMasterDatabase = async () => {
  const { rows } = await query('SELECT id FROM master_users WHERE email = $1', ['superadmin@loan.com']);
  if (rows.length === 0) {
    console.log('Seeding default super admin...');
    const passwordHash = await bcrypt.hash('superadmin123', 10);
    await query(
      'INSERT INTO master_users (email, password_hash, role) VALUES ($1, $2, $3)',
      ['superadmin@loan.com', passwordHash, 'superadmin']
    );
  } else {
    console.log('Default super admin already exists.');
  }
};
