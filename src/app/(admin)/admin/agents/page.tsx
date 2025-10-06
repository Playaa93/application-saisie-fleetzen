import { createClient } from '@/lib/supabase/server';
import { AgentsDataTable } from '@/components/admin/AgentsDataTable';
import { Card } from '@/components/ui/card';

/**
 * Page Admin - Gestion des agents
 *
 * CRUD complet des agents (field_agent, admin, super_admin).
 * Accessible uniquement aux admins (RLS policy).
 */
export default async function AdminAgentsPage() {
  const supabase = await createClient();

  // Fetch all agents (RLS policy allows admins to see all)
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, email, first_name, last_name, phone, role, user_type, is_active, avatar_url, created_at, permanently_deleted')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agents:', error);
    return (
      <div className="p-8">
        <div className="text-destructive">
          Erreur lors du chargement des agents
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Agents</h1>
        <p className="text-muted-foreground">
          Gérer les agents, admins et super-admins
        </p>
      </div>

      <Card className="p-6">
        <AgentsDataTable data={agents || []} />
      </Card>
    </div>
  );
}
