import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { StatsCard } from '@/components/admin/StatsCard';
import { ClipboardList, Truck, CheckCircle } from 'lucide-react';

/**
 * Client Dashboard
 *
 * Vue read-only des interventions de la flotte du client.
 * Accès client_users uniquement.
 */
export default async function ClientDashboard() {
  const supabase = await createClient();

  // Récupérer l'utilisateur client
  const { data: { user } } = await supabase.auth.getUser();

  const { data: clientUser } = await supabase
    .from('client_users')
    .select('client_id, client:clients(name)')
    .eq('id', user?.id)
    .single();

  if (!clientUser) {
    return <div>Accès non autorisé</div>;
  }

  // Stats pour ce client uniquement (grâce aux RLS policies)
  const [
    { count: totalInterventions },
    { count: totalVehicles },
    { count: completedInterventions },
    { data: recentInterventions },
  ] = await Promise.all([
    supabase
      .from('interventions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientUser.client_id),
    supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientUser.client_id),
    supabase
      .from('interventions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientUser.client_id)
      .eq('status', 'completed'),
    supabase
      .from('interventions')
      .select(`
        id,
        status,
        created_at,
        intervention_type:intervention_types(name),
        vehicle:vehicles(license_plate)
      `)
      .eq('client_id', clientUser.client_id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">{clientUser.client?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Interventions"
          value={totalInterventions || 0}
          icon={ClipboardList}
        />
        <StatsCard
          title="Interventions terminées"
          value={completedInterventions || 0}
          icon={CheckCircle}
        />
        <StatsCard
          title="Véhicules"
          value={totalVehicles || 0}
          icon={Truck}
        />
      </div>

      {/* Interventions récentes */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Interventions récentes</h2>
        <div className="space-y-4">
          {recentInterventions && recentInterventions.length > 0 ? (
            recentInterventions.map((intervention) => (
              <div
                key={intervention.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {intervention.intervention_type?.name || 'Inconnu'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {intervention.vehicle?.license_plate}
                  </p>
                </div>
                <div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      intervention.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : intervention.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {intervention.status === 'completed'
                      ? 'Terminée'
                      : intervention.status === 'in_progress'
                      ? 'En cours'
                      : 'En attente'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Aucune intervention récente</p>
          )}
        </div>
      </Card>
    </div>
  );
}
