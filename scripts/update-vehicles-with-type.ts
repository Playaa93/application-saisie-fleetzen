/**
 * Script to update vehicles with new Type field (Fourgon/Frigo)
 * Run: npx tsx scripts/update-vehicles-with-type.ts
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

async function updateVehicles() {
  console.log('🔄 Updating vehicles with Type field (Fourgon/Frigo)...\n');

  try {
    // Complete vehicle list with Type field
    const vehiclesData = [
      { client: 'VERTIGO', site: 'PMS', plate: 'GW-523-LF', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'EK-655-VR', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'FP-672-MT', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'FP-683-MT', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'FW-230-ST', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'FZ-043-BG', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GB-682-AK', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GC-334-ZQ', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GE-616-MQ', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GE-637-NF', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GF-146-KB', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GH-787-NV', type: 'Porteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'GM-867-RA', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FX-151-YA', type: 'Porteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'GV-624-WX', type: 'Porteur', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Barbery', plate: 'EG-184-AJ', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'GH-629-JV', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'GM-843-FV', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FM-155-YL', type: 'Remorque city', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FR-858-JB', type: 'Remorque city', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FW-888-YE', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FY-774-VS', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'FZ-785-HW', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'LIDL - Coudray', plate: 'W-700-AW', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GP-458-BD', type: 'Porteur', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GD-940-YS', type: 'Remorque', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'FG-115-NJ', type: 'Remorque city', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'EH-725-XC', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'FW-874-NQ', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'FY-758-VZ', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'FZ-040-BG', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GA-679-QR', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GA-781-PD', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GG-627-LD', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GM-871-RA', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GX-088-HP', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GX-511-NH', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GX-792-WG', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'PMS', plate: 'GX-870-HN', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'Relais', plate: 'FX-136-YA', type: 'Porteur', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'Relais', plate: 'GH-504-SC', type: 'Porteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'STG', plate: 'FZ-295-BW', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'STG', plate: 'GL-546-DC', type: 'Porteur', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'STG', plate: 'GL-610-QJ', type: 'Porteur', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'STG', plate: 'GL-668-EH', type: 'Porteur', vehicleType: 'Frigo' },
      { client: 'VERTIGO', site: 'STG', plate: 'GV-448-RM', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'VERTIGO', site: 'STG', plate: 'HD-320-LX', type: 'Porteur', vehicleType: 'Frigo' },
      { client: 'DCO Transport', site: 'LIDL - Barbery', plate: 'FE-919-YL', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'Mauffrey', site: 'LIDL - Chanteloup', plate: 'GG-479-XA', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'Mauffrey', site: 'LIDL - Chanteloup', plate: 'GX-738-TX', type: 'Tracteur', vehicleType: 'Fourgon' },
      // Nouveaux véhicules Mauffrey
      { client: 'Mauffrey', site: 'LIDL - Meaux', plate: 'GG-992-FN', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'Mauffrey', site: 'LIDL - Meaux', plate: 'GJ-479-PC', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'Mauffrey', site: 'LIDL - Chanteloup', plate: 'HB-069-MP', type: 'Tracteur', vehicleType: 'Fourgon' },
      { client: 'Mauffrey', site: 'LIDL - Meaux', plate: 'GG-479-XA', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'Mauffrey', site: 'LIDL - Meaux', plate: 'GY-279-GZ', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'Mauffrey', site: 'LIDL - Chanteloup', plate: 'GS-618-DR', type: 'Remorque', vehicleType: 'Frigo' },
      { client: 'Mauffrey', site: 'LIDL - Chanteloup', plate: 'GM-251-NY', type: 'Remorque', vehicleType: 'Frigo' },
    ];

    // Get client IDs
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, code');

    const clientMap: Record<string, string> = {};
    clients?.forEach(c => {
      clientMap[c.name] = c.id;
    });

    let updateCount = 0;
    let insertCount = 0;
    let skipCount = 0;

    for (const vData of vehiclesData) {
      const clientId = clientMap[vData.client];

      if (!clientId) {
        console.log(`⚠️  Client '${vData.client}' not found, skipping ${vData.plate}`);
        skipCount++;
        continue;
      }

      // Check if vehicle exists
      const { data: existing } = await supabase
        .from('vehicles')
        .select('id, metadata')
        .eq('license_plate', vData.plate)
        .single();

      if (existing) {
        // Update existing vehicle with Type field
        const { error } = await supabase
          .from('vehicles')
          .update({
            vehicle_category: mapTypology(vData.type),
            metadata: {
              ...(existing.metadata || {}),
              site: vData.site,
              original_type: vData.type,
              vehicle_type: vData.vehicleType // Fourgon ou Frigo
            }
          })
          .eq('id', existing.id);

        if (error) {
          console.error(`❌ Error updating ${vData.plate}:`, error.message);
        } else {
          console.log(`✅ Updated ${vData.plate} - ${vData.type} (${vData.vehicleType})`);
          updateCount++;
        }
      } else {
        // Insert new vehicle
        const { error } = await supabase
          .from('vehicles')
          .insert({
            client_id: clientId,
            license_plate: vData.plate,
            make: 'Generic',
            model: 'Truck',
            vehicle_category: mapTypology(vData.type),
            fuel_type: 'Diesel',
            is_active: true,
            metadata: {
              site: vData.site,
              original_type: vData.type,
              vehicle_type: vData.vehicleType
            }
          });

        if (error) {
          console.error(`❌ Error inserting ${vData.plate}:`, error.message);
        } else {
          console.log(`✅ Inserted ${vData.plate} - ${vData.type} (${vData.vehicleType})`);
          insertCount++;
        }
      }
    }

    console.log('\n\n📊 UPDATE SUMMARY');
    console.log('─'.repeat(60));
    console.log(`✅ Updated: ${updateCount} vehicles`);
    console.log(`➕ Inserted: ${insertCount} vehicles`);
    console.log(`⚠️  Skipped: ${skipCount} vehicles`);
    console.log('─'.repeat(60));

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

    console.log('\n📊 FINAL STATISTICS');
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

updateVehicles()
  .then(() => {
    console.log('✅ Update completed!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
