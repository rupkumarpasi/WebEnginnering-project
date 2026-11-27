import { createPool } from './pool.js';
import { migrate } from './migrate.js';

const pool = createPool();
try {
  await migrate(pool);
} finally {
  await pool.end();
}