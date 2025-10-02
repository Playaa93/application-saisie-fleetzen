/**
 * Script to check Supabase database schema and data
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database...\n');
  console.log(`📍 URL: ${supabaseUrl}\n`);

  const tables = [
    'agents',
    'clients',
    'vehicles',
    'intervention_types',
    'intervention_fields',
    'interventions'
  ];

  const results: Record<string, any> = {};

  for (const table of tables) {
    console.log(`\n📊 Checking table: ${table}`);
    console.log('─'.repeat(60));

    try {
      // Count records
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`❌ Error: ${countError.message}`);
        if (countError.code === '42P01') {
          console.log(`   ⚠️  Table "${table}" does not exist!`);
          results[table] = { exists: false, error: 'Table does not exist' };
        } else {
          results[table] = { exists: false, error: countError.message };
        }
        continue;
      }

      results[table] = { exists: true, count };
      console.log(`✅ Table exists with ${count || 0} records`);

      // Fetch sample data (first 3 records)
      if (count && count > 0) {
        const { data, error: dataError } = await supabase
          .from(table)
          .select('*')
          .limit(3);

        if (!dataError && data && data.length > 0) {
          console.log('\n📝 Sample data:');
          data.forEach((record, idx) => {
            console.log(`\n   Record ${idx + 1}:`);
            // Show only key fields
            const keys = Object.keys(record).slice(0, 5);
            keys.forEach(key => {
              const value = record[key];
              const displayValue = typeof value === 'object'
                ? JSON.stringify(value).substring(0, 50) + '...'
                : String(value).substring(0, 50);
              console.log(`      ${key}: ${displayValue}`);
            });
          });
        }
      }

    } catch (err: any) {
      console.log(`❌ Unexpected error: ${err.message}`);
      results[table] = { exists: false, error: err.message };
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));

  const existing = Object.entries(results).filter(([_, v]) => v.exists);
  const missing = Object.entries(results).filter(([_, v]) => !v.exists);

  console.log(`\n✅ Existing tables: ${existing.length}/${tables.length}`);
  existing.forEach(([table, data]) => {
    console.log(`   • ${table}: ${data.count} records`);
  });

  if (missing.length > 0) {
    console.log(`\n❌ Missing tables: ${missing.length}/${tables.length}`);
    missing.forEach(([table, data]) => {
      console.log(`   • ${table}: ${data.error}`);
    });

    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Go to Supabase SQL Editor: https://app.supabase.com');
    console.log('   2. Run the schema from: docs/supabase-fleetzen-schema.sql');
    console.log('   3. Then run: npm run db:seed');
  } else {
    console.log('\n🎉 All tables exist and are ready!');

    const totalRecords = existing.reduce((sum, [_, data]) => sum + (data.count || 0), 0);
    if (totalRecords === 0) {
      console.log('\n💡 Database is empty. Run: npm run db:seed');
    }
  }

  console.log('\n');
}

checkDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n💥 Error:', err);
    process.exit(1);
  });
