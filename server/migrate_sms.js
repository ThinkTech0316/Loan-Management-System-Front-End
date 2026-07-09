import { masterPool } from './src/db/master.js';

async function runMigration() {
  try {
    console.log('Connecting to master database...');
    
    console.log('Adding sms_count column to master_users...');
    await masterPool.query(`ALTER TABLE master_users ADD COLUMN IF NOT EXISTS sms_count INTEGER DEFAULT 0`);
    console.log('Successfully updated master_users.');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
