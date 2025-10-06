import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InterventionsDataTable } from '@/components/admin/InterventionsDataTable';
import { Card } from '@/components/ui/card';

/**
 * Page Client - Liste des interventions
 *
 * Affiche uniquement les interventions de la flotte du client (RLS filtrage automatique).
 */
export default async function ClientInterventionsPage() {
  const supabase = await createClient();

  // Vérifier authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est un client
  const { data: clientUser, error: clientError } = await supabase
    .from('client_users')
    .select('client_id, client:clients(name)')
    .eq('id', user.id)
    .single();

  if (clientError || !clientUser) {
    redirect('/');
  }

  // Fetch interventions (RLS policy filtre automatiquement par client_id)
  const { data: interventions, error } = await supabase
    .from('interventions')
    .select(`
      id,
      status,
      created_at,
      completed_at,
      notes,
      metadata,
      location_accuracy,
      intervention_type:intervention_types(name),
      client:clients(name),
      vehicle:vehicles(license_plate),
      agent:agents(first_name, last_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching interventions:', error);
    return (
      <div className="p-8">
        <div className="text-destructive">
          Erreur lors du chargement des interventions
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes Interventions</h1>
        <p className="text-muted-foreground">
          Historique des interventions sur votre flotte
        </p>
      </div>

      <Card className="p-6">
        <InterventionsDataTable data={interventions || []} mode="client" />
      </Card>
    </div>
  );
}
