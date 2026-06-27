import { query } from './src/database.js';
(async () => {
  try {
    const { rows } = await query("SELECT tablename, schemaname FROM pg_tables WHERE schemaname IN ('public', 'tenant_default')");
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
