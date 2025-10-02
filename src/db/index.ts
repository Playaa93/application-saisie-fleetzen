/**
 * Database Connection & Configuration
 * PostgreSQL with Drizzle ORM
 */

import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schema';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Environment variables validation
const requiredEnvVars = ['DATABASE_URL'] as const;

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL!,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  // Supabase requires SSL - always enable it
  ssl: {
    rejectUnauthorized: false // Allow self-signed certificates for Supabase
  },
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('Database client connected');
});

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database health check passed:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Run migrations
export async function runMigrations(): Promise<void> {
  try {
    console.log('Running database migrations...');
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    return await callback(tx);
  });
}

// Export schema and types
export { schema };
export type DB = typeof db;
