/**
 * Database Seed File using Supabase Client
 * Seeds the database with initial data for testing and development
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { hashPassword } from '../lib/auth';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  console.log('🌱 Starting database seed with Supabase client...');

  try {
    // ========================================================================
    // 1. AGENTS
    // ========================================================================
    console.log('👤 Seeding agents...');

    const agentsData = [
      {
        email: 'admin@fleetzen.com',
        first_name: 'Marie',
        last_name: 'Dubois',
        phone: '+33612345678',
        role: 'admin',
        password_hash: await hashPassword('admin123'),
        metadata: {
          certifications: ['ISO 9001', 'Safety Level 3'],
          regions: ['Île-de-France', 'Hauts-de-France'],
        },
      },
      {
        email: 'supervisor@fleetzen.com',
        first_name: 'Pierre',
        last_name: 'Martin',
        phone: '+33623456789',
        role: 'supervisor',
        password_hash: await hashPassword('supervisor123'),
        metadata: {
          certifications: ['Team Lead'],
          regions: ['Île-de-France'],
        },
      },
      {
        email: 'jean.dupont@fleetzen.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        phone: '+33634567890',
        role: 'field_agent',
        password_hash: await hashPassword('agent123'),
        metadata: {
          certifications: ['Fuel Handling', 'Vehicle Maintenance'],
          equipment: ['Mobile Scanner', 'Fuel Meter'],
        },
      },
      {
        email: 'sophie.bernard@fleetzen.com',
        first_name: 'Sophie',
        last_name: 'Bernard',
        phone: '+33645678901',
        role: 'field_agent',
        password_hash: await hashPassword('agent123'),
        metadata: {
          certifications: ['Fuel Handling', 'Tank Refill Specialist'],
          equipment: ['Mobile Scanner', 'Pressure Gauge'],
        },
      },
    ];

    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .insert(agentsData)
      .select();

    if (agentsError) throw agentsError;
    console.log(`✅ Created ${agents.length} agents`);

    // ========================================================================
    // 2. CLIENTS
    // ========================================================================
    console.log('🏢 Seeding clients...');

    const clientsData = [
      {
        name: 'Transport Express Paris',
        code: 'TEP',
        address: '15 Avenue des Champs-Élysées',
        city: 'Paris',
        postal_code: '75008',
        contact_name: 'Jacques Rousseau',
        contact_email: 'j.rousseau@transportexpress.fr',
        contact_phone: '+33140123456',
        coordinates: { lat: 48.8698, lng: 2.3078 },
      },
      {
        name: 'Logistique Lyon',
        code: 'LL',
        address: '42 Rue de la République',
        city: 'Lyon',
        postal_code: '69002',
        contact_name: 'Marie Lemoine',
        contact_email: 'm.lemoine@logistiquelyon.fr',
        contact_phone: '+33478234567',
        coordinates: { lat: 45.7640, lng: 4.8357 },
      },
      {
        name: 'Services Marseille',
        code: 'SM',
        address: '88 La Canebière',
        city: 'Marseille',
        postal_code: '13001',
        contact_name: 'Pierre Dubois',
        contact_email: 'p.dubois@servicesmarseille.fr',
        contact_phone: '+33491345678',
        coordinates: { lat: 43.2965, lng: 5.3698 },
      },
    ];

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .insert(clientsData)
      .select();

    if (clientsError) throw clientsError;
    console.log(`✅ Created ${clients.length} clients`);

    // ========================================================================
    // 3. VEHICLES
    // ========================================================================
    console.log('🚛 Seeding vehicles...');

    const vehiclesData = [
      {
        client_id: clients[0].id,
        license_plate: 'AB-123-CD',
        make: 'Renault',
        model: 'Master',
        year: 2022,
        fuel_type: 'Diesel',
        tank_capacity: 105,
      },
      {
        client_id: clients[0].id,
        license_plate: 'EF-456-GH',
        make: 'Peugeot',
        model: 'Boxer',
        year: 2021,
        fuel_type: 'Diesel',
        tank_capacity: 90,
      },
      {
        client_id: clients[1].id,
        license_plate: 'IJ-789-KL',
        make: 'Mercedes',
        model: 'Sprinter',
        year: 2023,
        fuel_type: 'Diesel',
        tank_capacity: 100,
      },
      {
        client_id: clients[1].id,
        license_plate: 'MN-012-OP',
        make: 'Iveco',
        model: 'Daily',
        year: 2022,
        fuel_type: 'Diesel',
        tank_capacity: 85,
      },
      {
        client_id: clients[2].id,
        license_plate: 'QR-345-ST',
        make: 'Ford',
        model: 'Transit',
        year: 2021,
        fuel_type: 'Diesel',
        tank_capacity: 80,
      },
      {
        client_id: clients[2].id,
        license_plate: 'UV-678-WX',
        make: 'Volkswagen',
        model: 'Crafter',
        year: 2023,
        fuel_type: 'Diesel',
        tank_capacity: 75,
      },
    ];

    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .insert(vehiclesData)
      .select();

    if (vehiclesError) throw vehiclesError;
    console.log(`✅ Created ${vehicles.length} vehicles`);

    // ========================================================================
    // 4. INTERVENTION TYPES
    // ========================================================================
    console.log('📋 Seeding intervention types...');

    const interventionTypesData = [
      {
        name: 'Lavage Véhicule',
        code: 'LAVAGE',
        description: 'Lavage complet ou extérieur du véhicule',
        icon: 'Droplets',
        color: '#14B8A6',
        requires_vehicle: true,
        requires_photos: true,
        min_photos: 2,
      },
      {
        name: 'Livraison Carburant',
        code: 'CARBURANT_LIVRAISON',
        description: 'Livraison de carburant au véhicule',
        icon: 'Fuel',
        color: '#F59E0B',
        requires_vehicle: true,
        requires_photos: true,
        min_photos: 2,
      },
      {
        name: 'Remplissage Cuve',
        code: 'CARBURANT_CUVE',
        description: 'Remplissage de cuve fixe',
        icon: 'Container',
        color: '#8B5CF6',
        requires_vehicle: false,
        requires_photos: true,
        min_photos: 3,
      },
    ];

    const { data: interventionTypes, error: typesError } = await supabase
      .from('intervention_types')
      .insert(interventionTypesData)
      .select();

    if (typesError) throw typesError;
    console.log(`✅ Created ${interventionTypes.length} intervention types`);

    // ========================================================================
    // 5. INTERVENTION FIELDS (Dynamic Fields)
    // ========================================================================
    console.log('📝 Seeding intervention fields...');

    const fieldsData = [
      // LAVAGE fields
      {
        intervention_type_id: interventionTypes[0].id,
        name: 'Type de lavage',
        code: 'type_lavage',
        field_type: 'select',
        is_required: true,
        sort_order: 1,
        validation_rules: {
          options: ['Complet', 'Extérieur', 'Intérieur'],
        },
      },
      {
        intervention_type_id: interventionTypes[0].id,
        name: 'Observations',
        code: 'observations',
        field_type: 'text',
        is_required: false,
        sort_order: 2,
        placeholder: 'Notes sur le lavage...',
      },
      // CARBURANT_LIVRAISON fields
      {
        intervention_type_id: interventionTypes[1].id,
        name: 'Quantité (L)',
        code: 'quantite',
        field_type: 'number',
        is_required: true,
        sort_order: 1,
        validation_rules: { min: 1, max: 1000 },
      },
      {
        intervention_type_id: interventionTypes[1].id,
        name: 'Type de carburant',
        code: 'type_carburant',
        field_type: 'select',
        is_required: true,
        sort_order: 2,
        validation_rules: {
          options: ['Gazole', 'SP95', 'SP98', 'E85', 'GNV'],
        },
      },
      {
        intervention_type_id: interventionTypes[1].id,
        name: 'Compteur avant',
        code: 'compteur_avant',
        field_type: 'number',
        is_required: false,
        sort_order: 3,
        help_text: 'Relevé du compteur avant livraison',
      },
      {
        intervention_type_id: interventionTypes[1].id,
        name: 'Compteur après',
        code: 'compteur_apres',
        field_type: 'number',
        is_required: false,
        sort_order: 4,
        help_text: 'Relevé du compteur après livraison',
      },
      // CARBURANT_CUVE fields
      {
        intervention_type_id: interventionTypes[2].id,
        name: 'Identifiant cuve',
        code: 'id_cuve',
        field_type: 'text',
        is_required: true,
        sort_order: 1,
        placeholder: 'CUVE-XXX',
      },
      {
        intervention_type_id: interventionTypes[2].id,
        name: 'Quantité (L)',
        code: 'quantite',
        field_type: 'number',
        is_required: true,
        sort_order: 2,
        validation_rules: { min: 100, max: 50000 },
      },
      {
        intervention_type_id: interventionTypes[2].id,
        name: 'Type de carburant',
        code: 'type_carburant',
        field_type: 'select',
        is_required: true,
        sort_order: 3,
        validation_rules: {
          options: ['Gazole', 'Fioul', 'GNR'],
        },
      },
      {
        intervention_type_id: interventionTypes[2].id,
        name: 'Niveau avant (%)',
        code: 'niveau_avant',
        field_type: 'number',
        is_required: false,
        sort_order: 4,
        validation_rules: { min: 0, max: 100 },
      },
      {
        intervention_type_id: interventionTypes[2].id,
        name: 'Niveau après (%)',
        code: 'niveau_apres',
        field_type: 'number',
        is_required: false,
        sort_order: 5,
        validation_rules: { min: 0, max: 100 },
      },
    ];

    const { data: fields, error: fieldsError } = await supabase
      .from('intervention_fields')
      .insert(fieldsData)
      .select();

    if (fieldsError) throw fieldsError;
    console.log(`✅ Created ${fields.length} intervention fields`);

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${agents.length} agents`);
    console.log(`   - ${clients.length} clients`);
    console.log(`   - ${vehicles.length} vehicles`);
    console.log(`   - ${interventionTypes.length} intervention types`);
    console.log(`   - ${fields.length} dynamic fields`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => {
    console.log('\n✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed script failed:', error);
    process.exit(1);
  });
