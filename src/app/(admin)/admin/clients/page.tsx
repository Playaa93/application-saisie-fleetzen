import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClientsDataTable } from '@/components/admin/ClientsDataTable';
import { Card } from '@/components/ui/card';

/**
 * Page Admin - Gestion des clients
 *
 * Table unique avec modal d'édition pour gérer :
 * - Informations client
 * - Utilisateurs associés au client
 */
export default async function AdminClientsPage() {
  const supabase = await createClient();

  // Vérifier authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est admin
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (agentError || !agent || !['admin', 'super_admin'].includes(agent.user_type)) {
    redirect('/');
  }

  // Récupérer les clients (entreprises)
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, code, city, contact_name, contact_phone, is_active, created_at')
    .order('name', { ascending: true });

  if (clientsError) {
    console.error('Error fetching clients:', clientsError);
    return (
      <div className="p-8">
        <div className="text-destructive">
          Erreur lors du chargement des clients
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Clients</h1>
        <p className="text-muted-foreground">
          Cliquez sur le crayon pour éditer un client et gérer ses utilisateurs
        </p>
      </div>

      <Card className="p-6">
        <ClientsDataTable data={clients || []} />
      </Card>
    </div>
  );
}
