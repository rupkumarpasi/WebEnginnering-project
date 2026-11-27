import { createPool } from '../../src/db/pool.js';
import { migrate } from '../../src/db/migrate.js';

export async function resetTestDb() {
  const url = process.env.TEST_DATABASE_URL
    ?? 'postgres://users:users@127.0.0.1:5432/users_api_test';
  const pool = createPool(url);
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrate(pool);
  return pool;
}