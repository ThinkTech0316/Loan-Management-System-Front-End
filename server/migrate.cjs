const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'loan_master'
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        "key" VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'info',
        is_unread BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_notify_type CHECK (type IN ('success', 'error', 'info', 'warning'))
      );
    `);
    console.log('Tables created successfully in loan_master');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
