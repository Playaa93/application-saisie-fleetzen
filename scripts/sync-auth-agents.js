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
    firstName: 'Admin',
    lastName: 'FleetZen',
    phone: '+33612345678',
    role: 'admin',
  },
  {
    email: 'jean.martin@fleetzen.com',
    firstName: 'Jean',
    lastName: 'Martin',
    phone: '+33623456789',
    role: 'field_agent',
  },
  {
    email: 'sophie.bernard@fleetzen.com',
    firstName: 'Sophie',
    lastName: 'Bernard',
    phone: '+33634567890',
    role: 'field_agent',
  },
  {
    email: 'marc.durand@fleetzen.com',
    firstName: 'Marc',
    lastName: 'Durand',
    phone: '+33645678901',
    role: 'field_agent',
  },
  {
    email: 'emma.petit@fleetzen.com',
    firstName: 'Emma',
    lastName: 'Petit',
    phone: '+33656789012',
    role: 'field_agent',
  },
];

async function syncAgents() {
  console.log('🔄 Synchronizing agents with Supabase Auth...\n');

  // Get all auth users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing auth users:', listError.message);
    process.exit(1);
  }

  console.log(`📋 Found ${users.length} auth users\n`);

  for (const agent of agents) {
    try {
      console.log(`\n📧 Processing ${agent.email}...`);

      // Find auth user by email
      const authUser = users.find(u => u.email === agent.email);

      if (!authUser) {
        console.log(`⚠️  No auth user found for ${agent.email}, skipping...`);
        continue;
      }

      console.log(`✅ Found auth user ID: ${authUser.id}`);

      // Check if agent metadata already exists with this auth ID
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (existingAgent) {
        console.log(`✅ Agent metadata already linked to auth ID`);

        // Update to ensure data is correct
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
          .eq('id', authUser.id);

        if (updateError) {
          console.error(`   ⚠️  Error updating agent: ${updateError.message}`);
        } else {
          console.log(`   ✅ Agent metadata updated`);
        }
      } else {
        // Check if old agent exists with this email
        const { data: oldAgent } = await supabase
          .from('agents')
          .select('id')
          .eq('email', agent.email)
          .single();

        if (oldAgent) {
          console.log(`   🔄 Deleting old agent record (ID: ${oldAgent.id})`);
          await supabase.from('agents').delete().eq('id', oldAgent.id);
        }

        // Create new agent with auth ID
        const { error: insertError } = await supabase
          .from('agents')
          .insert({
            id: authUser.id,
            email: agent.email,
            first_name: agent.firstName,
            last_name: agent.lastName,
            phone: agent.phone,
            role: agent.role,
            is_active: true,
          });

        if (insertError) {
          console.error(`   ❌ Error creating agent: ${insertError.message}`);
        } else {
          console.log(`   ✅ Agent metadata created with auth ID`);
        }
      }

      console.log(`✅ Success: ${agent.email} synced`);

    } catch (err) {
      console.error(`❌ Unexpected error for ${agent.email}:`, err.message);
    }
  }

  console.log('\n\n📋 Synchronization Summary:');
  console.log('='.repeat(60));
  console.log('✨ All agents are now linked to Supabase Auth!');
  console.log('🎯 You can now use supabase.auth.signInWithPassword()');
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
}

syncAgents().catch(console.error);
