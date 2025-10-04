import { createClient } from '@/lib/supabase/server';
import { InterventionsDataTable } from '@/components/admin/InterventionsDataTable';
import { Card } from '@/components/ui/card';

/**
 * Page Admin - Liste des interventions
 *
 * DataTable avec filtres avancés, tri, pagination.
 * Toutes les interventions visibles pour admin.
 */
export default async function AdminInterventionsPage() {
  const supabase = await createClient();

  // Fetch all interventions (RLS policy allows admins to see all)
  const { data: interventions, error } = await supabase
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
        <h1 className="text-3xl font-bold">Interventions</h1>
        <p className="text-muted-foreground">
          Gérer toutes les interventions
        </p>
      </div>

      <Card className="p-6">
        <InterventionsDataTable data={interventions || []} />
      </Card>
    </div>
  );
}
