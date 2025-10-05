import { createClient } from '@/lib/supabase/server';
import { VehiclesDataTable } from '@/components/admin/VehiclesDataTable';
import { Card } from '@/components/ui/card';

/**
 * Page Admin - Gestion des véhicules
 *
 * CRUD complet des véhicules.
 * Accessible uniquement aux admins (RLS policy).
 */
export default async function AdminVehiclesPage() {
  const supabase = await createClient();

  // Fetch all vehicles with client names (RLS policy allows admins to see all)
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      registration_number,
      brand,
      model,
      year,
      vehicle_category,
      work_site,
      created_at,
      client:clients(name)
    `)
    .order('registration_number', { ascending: true });

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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Véhicules</h1>
        <p className="text-muted-foreground">
          Gérer tous les véhicules de la flotte
        </p>
      </div>

      <Card className="p-6">
        <VehiclesDataTable data={vehicles || []} />
      </Card>
    </div>
  );
}
