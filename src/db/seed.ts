/**
 * Database Seed File
 * Seeds the database with initial data for testing and development
 *
 * Includes:
 * - 3 intervention types (Lavage, Carburant, Remplissage cuve)
 * - Sample agents (admin, supervisor, field agents)
 * - Sample clients and vehicles
 * - Dynamic fields for each intervention type
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { hashPassword } from '../lib/auth';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // ========================================================================
    // 1. AGENTS
    // ========================================================================
    console.log('👤 Seeding agents...');

    const [admin, supervisor, agent1, agent2] = await db
      .insert(schema.agents)
      .values([
        {
          email: 'admin@fleetzen.com',
          firstName: 'Marie',
          lastName: 'Dubois',
          phone: '+33612345678',
          role: 'admin',
          passwordHash: await hashPassword('admin123'), // Change in production!
          metadata: {
            certifications: ['ISO 9001', 'Safety Level 3'],
            regions: ['Île-de-France', 'Hauts-de-France'],
          },
        },
        {
          email: 'supervisor@fleetzen.com',
          firstName: 'Pierre',
          lastName: 'Martin',
          phone: '+33623456789',
          role: 'supervisor',
          passwordHash: await hashPassword('super123'),
          metadata: {
            certifications: ['Team Lead'],
            regions: ['Île-de-France'],
          },
        },
        {
          email: 'jean.dupont@fleetzen.com',
          firstName: 'Jean',
          lastName: 'Dupont',
          phone: '+33634567890',
          role: 'field_agent',
          passwordHash: await hashPassword('agent123'),
          metadata: {
            certifications: ['Fuel Handling', 'Vehicle Maintenance'],
            equipment: ['Mobile Scanner', 'Fuel Meter'],
          },
        },
        {
          email: 'sophie.bernard@fleetzen.com',
          firstName: 'Sophie',
          lastName: 'Bernard',
          phone: '+33645678901',
          role: 'field_agent',
          passwordHash: await hashPassword('agent123'),
          metadata: {
            certifications: ['Fuel Handling', 'Tank Refill Specialist'],
            equipment: ['Mobile Scanner', 'Pressure Gauge'],
          },
        },
      ])
      .returning();

    console.log(`✅ Created ${4} agents`);

    // ========================================================================
    // 2. CLIENTS
    // ========================================================================
    console.log('🏢 Seeding clients...');

    const [client1, client2, client3] = await db
      .insert(schema.clients)
      .values([
        {
          name: 'Transport Rapide SARL',
          code: 'TR001',
          address: '15 Rue de la Logistique',
          city: 'Paris',
          postalCode: '75012',
          country: 'France',
          contactName: 'Michel Leblanc',
          contactEmail: 'michel@transport-rapide.fr',
          contactPhone: '+33156789012',
          coordinates: { lat: 48.8566, lng: 2.3522 },
          metadata: {
            contractType: 'Premium',
            invoicingFrequency: 'monthly',
            notes: 'VIP client - priority service',
          },
        },
        {
          name: 'Logistics Express',
          code: 'LE002',
          address: '42 Avenue des Transporteurs',
          city: 'Lyon',
          postalCode: '69003',
          country: 'France',
          contactName: 'Catherine Moreau',
          contactEmail: 'contact@logistics-express.fr',
          contactPhone: '+33478901234',
          coordinates: { lat: 45.7640, lng: 4.8357 },
          metadata: {
            contractType: 'Standard',
            invoicingFrequency: 'quarterly',
          },
        },
        {
          name: 'Fleet Services Pro',
          code: 'FSP003',
          address: '8 Boulevard de l\'Industrie',
          city: 'Marseille',
          postalCode: '13008',
          country: 'France',
          contactName: 'Alain Rousseau',
          contactEmail: 'alain@fleet-services.fr',
          contactPhone: '+33491012345',
          coordinates: { lat: 43.2965, lng: 5.3698 },
          metadata: {
            contractType: 'Enterprise',
            invoicingFrequency: 'monthly',
            fleetSize: 50,
          },
        },
      ])
      .returning();

    console.log(`✅ Created ${3} clients`);

    // ========================================================================
    // 3. VEHICLES
    // ========================================================================
    console.log('🚗 Seeding vehicles...');

    const vehicles = await db
      .insert(schema.vehicles)
      .values([
        // Transport Rapide SARL vehicles
        {
          clientId: client1.id,
          licensePlate: 'AB-123-CD',
          make: 'Renault',
          model: 'Master',
          year: 2022,
          vin: 'VF1MA000012345678',
          fuelType: 'Diesel',
          tankCapacity: 80,
          metadata: {
            department: 'Delivery',
            lastServiceDate: '2025-09-15',
            mileage: 45000,
          },
        },
        {
          clientId: client1.id,
          licensePlate: 'EF-456-GH',
          make: 'Peugeot',
          model: 'Boxer',
          year: 2021,
          vin: 'VF3YA000012345679',
          fuelType: 'Diesel',
          tankCapacity: 90,
          metadata: {
            department: 'Long Distance',
            lastServiceDate: '2025-08-20',
            mileage: 72000,
          },
        },
        // Logistics Express vehicles
        {
          clientId: client2.id,
          licensePlate: 'IJ-789-KL',
          make: 'Citroën',
          model: 'Jumper',
          year: 2023,
          vin: 'VF7YA000012345680',
          fuelType: 'Diesel',
          tankCapacity: 75,
          metadata: {
            department: 'Urban Delivery',
            lastServiceDate: '2025-09-01',
            mileage: 28000,
          },
        },
        {
          clientId: client2.id,
          licensePlate: 'MN-012-OP',
          make: 'Mercedes-Benz',
          model: 'Sprinter',
          year: 2022,
          vin: 'WDB9060011234567',
          fuelType: 'Diesel',
          tankCapacity: 100,
          metadata: {
            department: 'Regional',
            lastServiceDate: '2025-09-10',
            mileage: 55000,
          },
        },
        // Fleet Services Pro vehicles
        {
          clientId: client3.id,
          licensePlate: 'QR-345-ST',
          make: 'Iveco',
          model: 'Daily',
          year: 2023,
          vin: 'ZCFC35A0012345681',
          fuelType: 'Diesel',
          tankCapacity: 110,
          metadata: {
            department: 'Heavy Duty',
            lastServiceDate: '2025-09-05',
            mileage: 35000,
          },
        },
        {
          clientId: client3.id,
          licensePlate: 'UV-678-WX',
          make: 'Ford',
          model: 'Transit',
          year: 2021,
          vin: 'WF0XXXGCDXKW12345',
          fuelType: 'Diesel',
          tankCapacity: 80,
          metadata: {
            department: 'Service',
            lastServiceDate: '2025-08-28',
            mileage: 61000,
          },
        },
      ])
      .returning();

    console.log(`✅ Created ${vehicles.length} vehicles`);

    // ========================================================================
    // 4. INTERVENTION TYPES
    // ========================================================================
    console.log('📋 Seeding intervention types...');

    const [typeLavage, typeCarburant, typeCuve] = await db
      .insert(schema.interventionTypes)
      .values([
        {
          name: 'Lavage',
          code: 'lavage',
          description: 'Washing and cleaning of vehicles',
          icon: 'droplet',
          color: '#3B82F6', // Blue
          requiresVehicle: true,
          requiresPhotos: true,
          minPhotos: 2,
          sortOrder: 1,
          config: {
            allowClientSignature: true,
            requireGPS: true,
            notifyClient: true,
          },
        },
        {
          name: 'Carburant',
          code: 'carburant',
          description: 'Vehicle refueling service',
          icon: 'fuel',
          color: '#EF4444', // Red
          requiresVehicle: true,
          requiresPhotos: true,
          minPhotos: 2,
          sortOrder: 2,
          config: {
            allowClientSignature: true,
            requireGPS: true,
            requireOdometerReading: true,
          },
        },
        {
          name: 'Remplissage cuve',
          code: 'cuve',
          description: 'Fuel tank refill at client site',
          icon: 'container',
          color: '#10B981', // Green
          requiresVehicle: false,
          requiresPhotos: true,
          minPhotos: 3,
          sortOrder: 3,
          config: {
            allowClientSignature: true,
            requireGPS: true,
            requireTankMeasurement: true,
          },
        },
      ])
      .returning();

    console.log(`✅ Created ${3} intervention types`);

    // ========================================================================
    // 5. INTERVENTION FIELDS (Dynamic fields per type)
    // ========================================================================
    console.log('📝 Seeding intervention fields...');

    // LAVAGE FIELDS
    await db.insert(schema.interventionFields).values([
      {
        interventionTypeId: typeLavage.id,
        name: 'Type de lavage',
        code: 'wash_type',
        fieldType: 'select',
        isRequired: true,
        sortOrder: 1,
        placeholder: 'Sélectionner le type',
        helpText: 'Type de lavage effectué',
        validationRules: {
          options: ['Extérieur', 'Intérieur', 'Complet', 'Express'],
        },
      },
      {
        interventionTypeId: typeLavage.id,
        name: 'Produits utilisés',
        code: 'products_used',
        fieldType: 'multiselect',
        isRequired: true,
        sortOrder: 2,
        helpText: 'Produits de nettoyage utilisés',
        validationRules: {
          options: ['Shampooing', 'Cire', 'Polish', 'Nettoyant vitres', 'Désodorisant'],
        },
      },
      {
        interventionTypeId: typeLavage.id,
        name: 'Durée (minutes)',
        code: 'duration_minutes',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 3,
        placeholder: '30',
        helpText: 'Durée totale du lavage',
        validationRules: { min: 5, max: 180 },
      },
      {
        interventionTypeId: typeLavage.id,
        name: 'État initial',
        code: 'initial_condition',
        fieldType: 'select',
        isRequired: true,
        sortOrder: 4,
        validationRules: {
          options: ['Très sale', 'Sale', 'Moyennement propre', 'Propre'],
        },
      },
      {
        interventionTypeId: typeLavage.id,
        name: 'Notes spéciales',
        code: 'special_notes',
        fieldType: 'text',
        isRequired: false,
        sortOrder: 5,
        placeholder: 'Observations particulières...',
        helpText: 'Remarques sur le lavage',
      },
    ]);

    // CARBURANT FIELDS
    await db.insert(schema.interventionFields).values([
      {
        interventionTypeId: typeCarburant.id,
        name: 'Type de carburant',
        code: 'fuel_type',
        fieldType: 'select',
        isRequired: true,
        sortOrder: 1,
        validationRules: {
          options: ['Diesel', 'Essence 95', 'Essence 98', 'GPL', 'AdBlue'],
        },
      },
      {
        interventionTypeId: typeCarburant.id,
        name: 'Quantité (litres)',
        code: 'quantity_liters',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 2,
        placeholder: '50',
        helpText: 'Quantité de carburant ajoutée',
        validationRules: { min: 0, max: 500, step: 0.01 },
      },
      {
        interventionTypeId: typeCarburant.id,
        name: 'Prix unitaire (€/L)',
        code: 'unit_price',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 3,
        placeholder: '1.65',
        helpText: 'Prix par litre',
        validationRules: { min: 0, max: 10, step: 0.001 },
      },
      {
        interventionTypeId: typeCarburant.id,
        name: 'Montant total (€)',
        code: 'total_amount',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 4,
        placeholder: '82.50',
        helpText: 'Montant total de la transaction',
        validationRules: { min: 0, max: 5000, step: 0.01 },
      },
      {
        interventionTypeId: typeCarburant.id,
        name: 'Kilométrage',
        code: 'odometer_reading',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 5,
        placeholder: '45000',
        helpText: 'Relevé du compteur kilométrique',
        validationRules: { min: 0, max: 1000000 },
      },
      {
        interventionTypeId: typeCarburant.id,
        name: 'Numéro de facture',
        code: 'invoice_number',
        fieldType: 'text',
        isRequired: false,
        sortOrder: 6,
        placeholder: 'FACT-2025-001234',
      },
      {
        interventionTypeId: typeCarburant.id,
        name: 'Station-service',
        code: 'gas_station',
        fieldType: 'text',
        isRequired: false,
        sortOrder: 7,
        placeholder: 'Total, Shell, BP...',
      },
    ]);

    // CUVE FIELDS
    await db.insert(schema.interventionFields).values([
      {
        interventionTypeId: typeCuve.id,
        name: 'Type de cuve',
        code: 'tank_type',
        fieldType: 'select',
        isRequired: true,
        sortOrder: 1,
        validationRules: {
          options: ['Diesel', 'Mazout', 'Essence', 'AdBlue', 'GNR (Gazole Non Routier)'],
        },
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Capacité de la cuve (L)',
        code: 'tank_capacity',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 2,
        placeholder: '5000',
        helpText: 'Capacité totale de la cuve',
        validationRules: { min: 100, max: 50000 },
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Niveau initial (%)',
        code: 'initial_level_percent',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 3,
        placeholder: '25',
        helpText: 'Niveau avant remplissage',
        validationRules: { min: 0, max: 100 },
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Niveau initial (L)',
        code: 'initial_level_liters',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 4,
        placeholder: '1250',
        helpText: 'Litres avant remplissage',
        validationRules: { min: 0, max: 50000 },
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Quantité ajoutée (L)',
        code: 'quantity_added',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 5,
        placeholder: '3000',
        helpText: 'Litres ajoutés',
        validationRules: { min: 1, max: 50000 },
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Niveau final (%)',
        code: 'final_level_percent',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 6,
        placeholder: '85',
        helpText: 'Niveau après remplissage',
        validationRules: { min: 0, max: 100 },
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Niveau final (L)',
        code: 'final_level_liters',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 7,
        placeholder: '4250',
        helpText: 'Litres après remplissage',
        validationRules: { min: 0, max: 50000 },
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Prix unitaire (€/L)',
        code: 'unit_price',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 8,
        placeholder: '1.45',
        validationRules: { min: 0, max: 10, step: 0.001 },
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Montant total (€)',
        code: 'total_amount',
        fieldType: 'number',
        isRequired: true,
        sortOrder: 9,
        placeholder: '4350.00',
        validationRules: { min: 0, max: 100000, step: 0.01 },
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Numéro de bon de livraison',
        code: 'delivery_note',
        fieldType: 'text',
        isRequired: true,
        sortOrder: 10,
        placeholder: 'BL-2025-001234',
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Contrôle qualité effectué',
        code: 'quality_check_done',
        fieldType: 'boolean',
        isRequired: true,
        sortOrder: 11,
        helpText: 'Test de qualité du carburant',
        defaultValue: 'false',
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Température du carburant (°C)',
        code: 'fuel_temperature',
        fieldType: 'number',
        isRequired: false,
        sortOrder: 12,
        placeholder: '15',
        validationRules: { min: -20, max: 50 },
      },
      {
        interventionTypeId: typeCuve.id,
        name: 'Observations',
        code: 'observations',
        fieldType: 'text',
        isRequired: false,
        sortOrder: 13,
        placeholder: 'Remarques sur l\'intervention...',
      },
    ]);

    console.log('✅ Created intervention fields for all types');

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n✅ Database seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Agents: 4 (1 admin, 1 supervisor, 2 field agents)`);
    console.log(`   - Clients: 3`);
    console.log(`   - Vehicles: 6`);
    console.log(`   - Intervention Types: 3 (Lavage, Carburant, Remplissage cuve)`);
    console.log(`   - Intervention Fields: 25 total (modular and extensible)`);
    console.log('\n🔐 Test Credentials:');
    console.log('   Admin: admin@fleetzen.com / admin123');
    console.log('   Supervisor: supervisor@fleetzen.com / super123');
    console.log('   Agent 1: jean.dupont@fleetzen.com / agent123');
    console.log('   Agent 2: sophie.bernard@fleetzen.com / agent123');
    console.log('\n⚠️  Change passwords in production!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}


// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed script failed:', error);
      process.exit(1);
    });
}

export { seed };
