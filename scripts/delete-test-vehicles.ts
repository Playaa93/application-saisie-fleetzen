/**
 * Script to delete test vehicles with Unknown type
 * Run: npx tsx scripts/delete-test-vehicles.ts
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

async function deleteTestVehicles() {
  console.log('🗑️  Deleting test vehicles with Unknown type...\n');

  try {
    // Find vehicles with Unknown type
    const { data: unknownVehicles } = await supabase
      .from('vehicles')
      .select('id, license_plate, metadata')
      .is('metadata->vehicle_type', null);

    console.log(`Found ${unknownVehicles?.length || 0} vehicles with Unknown type:\n`);

    if (!unknownVehicles || unknownVehicles.length === 0) {
      console.log('✅ No test vehicles to delete\n');
      return;
    }

    // Display vehicles to delete
    unknownVehicles.forEach(v => {
      console.log(`  - ${v.license_plate}`);
    });

    console.log('\n🗑️  Deleting vehicles...\n');

    // Delete them
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .is('metadata->vehicle_type', null);

    if (error) {
      console.error('❌ Error deleting vehicles:', error.message);
      process.exit(1);
    }

    console.log(`✅ Deleted ${unknownVehicles.length} test vehicles\n`);

    // Final verification
    const { data: allVehicles } = await supabase
      .from('vehicles')
      .select('license_plate, vehicle_category, metadata')
      .order('license_plate');

    const byCategory = {
      tracteur: 0,
      porteur: 0,
      remorque: 0,
      autre: 0
    };

    const byType = {
      Fourgon: 0,
      Frigo: 0,
      Unknown: 0
    };

    allVehicles?.forEach(v => {
      const cat = v.vehicle_category || 'autre';
      byCategory[cat as keyof typeof byCategory]++;

      const type = v.metadata?.vehicle_type || 'Unknown';
      byType[type as keyof typeof byType]++;
    });

    console.log('📊 FINAL STATISTICS');
    console.log('─'.repeat(60));
    console.log('By Category:');
    console.log(`   🚛 Tracteurs: ${byCategory.tracteur}`);
    console.log(`   🚚 Porteurs: ${byCategory.porteur}`);
    console.log(`   📦 Remorques: ${byCategory.remorque}`);
    console.log(`   ❓ Autres: ${byCategory.autre}`);
    console.log('\nBy Type:');
    console.log(`   📦 Fourgon: ${byType.Fourgon}`);
    console.log(`   ❄️  Frigo: ${byType.Frigo}`);
    console.log(`   ❓ Unknown: ${byType.Unknown}`);
    console.log(`\n   📊 Total: ${allVehicles?.length || 0}\n`);

  } catch (error: any) {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  }
}

deleteTestVehicles()
  .then(() => {
    console.log('✅ Cleanup completed!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
