import { bootstrapDatabase } from './bootstrap.js';

try {
  console.log('Running Master Database Migrations...');
  await bootstrapDatabase();
  console.log('Migrations completed successfully.');
  process.exit(0);
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
