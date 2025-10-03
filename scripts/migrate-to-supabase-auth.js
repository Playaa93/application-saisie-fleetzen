const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const agents = [
  {
    email: 'admin@fleetzen.com',
    password: 'fleetzen2025',
    firstName: 'Admin',
    lastName: 'FleetZen',
    phone: '+33612345678',
    role: 'admin',
  },
  {
    email: 'jean.martin@fleetzen.com',
    password: 'agent123',
    firstName: 'Jean',
    lastName: 'Martin',
    phone: '+33623456789',
    role: 'field_agent',
  },
  {
    email: 'sophie.bernard@fleetzen.com',
    password: 'agent123',
    firstName: 'Sophie',
    lastName: 'Bernard',
    phone: '+33634567890',
    role: 'field_agent',
  },
  {
    email: 'marc.durand@fleetzen.com',
    password: 'agent123',
    firstName: 'Marc',
    lastName: 'Durand',
    phone: '+33645678901',
    role: 'field_agent',
  },
  {
    email: 'emma.petit@fleetzen.com',
    password: 'agent123',
    firstName: 'Emma',
    lastName: 'Petit',
    phone: '+33656789012',
    role: 'field_agent',
  },
];

async function migrateAgents() {
  console.log('🔐 Migrating agents to Supabase Auth...\n');

  for (const agent of agents) {
    try {
      console.log(`\n📧 Processing ${agent.email}...`);

      // 1. Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: agent.email,
        password: agent.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: agent.firstName,
          last_name: agent.lastName,
          role: agent.role,
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  User ${agent.email} already exists in auth.users`);

          // Get existing user ID
          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
          const existingUser = users?.find(u => u.email === agent.email);

          if (existingUser) {
            console.log(`✅ Found existing user ID: ${existingUser.id}`);

            // Update or create agent metadata
            await updateAgentMetadata(existingUser.id, agent);
          }
        } else {
          console.error(`❌ Auth error for ${agent.email}:`, authError.message);
        }
        continue;
      }

      console.log(`✅ Created auth user: ${authUser.user.id}`);

      // 2. Create/update agent metadata in agents table
      await updateAgentMetadata(authUser.user.id, agent);

      console.log(`✅ Success: ${agent.email}`);
      console.log(`   Password: ${agent.password}`);
      console.log(`   Auth ID: ${authUser.user.id}`);

    } catch (err) {
      console.error(`❌ Unexpected error for ${agent.email}:`, err.message);
    }
  }

  console.log('\n\n📋 Migration Summary:');
  console.log('='.repeat(60));
  console.log('\n🔐 Login Credentials:');
  console.log('\nAdmin:');
  console.log('  Email: admin@fleetzen.com');
  console.log('  Password: fleetzen2025');
  console.log('\nField Agents (all use password: agent123):');
  agents
    .filter((a) => a.role === 'field_agent')
    .forEach((a) => {
      console.log(`  - ${a.firstName} ${a.lastName}: ${a.email}`);
    });
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Migration completed!');
  console.log('🎯 You can now use supabase.auth.signInWithPassword()');
}

async function updateAgentMetadata(authId, agent) {
  // Check if agent exists
  const { data: existingAgent } = await supabase
    .from('agents')
    .select('id')
    .eq('id', authId)
    .single();

  if (existingAgent) {
    // Update existing
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        email: agent.email,
        first_name: agent.firstName,
        last_name: agent.lastName,
        phone: agent.phone,
        role: agent.role,
        is_active: true,
      })
      .eq('id', authId);

    if (updateError) {
      console.error(`   ⚠️  Error updating agent metadata:`, updateError.message);
    } else {
      console.log(`   ✅ Updated agent metadata`);
    }
  } else {
    // Create new
    const { error: insertError } = await supabase
      .from('agents')
      .insert({
        id: authId, // Use auth.users.id as primary key
        email: agent.email,
        first_name: agent.firstName,
        last_name: agent.lastName,
        phone: agent.phone,
        role: agent.role,
        is_active: true,
      });

    if (insertError) {
      console.error(`   ⚠️  Error creating agent metadata:`, insertError.message);
    } else {
      console.log(`   ✅ Created agent metadata`);
    }
  }
}

migrateAgents().catch(console.error);
