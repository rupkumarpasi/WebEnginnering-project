import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

/** Shared connection pool — create once per process. */
export function createPool(connectionString = env.databaseUrl) {
  return new Pool({
    connectionString,
    // Fail fast in tests / bad config instead of hanging.
    connectionTimeoutMillis: 5_000,
  });
}