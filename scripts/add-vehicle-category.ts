/**
 * Script to add vehicle_category column to vehicles table
 * Run: npx tsx scripts/add-vehicle-category.ts
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

async function addVehicleCategory() {
  console.log('🔧 Adding vehicle_category column to vehicles table...\n');

  try {
    // Step 1: Create ENUM type (via raw SQL)
    console.log('Step 1: Creating vehicle_category ENUM type...');
    const { error: enumError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ BEGIN
          CREATE TYPE vehicle_category AS ENUM ('tracteur', 'porteur', 'remorque', 'ensemble_complet', 'autre');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
    });

    if (enumError) {
      console.log('⚠️  ENUM might already exist, continuing...');
    } else {
      console.log('✅ ENUM type created\n');
    }

    // Step 2: Add column to vehicles table
    console.log('Step 2: Adding vehicle_category column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE vehicles
        ADD COLUMN IF NOT EXISTS vehicle_category vehicle_category;
      `
    });

    if (alterError) {
      console.error('❌ Error adding column:', alterError);
      throw alterError;
    }
    console.log('✅ Column added\n');

    // Step 3: Create index
    console.log('Step 3: Creating index on vehicle_category...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_vehicles_category
        ON vehicles(vehicle_category);
      `
    });

    if (indexError) {
      console.error('❌ Error creating index:', indexError);
      throw indexError;
    }
    console.log('✅ Index created\n');

    // Step 4: Fetch current vehicles to categorize
    console.log('Step 4: Fetching existing vehicles...');
    const { data: vehicles, error: fetchError } = await supabase
      .from('vehicles')
      .select('id, license_plate, make, model, vehicle_category')
      .order('license_plate');

    if (fetchError) {
      console.error('❌ Error fetching vehicles:', fetchError);
      throw fetchError;
    }

    console.log(`\n📊 Found ${vehicles?.length || 0} vehicles:\n`);

    if (vehicles && vehicles.length > 0) {
      vehicles.forEach((v, idx) => {
        console.log(`${idx + 1}. ${v.license_plate} - ${v.make} ${v.model}`);
        console.log(`   Category: ${v.vehicle_category || '(not set)'}\n`);
      });

      console.log('\n💡 NEXT STEPS:');
      console.log('   You need to manually categorize each vehicle.');
      console.log('   Run this SQL in Supabase SQL Editor:\n');
      console.log('   UPDATE vehicles SET vehicle_category = \'tracteur\' WHERE license_plate = \'XX-XXX-XX\';');
      console.log('   UPDATE vehicles SET vehicle_category = \'remorque\' WHERE license_plate = \'YY-YYY-YY\';');
      console.log('   UPDATE vehicles SET vehicle_category = \'porteur\' WHERE license_plate = \'ZZ-ZZZ-ZZ\';\n');
    }

    console.log('✅ Migration completed successfully!\n');

  } catch (error: any) {
    console.error('\n💥 Error during migration:', error.message);
    process.exit(1);
  }
}

addVehicleCategory()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
