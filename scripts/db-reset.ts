#!/usr/bin/env tsx
/**
 * Database Reset Script
 * WARNING: This will delete all data!
 * Use only in development
 */

import { db, pool, runMigrations } from '../src/db';
import { clearDatabase, seedDatabase } from '../src/db/seed';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function resetDatabase() {
  console.log('\n⚠️  DATABASE RESET SCRIPT');
  console.log('====================================\n');

  // Safety check for production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot run database reset in production!');
    process.exit(1);
  }

  console.log('This will:');
  console.log('  1. Drop all existing data');
  console.log('  2. Run migrations');
  console.log('  3. Seed the database with sample data\n');

  const answer = await question('Are you sure? (yes/no): ');

  if (answer.toLowerCase() !== 'yes') {
    console.log('\n✅ Operation cancelled');
    rl.close();
    process.exit(0);
  }

  try {
    console.log('\n🗑️  Clearing database...');
    await clearDatabase();

    console.log('\n🔄 Running migrations...');
    await runMigrations();

    console.log('\n🌱 Seeding database...');
    await seedDatabase();

    console.log('\n✅ Database reset complete!\n');
    console.log('You can now login with:');
    console.log('  Email: admin@acme.com');
    console.log('  Password: Test123!@#\n');

  } catch (error) {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
    process.exit(0);
  }
}

resetDatabase();
