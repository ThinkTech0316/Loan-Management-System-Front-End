import pg from 'pg';

const MASTER_DB_URL = 'postgresql://postgres:user@localhost:5432/loan_master';

async function run() {
  const masterPool = new pg.Pool({ connectionString: MASTER_DB_URL });
  
  try {
    console.log('Adding phone column to master_users...');
    await masterPool.query(`ALTER TABLE master_users ADD COLUMN IF NOT EXISTS phone VARCHAR(100)`);
    console.log('Successfully updated master_users.');

    const { rows: tenants } = await masterPool.query("SELECT id, db_name, db_user, db_password FROM master_users WHERE role = 'admin'");
    
    for (const tenant of tenants) {
      if (!tenant.db_name) continue;
      
      console.log(`Connecting to tenant DB: ${tenant.db_name}...`);
      const tenantPool = new pg.Pool({
        host: 'localhost',
        port: 5432,
        database: tenant.db_name,
        user: tenant.db_user,
        password: tenant.db_password
      });

      try {
        await tenantPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(100)`);
        console.log(`Successfully updated users table for tenant ${tenant.db_name}.`);
      } catch (err) {
        console.error(`Failed to update tenant ${tenant.db_name}:`, err.message);
      } finally {
        await tenantPool.end();
      }
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await masterPool.end();
    console.log('Migration complete.');
  }
}

run();
