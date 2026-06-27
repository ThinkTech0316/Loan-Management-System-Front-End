import bcrypt from 'bcryptjs';
import { query } from './database.js';
import { createTenant } from './services.js';

export const seedDatabase = async () => {
  const { rows } = await query('SELECT id FROM tenants WHERE schema_name = $1', ['tenant_default']);
  if (rows.length === 0) {
    console.log('Seeding default tenant...');
    await createTenant({
      name: 'Default',
      companyName: 'VanniLoan',
      email: 'admin@vanniloan.com',
      password: 'password123',
    });
  } else {
    console.log('Default tenant already exists.');
  }
};
