/**
 * Script to import real client and vehicle data
 * Run: npx tsx scripts/import-real-data.ts
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

// Map typologie to vehicle_category
function mapTypology(typologie: string): string {
  const lower = typologie.toLowerCase();
  if (lower.includes('tracteur')) return 'tracteur';
  if (lower.includes('porteur')) return 'porteur';
  if (lower.includes('remorque')) return 'remorque';
  return 'autre';
}

async function importRealData() {
  console.log('📦 Importing real client and vehicle data...\n');

  try {
    // Step 1: Create/Update Clients
    console.log('Step 1: Creating clients...\n');

    const clients = [
      { name: 'VERTIGO', code: 'VERTIGO', city: 'Paris' },
      { name: 'DCO Transport', code: 'DCO', city: 'Paris' },
      { name: 'Mauffrey', code: 'MAUFFREY', city: 'Lyon' },
      { name: 'NetEco', code: 'NETECO', city: 'Marseille' },
      { name: 'Intermarché', code: 'ITM', city: 'Paris' },
    ];

    const clientMap: Record<string, string> = {};

    for (const client of clients) {
      // Check if client already exists
      const { data: existing } = await supabase
        .from('clients')
        .select('id, code')
        .eq('code', client.code)
        .single();

      if (existing) {
        console.log(`   ✓ ${client.name} (${client.code}) - Already exists`);
        clientMap[client.name] = existing.id;
      } else {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            name: client.name,
            code: client.code,
            city: client.city,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error(`   ❌ Error creating ${client.name}:`, error);
        } else {
          console.log(`   ✅ Created ${client.name} (${client.code})`);
          clientMap[client.name] = data.id;
        }
      }
    }

    console.log('\n📊 Client mapping:');
    Object.entries(clientMap).forEach(([name, id]) => {
      console.log(`   ${name} → ${id}`);
    });

    // Step 2: Import Vehicles
    console.log('\n\nStep 2: Importing vehicles...\n');

    const vehicles = [
      { client: 'VERTIGO', site: 'PMS', plate: 'GW-523-LF', type: 'Tracteur', make: 'Renault', model: 'T460' },
      { client: 'VERTIGO', site: 'PMS', plate: 'EK-655-VR', type: 'Tracteur', make: 'Volvo', model: 'FH' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'FP-672-MT', type: 'Remorque', make: 'Schmitz', model: 'S.KO' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'FP-683-MT', type: 'Remorque', make: 'Schmitz', model: 'S.KO' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'FW-230-ST', type: 'Tracteur', make: 'DAF', model: 'XF' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'FZ-043-BG', type: 'Tracteur', make: 'Mercedes', model: 'Actros' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GB-682-AK', type: 'Tracteur', make: 'Scania', model: 'R450' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GC-334-ZQ', type: 'Remorque', make: 'Schmitz', model: 'S.KO' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GE-616-MQ', type: 'Remorque', make: 'Krone', model: 'SD' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GE-637-NF', type: 'Remorque', make: 'Krone', model: 'SD' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GF-146-KB', type: 'Remorque', make: 'Schmitz', model: 'S.KO' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GH-787-NV', type: 'Porteur', make: 'Renault', model: 'D-Wide' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GM-867-RA', type: 'Tracteur', make: 'Volvo', model: 'FH' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FX-151-YA', type: 'Porteur', make: 'Iveco', model: 'Eurocargo' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'GV-624-WX', type: 'Porteur', make: 'Mercedes', model: 'Atego' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'EG-184-AJ', type: 'Remorque', make: 'Schmitz', model: 'S.KO' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'GH-629-JV', type: 'Remorque', make: 'Krone', model: 'SD' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'GM-843-FV', type: 'Remorque', make: 'Schmitz', model: 'S.KO' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FM-155-YL', type: 'Remorque city', make: 'Schmitz', model: 'Urban' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FR-858-JB', type: 'Remorque city', make: 'Schmitz', model: 'Urban' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FW-888-YE', type: 'Tracteur', make: 'DAF', model: 'XF' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FY-774-VS', type: 'Tracteur', make: 'Volvo', model: 'FH' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FZ-785-HW', type: 'Tracteur', make: 'Scania', model: 'R450' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'W-700-AW', type: 'Tracteur', make: 'Mercedes', model: 'Actros' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GP-458-BD', type: 'Porteur', make: 'Renault', model: 'D-Wide' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GD-940-YS', type: 'Remorque', make: 'Schmitz', model: 'S.KO' },
      { client: 'VERTIGO', site: 'PMS', plate: 'FG-115-NJ', type: 'Remorque city', make: 'Schmitz', model: 'Urban' },
      { client: 'VERTIGO', site: 'PMS', plate: 'EH-725-XC', type: 'Tracteur', make: 'DAF', model: 'XF' },
      { client: 'VERTIGO', site: 'PMS', plate: 'FW-874-NQ', type: 'Tracteur', make: 'Volvo', model: 'FH' },
      { client: 'VERTIGO', site: 'PMS', plate: 'FY-758-VZ', type: 'Tracteur', make: 'Scania', model: 'R450' },
      { client: 'VERTIGO', site: 'PMS', plate: 'FZ-040-BG', type: 'Tracteur', make: 'Mercedes', model: 'Actros' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GA-679-QR', type: 'Tracteur', make: 'DAF', model: 'XF' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GA-781-PD', type: 'Tracteur', make: 'Volvo', model: 'FH' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GG-627-LD', type: 'Tracteur', make: 'Scania', model: 'R450' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GM-871-RA', type: 'Tracteur', make: 'Mercedes', model: 'Actros' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GX-088-HP', type: 'Tracteur', make: 'DAF', model: 'XF' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GX-511-NH', type: 'Tracteur', make: 'Volvo', model: 'FH' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GX-792-WG', type: 'Tracteur', make: 'Scania', model: 'R450' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GX-870-HN', type: 'Tracteur', make: 'Mercedes', model: 'Actros' },
      { client: 'VERTIGO', site: 'Relais', plate: 'FX-136-YA', type: 'Porteur', make: 'Renault', model: 'D-Wide' },
      { client: 'VERTIGO', site: 'Relais', plate: 'GH-504-SC', type: 'Porteur', make: 'Iveco', model: 'Eurocargo' },
      { client: 'VERTIGO', site: 'STG', plate: 'FZ-295-BW', type: 'Remorque', make: 'Schmitz', model: 'S.KO' },
      { client: 'VERTIGO', site: 'STG', plate: 'GL-546-DC', type: 'Porteur', make: 'Mercedes', model: 'Atego' },
      { client: 'VERTIGO', site: 'STG', plate: 'GL-610-QJ', type: 'Porteur', make: 'Renault', model: 'D-Wide' },
      { client: 'VERTIGO', site: 'STG', plate: 'GL-668-EH', type: 'Porteur', make: 'Iveco', model: 'Eurocargo' },
      { client: 'VERTIGO', site: 'STG', plate: 'GV-448-RM', type: 'Tracteur', make: 'DAF', model: 'XF' },
      { client: 'VERTIGO', site: 'STG', plate: 'HD-320-LX', type: 'Porteur', make: 'Mercedes', model: 'Atego' },
      { client: 'DCO Transport', site: 'LIDL - Barbery', plate: 'FE-919-YL', type: 'Tracteur', make: 'Volvo', model: 'FH' },
      { client: 'Mauffrey', site: 'LIDL - Chanteloup', plate: 'GG-479-XA', type: 'Remorque', make: 'Schmitz', model: 'S.KO' },
      { client: 'Mauffrey', site: 'LIDL - Chanteloup', plate: 'GX-738-TX', type: 'Tracteur', make: 'DAF', model: 'XF' },
    ];

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const vehicle of vehicles) {
      const clientId = clientMap[vehicle.client];

      if (!clientId) {
        console.log(`   ⚠️  Skipping ${vehicle.plate} - Client '${vehicle.client}' not found`);
        skippedCount++;
        continue;
      }

      // Check if vehicle already exists
      const { data: existing } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', vehicle.plate)
        .single();

      if (existing) {
        console.log(`   ✓ ${vehicle.plate} - Already exists`);
        skippedCount++;
        continue;
      }

      // Insert vehicle
      const { error } = await supabase
        .from('vehicles')
        .insert({
          client_id: clientId,
          license_plate: vehicle.plate,
          make: vehicle.make,
          model: vehicle.model,
          vehicle_category: mapTypology(vehicle.type),
          fuel_type: 'Diesel',
          is_active: true,
          metadata: {
            site: vehicle.site,
            original_type: vehicle.type
          }
        });

      if (error) {
        console.error(`   ❌ Error importing ${vehicle.plate}:`, error.message);
        errorCount++;
      } else {
        console.log(`   ✅ ${vehicle.plate} - ${vehicle.make} ${vehicle.model} (${vehicle.type})`);
        successCount++;
      }
    }

    console.log('\n\n📊 IMPORT SUMMARY');
    console.log('─'.repeat(60));
    console.log(`✅ Imported: ${successCount} vehicles`);
    console.log(`✓  Skipped: ${skippedCount} vehicles (already exist)`);
    console.log(`❌ Errors: ${errorCount} vehicles`);
    console.log('─'.repeat(60));

    // Final verification
    console.log('\n📊 FINAL VERIFICATION\n');

    const { data: allVehicles } = await supabase
      .from('vehicles')
      .select('license_plate, make, model, vehicle_category')
      .order('license_plate');

    const byCategory = {
      tracteur: 0,
      porteur: 0,
      remorque: 0,
      autre: 0
    };

    allVehicles?.forEach(v => {
      const cat = v.vehicle_category || 'autre';
      byCategory[cat as keyof typeof byCategory]++;
    });

    console.log('Vehicles by category:');
    console.log(`   🚛 Tracteurs: ${byCategory.tracteur}`);
    console.log(`   🚚 Porteurs: ${byCategory.porteur}`);
    console.log(`   📦 Remorques: ${byCategory.remorque}`);
    console.log(`   ❓ Autres: ${byCategory.autre}`);
    console.log(`   📊 Total: ${allVehicles?.length || 0}\n`);

    console.log('✅ Import completed!\n');

  } catch (error: any) {
    console.error('\n💥 Error during import:', error.message);
    process.exit(1);
  }
}

importRealData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
