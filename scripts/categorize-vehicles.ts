/**
 * Script to categorize vehicles using Supabase REST API
 * Run: npx tsx scripts/categorize-vehicles.ts
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

async function categorizeVehicles() {
  console.log('🚗 Categorizing vehicles...\n');

  try {
    // Fetch all vehicles
    const { data: vehicles, error: fetchError } = await supabase
      .from('vehicles')
      .select('id, license_plate, make, model, vehicle_category')
      .order('license_plate');

    if (fetchError) {
      console.error('❌ Error fetching vehicles:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${vehicles?.length || 0} vehicles\n`);

    if (!vehicles || vehicles.length === 0) {
      console.log('No vehicles found');
      return;
    }

    // Auto-categorize based on vehicle model (you can adjust this logic)
    const categorizations = [
      { licensePlate: 'AB-123-CD', category: 'porteur' },  // Renault Master
      { licensePlate: 'EF-456-GH', category: 'porteur' },  // Peugeot Boxer
      { licensePlate: 'IJ-789-KL', category: 'porteur' },  // Mercedes Sprinter
      { licensePlate: 'MN-012-OP', category: 'porteur' },  // Iveco Daily
      { licensePlate: 'QR-345-ST', category: 'porteur' },  // Ford Transit
      { licensePlate: 'UV-678-WX', category: 'porteur' },  // Volkswagen Crafter
    ];

    console.log('📝 Applying categorizations:\n');

    for (const vehicle of vehicles) {
      const cat = categorizations.find(c => c.licensePlate === vehicle.license_plate);

      if (cat) {
        console.log(`   ${vehicle.license_plate} - ${vehicle.make} ${vehicle.model}`);
        console.log(`   → Setting category to: ${cat.category}`);

        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ vehicle_category: cat.category })
          .eq('id', vehicle.id);

        if (updateError) {
          console.error(`   ❌ Error updating ${vehicle.license_plate}:`, updateError);
        } else {
          console.log(`   ✅ Updated successfully\n`);
        }
      } else {
        console.log(`   ⚠️  ${vehicle.license_plate} - No categorization defined (skipped)\n`);
      }
    }

    // Verify
    console.log('\n📊 VERIFICATION\n');
    const { data: updated, error: verifyError } = await supabase
      .from('vehicles')
      .select('license_plate, make, model, vehicle_category')
      .order('license_plate');

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
      throw verifyError;
    }

    console.log('Final state:');
    updated?.forEach((v, idx) => {
      const status = v.vehicle_category ? '✅' : '⚠️';
      console.log(`${idx + 1}. ${status} ${v.license_plate} - ${v.make} ${v.model}`);
      console.log(`   Category: ${v.vehicle_category || 'NOT SET'}\n`);
    });

    const uncategorized = updated?.filter(v => !v.vehicle_category) || [];
    if (uncategorized.length === 0) {
      console.log('🎉 All vehicles are now categorized!\n');
    } else {
      console.log(`⚠️  ${uncategorized.length} vehicle(s) still need categorization\n`);
    }

  } catch (error: any) {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  }
}

categorizeVehicles()
  .then(() => {
    console.log('✅ Categorization completed!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
