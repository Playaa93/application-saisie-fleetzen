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

const realAdmin = {
  email: 'hzukic@neteco.pro',
  password: 'Lordi93250!',
  firstName: 'Haris',
  lastName: 'Zukic',
  phone: '+33612345678',
  role: 'admin',
};

async function createRealAdmin() {
  console.log('🔐 Creating real admin user...\n');

  try {
    console.log(`📧 Processing ${realAdmin.email}...`);

    // 1. Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: realAdmin.email,
      password: realAdmin.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: realAdmin.firstName,
        last_name: realAdmin.lastName,
        role: realAdmin.role,
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`⚠️  User ${realAdmin.email} already exists in auth.users`);

        // Get existing user ID
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email === realAdmin.email);

        if (existingUser) {
          console.log(`✅ Found existing user ID: ${existingUser.id}`);

          // Update password
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: realAdmin.password }
          );

          if (updateError) {
            console.error('❌ Error updating password:', updateError.message);
          } else {
            console.log('✅ Password updated successfully');
          }

          // Update agent metadata
          await updateAgentMetadata(existingUser.id, realAdmin);
        }
      } else {
        console.error(`❌ Auth error:`, authError.message);
        process.exit(1);
      }
    } else {
      console.log(`✅ Created auth user: ${authUser.user.id}`);

      // Create agent metadata
      await updateAgentMetadata(authUser.user.id, realAdmin);
    }

    console.log('\n📋 Real Admin Created:');
    console.log('='.repeat(60));
    console.log('🔐 Login Credentials:');
    console.log(`  Email: ${realAdmin.email}`);
    console.log(`  Password: ${realAdmin.password}`);
    console.log(`  Name: ${realAdmin.firstName} ${realAdmin.lastName}`);
    console.log(`  Role: ${realAdmin.role}`);
    console.log('='.repeat(60));
    console.log('\n✨ Admin created successfully!');
    console.log('🎯 You can now login at http://localhost:3000/login');

  } catch (err) {
    console.error(`❌ Unexpected error:`, err.message);
    process.exit(1);
  }
}

async function updateAgentMetadata(authId, admin) {
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
        email: admin.email,
        first_name: admin.firstName,
        last_name: admin.lastName,
        phone: admin.phone,
        role: admin.role,
        is_active: true,
      })
      .eq('id', authId);

    if (updateError) {
      console.error(`   ⚠️  Error updating agent metadata:`, updateError.message);
    } else {
      console.log(`   ✅ Agent metadata updated`);
    }
  } else {
    // Create new
    const { error: insertError } = await supabase
      .from('agents')
      .insert({
        id: authId,
        email: admin.email,
        first_name: admin.firstName,
        last_name: admin.lastName,
        phone: admin.phone,
        role: admin.role,
        is_active: true,
      });

    if (insertError) {
      console.error(`   ⚠️  Error creating agent metadata:`, insertError.message);
    } else {
      console.log(`   ✅ Agent metadata created`);
    }
  }
}

createRealAdmin().catch(console.error);
