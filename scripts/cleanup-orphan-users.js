/**
 * Script pour nettoyer les utilisateurs orphelins
 * (présents dans auth.users mais pas dans agents)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qxbvlitgxzhnktrwftiv.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4YnZsaXRneHpobmt0cndmdGl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE2NzM2MywiZXhwIjoyMDc0NzQzMzYzfQ.YFqSFaepuTz042jHrQaSQIowg02O_8xCab-Of5wP_aM';

const orphanUserId = 'cfa449f8-5797-4401-9739-dc0f80757130';

async function cleanupOrphanUsers() {
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`🔍 Suppression de l'utilisateur orphelin: ${orphanUserId}`);

  try {
    const { data, error } = await adminClient.auth.admin.deleteUser(orphanUserId);

    if (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      process.exit(1);
    }

    console.log('✅ Utilisateur orphelin supprimé avec succès!');
    console.log('Vous pouvez maintenant recréer l\'agent.');
  } catch (err) {
    console.error('❌ Exception:', err);
    process.exit(1);
  }
}

cleanupOrphanUsers();
