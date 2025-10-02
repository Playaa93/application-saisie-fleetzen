/**
 * Script to clean up all test data (vehicles, clients, interventions)
 * Run: npx tsx scripts/cleanup-test-data.ts
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

// Real production clients
const REAL_CLIENTS = ['VERTIGO', 'DCO Transport', 'Mauffrey', 'NetEco', 'Intermarché'];

async function cleanupTestData() {
  console.log('🗑️  Cleaning up test data...\n');

  try {
    // Step 1: Delete test vehicles (Unknown type)
    console.log('1️⃣ Deleting test vehicles with Unknown type...');
    const { data: unknownVehicles } = await supabase
      .from('vehicles')
      .select('id, license_plate')
      .is('metadata->vehicle_type', null);

    if (unknownVehicles && unknownVehicles.length > 0) {
      console.log('   Found ' + unknownVehicles.length + ' test vehicles:');
      unknownVehicles.forEach(v => console.log('   - ' + v.license_plate));
      
      const { error: deleteVehiclesError } = await supabase
        .from('vehicles')
        .delete()
        .is('metadata->vehicle_type', null);

      if (deleteVehiclesError) {
        console.error('❌ Error deleting vehicles:', deleteVehiclesError.message);
      } else {
        console.log('   ✅ Deleted ' + unknownVehicles.length + ' test vehicles\n');
      }
    } else {
      console.log('   ✅ No test vehicles to delete\n');
    }

    // Step 2: Delete test clients
    console.log('2️⃣ Deleting test clients...');
    const { data: allClients } = await supabase
      .from('clients')
      .select('id, name, code');

    const testClients = allClients?.filter(c => !REAL_CLIENTS.includes(c.name)) || [];

    if (testClients.length > 0) {
      console.log('   Found ' + testClients.length + ' test clients:');
      testClients.forEach(c => console.log('   - ' + c.name + ' (' + c.code + ')'));

      for (const client of testClients) {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', client.id);

        if (error) {
          console.error('   ❌ Error deleting ' + client.name + ':', error.message);
        } else {
          console.log('   ✅ Deleted ' + client.name);
        }
      }
      console.log('');
    } else {
      console.log('   ✅ No test clients to delete\n');
    }

    // Step 3: Delete test interventions (duplicates)
    console.log('3️⃣ Checking for duplicate interventions...');
    const { data: interventions } = await supabase
      .from('interventions')
      .select('id, intervention_type_id, client_id, created_at')
      .order('created_at', { ascending: false });

    if (interventions && interventions.length > 5) {
      // Group by type and client to find duplicates
      const groups = new Map();
      interventions.forEach(i => {
        const key = i.intervention_type_id + '-' + i.client_id;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key).push(i);
      });

      // Find groups with duplicates
      const duplicateIds: string[] = [];
      groups.forEach(group => {
        if (group.length > 1) {
          // Keep the first one, delete the rest
          group.slice(1).forEach((i: any) => duplicateIds.push(i.id));
        }
      });

      if (duplicateIds.length > 0) {
        console.log('   Found ' + duplicateIds.length + ' duplicate interventions');
        
        const { error } = await supabase
          .from('interventions')
          .delete()
          .in('id', duplicateIds);

        if (error) {
          console.error('   ❌ Error deleting duplicates:', error.message);
        } else {
          console.log('   ✅ Deleted ' + duplicateIds.length + ' duplicate interventions\n');
        }
      } else {
        console.log('   ✅ No duplicate interventions found\n');
      }
    } else {
      console.log('   ✅ No duplicate interventions found\n');
    }

    // Final statistics
    console.log('📊 FINAL STATISTICS');
    console.log('─'.repeat(60));

    const { data: finalClients } = await supabase
      .from('clients')
      .select('name, code');
    const clientCount = finalClients?.length || 0;
    console.log('\n👥 Clients (' + clientCount + '):');
    finalClients?.forEach(c => console.log('   - ' + c.name + ' (' + c.code + ')'));

    const { data: finalVehicles } = await supabase
      .from('vehicles')
      .select('license_plate, vehicle_category, metadata');

    const byCategory = { tracteur: 0, porteur: 0, remorque: 0, autre: 0 };
    const byType = { Fourgon: 0, Frigo: 0, Unknown: 0 };

    finalVehicles?.forEach(v => {
      const cat = v.vehicle_category || 'autre';
      byCategory[cat as keyof typeof byCategory]++;
      const type = v.metadata?.vehicle_type || 'Unknown';
      byType[type as keyof typeof byType]++;
    });

    const vehicleCount = finalVehicles?.length || 0;
    console.log('\n🚗 Vehicles (' + vehicleCount + '):');
    console.log('   By Category:');
    console.log('     🚛 Tracteurs: ' + byCategory.tracteur);
    console.log('     🚚 Porteurs: ' + byCategory.porteur);
    console.log('     📦 Remorques: ' + byCategory.remorque);
    console.log('     ❓ Autres: ' + byCategory.autre);
    console.log('   By Type:');
    console.log('     📦 Fourgon: ' + byType.Fourgon);
    console.log('     ❄️  Frigo: ' + byType.Frigo);
    console.log('     ❓ Unknown: ' + byType.Unknown);

    const { data: finalInterventions } = await supabase
      .from('interventions')
      .select('id');
    const interventionCount = finalInterventions?.length || 0;
    console.log('\n📝 Interventions: ' + interventionCount + '\n');

  } catch (error: any) {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  }
}

cleanupTestData()
  .then(() => {
    console.log('✅ Cleanup completed!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
