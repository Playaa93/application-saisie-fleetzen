import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { StatsCard } from '@/components/admin/StatsCard';
import { ClipboardList, Users, Building2, Truck } from 'lucide-react';

/**
 * Admin Dashboard
 *
 * Vue d'ensemble des statistiques globales.
 * Accès admin/super_admin uniquement.
 */
export default async function AdminDashboard() {
  const supabase = await createClient();

  // Stats globales (tous les agents, tous les clients)
  const [
    { count: totalInterventions },
    { count: totalAgents },
    { count: totalClients },
    { count: totalVehicles },
    { data: recentInterventions },
  ] = await Promise.all([
    supabase.from('interventions').select('*', { count: 'exact', head: true }),
    supabase.from('agents').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase
      .from('interventions')
      .select(`
        id,
        status,
        created_at,
        intervention_type:intervention_types(name),
        client:clients(name),
        vehicle:vehicles(license_plate),
        agent:agents(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord Admin</h1>
        <p className="text-muted-foreground">Vue d'ensemble de FleetZen</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Interventions"
          value={totalInterventions || 0}
          icon={ClipboardList}
        />
        <StatsCard
          title="Agents"
          value={totalAgents || 0}
          icon={Users}
        />
        <StatsCard
          title="Clients"
          value={totalClients || 0}
          icon={Building2}
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
                    {intervention.client?.name} - {intervention.vehicle?.license_plate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Par {intervention.agent?.first_name} {intervention.agent?.last_name}
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
                    {intervention.status}
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
