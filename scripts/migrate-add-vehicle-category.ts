/**
 * Migration script to add vehicle_category column to vehicles table
 * Run: npx tsx scripts/migrate-add-vehicle-category.ts
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

async function executeSQLMigration() {
  console.log('🚀 Starting migration: Add vehicle_category column\n');
  console.log(`📍 URL: ${supabaseUrl}\n`);

  try {
    // Step 1: Create ENUM type and add column via raw SQL
    console.log('Step 1: Creating ENUM type and adding column...');

    const sqlStatements = `
      -- Create ENUM type if not exists
      DO $$ BEGIN
        CREATE TYPE vehicle_category AS ENUM ('tracteur', 'porteur', 'remorque', 'ensemble_complet', 'autre');
      EXCEPTION
        WHEN duplicate_object THEN
          RAISE NOTICE 'Type vehicle_category already exists, skipping...';
      END $$;

      -- Add column if not exists
      ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS vehicle_category vehicle_category;

      -- Create index
      CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(vehicle_category);
    `;

    // Supabase doesn't have a direct SQL execution endpoint via JS client
    // We'll use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sqlStatements })
    });

    if (!response.ok) {
      // If RPC doesn't exist, we'll do it manually via table operations
      console.log('⚠️  Direct SQL execution not available via REST API');
      console.log('ℹ️  You need to run the SQL manually in Supabase SQL Editor\n');
      console.log('📋 Copy this SQL and execute it in Supabase:\n');
      console.log('─'.repeat(60));
      console.log(sqlStatements);
      console.log('─'.repeat(60));
      console.log('\n✅ After running the SQL, re-run this script to categorize vehicles\n');

      // Check if column exists by trying to query it
      const { error: testError } = await supabase
        .from('vehicles')
        .select('vehicle_category')
        .limit(1);

      if (testError) {
        console.log('❌ Column vehicle_category does not exist yet');
        console.log('   Please run the SQL above in Supabase SQL Editor first\n');
        process.exit(1);
      } else {
        console.log('✅ Column vehicle_category already exists!\n');
      }
    } else {
      console.log('✅ Migration SQL executed successfully!\n');
    }

    // Step 2: Fetch all vehicles
    console.log('Step 2: Fetching all vehicles...');
    const { data: vehicles, error: fetchError } = await supabase
      .from('vehicles')
      .select('id, license_plate, make, model, vehicle_category, client_id')
      .order('license_plate');

    if (fetchError) {
      console.error('❌ Error fetching vehicles:', fetchError);
      throw fetchError;
    }

    console.log(`\n📊 Found ${vehicles?.length || 0} vehicles:\n`);

    if (vehicles && vehicles.length > 0) {
      vehicles.forEach((v, idx) => {
        const status = v.vehicle_category ? '✅' : '⚠️';
        const category = v.vehicle_category || 'NOT SET';
        console.log(`${idx + 1}. ${status} ${v.license_plate} - ${v.make} ${v.model}`);
        console.log(`   Category: ${category}\n`);
      });

      // Check if all are categorized
      const uncategorized = vehicles.filter(v => !v.vehicle_category);

      if (uncategorized.length > 0) {
        console.log('\n⚠️  MANUAL CATEGORIZATION NEEDED');
        console.log('─'.repeat(60));
        console.log('Copy and execute these UPDATE statements in Supabase SQL Editor:\n');

        uncategorized.forEach(v => {
          console.log(`-- ${v.license_plate} - ${v.make} ${v.model}`);
          console.log(`UPDATE vehicles SET vehicle_category = 'tracteur' WHERE id = '${v.id}';`);
          console.log('-- Options: tracteur, porteur, remorque, ensemble_complet, autre\n');
        });

        console.log('─'.repeat(60));
        console.log('\nℹ️  Choose the appropriate category for each vehicle:');
        console.log('   • tracteur    - Tractor unit');
        console.log('   • porteur     - Truck carrier');
        console.log('   • remorque    - Trailer');
        console.log('   • ensemble_complet - Complete truck+trailer set');
        console.log('   • autre       - Other vehicle type\n');
      } else {
        console.log('✅ All vehicles are categorized!\n');
      }

      // Verification query
      console.log('\n📊 VERIFICATION QUERY');
      console.log('─'.repeat(60));
      console.log(`SELECT
  license_plate,
  make,
  model,
  vehicle_category,
  CASE
    WHEN vehicle_category IS NULL THEN '⚠️ NEEDS CATEGORIZATION'
    ELSE '✅ OK'
  END as status
FROM vehicles
ORDER BY license_plate;`);
      console.log('─'.repeat(60));
    }

    console.log('\n✅ Migration script completed!\n');

  } catch (error: any) {
    console.error('\n💥 Error during migration:', error.message);
    process.exit(1);
  }
}

executeSQLMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
