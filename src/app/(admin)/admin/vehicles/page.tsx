import { createClient, createAdminClient } from '@/lib/supabase/server';
import { VehiclesManagement } from '@/components/admin/VehiclesManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Building2, Tags, MapPin } from 'lucide-react';
import { redirect } from 'next/navigation';

/**
 * Page Admin - Gestion des véhicules
 *
 * Vue globale de tous les véhicules avec statistiques.
 * Accessible uniquement aux admins (RLS policy).
 */
export default async function AdminVehiclesPage() {
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

  // Utiliser adminClient pour bypasser RLS
  const adminClient = createAdminClient();

  // Fetch all vehicles with client names (using admin client to bypass RLS)
  const { data: vehicles, error } = await adminClient
    .from('vehicles')
    .select(`
      id,
      license_plate,
      make,
      model,
      year,
      vehicle_category,
      work_site,
      created_at,
      client:clients(name)
    `)
    .order('license_plate', { ascending: true });

  if (error) {
    console.error('Error fetching vehicles:', error);
    return (
      <div className="p-8">
        <div className="text-destructive">
          Erreur lors du chargement des véhicules
        </div>
      </div>
    );
  }

  // Calculer les statistiques
  const totalVehicles = vehicles?.length || 0;

  // Grouper par client
  const vehiclesByClient = vehicles?.reduce((acc, vehicle) => {
    const clientName = vehicle.client?.name || 'Sans client';
    acc[clientName] = (acc[clientName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  const totalClients = Object.keys(vehiclesByClient).length;

  // Grouper par catégorie
  const vehiclesByCategory = vehicles?.reduce((acc, vehicle) => {
    const category = vehicle.vehicle_category || 'Non catégorisé';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  const totalCategories = Object.keys(vehiclesByCategory).length;

  // Grouper par site
  const vehiclesBySite = vehicles?.reduce((acc, vehicle) => {
    const site = vehicle.work_site || 'Non assigné';
    acc[site] = (acc[site] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  const totalSites = Object.keys(vehiclesBySite).length;

  return (
    <div className="p-8 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Gestion des Véhicules</h1>
        <p className="text-muted-foreground">
          Vue globale et gestion de toute la flotte
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Véhicules
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              Tous véhicules confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clients
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Avec véhicules assignés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Catégories
            </CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Types de véhicules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sites
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSites}</div>
            <p className="text-xs text-muted-foreground">
              Lieux de travail
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table de gestion */}
      <Card className="p-6">
        <VehiclesManagement mode="global" initialVehicles={vehicles || []} />
      </Card>
    </div>
  );
}
