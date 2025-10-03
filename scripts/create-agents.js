const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const agents = [
  {
    email: 'admin@fleetzen.com',
    password: 'fleetzen2025',
    first_name: 'Admin',
    last_name: 'FleetZen',
    phone: '+33612345678',
    role: 'admin',
  },
  {
    email: 'jean.martin@fleetzen.com',
    password: 'agent123',
    first_name: 'Jean',
    last_name: 'Martin',
    phone: '+33623456789',
    role: 'field_agent',
  },
  {
    email: 'sophie.bernard@fleetzen.com',
    password: 'agent123',
    first_name: 'Sophie',
    last_name: 'Bernard',
    phone: '+33634567890',
    role: 'field_agent',
  },
  {
    email: 'marc.durand@fleetzen.com',
    password: 'agent123',
    first_name: 'Marc',
    last_name: 'Durand',
    phone: '+33645678901',
    role: 'field_agent',
  },
  {
    email: 'emma.petit@fleetzen.com',
    password: 'agent123',
    first_name: 'Emma',
    last_name: 'Petit',
    phone: '+33656789012',
    role: 'field_agent',
  },
];

async function createAgents() {
  console.log('🔐 Creating agents with hashed passwords...\n');

  for (const agent of agents) {
    try {
      // Hash password with bcrypt (12 rounds)
      const passwordHash = await bcrypt.hash(agent.password, 12);

      // Check if agent already exists
      const { data: existing } = await supabase
        .from('agents')
        .select('id, email')
        .eq('email', agent.email)
        .single();

      if (existing) {
        console.log(`⚠️  Agent ${agent.email} already exists, skipping...`);
        continue;
      }

      // Insert agent
      const { data, error } = await supabase
        .from('agents')
        .insert({
          email: agent.email,
          first_name: agent.first_name,
          last_name: agent.last_name,
          phone: agent.phone,
          role: agent.role,
          password_hash: passwordHash,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${agent.email}:`, error.message);
      } else {
        console.log(`✅ Created ${agent.role}: ${agent.email}`);
        console.log(`   Password: ${agent.password}`);
        console.log(`   ID: ${data.id}\n`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error for ${agent.email}:`, err.message);
    }
  }

  console.log('\n📋 Summary:');
  console.log('='.repeat(60));
  console.log('Admin:');
  console.log('  Email: admin@fleetzen.com');
  console.log('  Password: fleetzen2025');
  console.log('\nField Agents (all use password: agent123):');
  agents
    .filter((a) => a.role === 'field_agent')
    .forEach((a) => {
      console.log(`  - ${a.first_name} ${a.last_name}: ${a.email}`);
    });
  console.log('='.repeat(60));
  console.log('\n✨ Done! Agents created successfully.');
}

createAgents().catch(console.error);
