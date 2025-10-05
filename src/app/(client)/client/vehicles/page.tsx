import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Calendar, MapPin } from 'lucide-react';

/**
 * Page Client - Ma Flotte
 *
 * Affiche uniquement les véhicules du client (RLS filtrage automatique).
 * Vue read-only avec statistiques par véhicule.
 */
export default async function ClientVehiclesPage() {
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

  // Fetch véhicules avec stats interventions (RLS filtre par client_id)
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
      created_at
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

  // Fetch stats interventions par véhicule
  const vehicleIds = vehicles?.map(v => v.id) || [];
  const { data: interventionStats } = await supabase
    .from('interventions')
    .select('vehicle_id, status')
    .in('vehicle_id', vehicleIds);

  // Grouper stats par véhicule
  const statsByVehicle = (interventionStats || []).reduce((acc, inter) => {
    if (!acc[inter.vehicle_id]) {
      acc[inter.vehicle_id] = { total: 0, completed: 0 };
    }
    acc[inter.vehicle_id].total++;
    if (inter.status === 'completed') {
      acc[inter.vehicle_id].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ma Flotte</h1>
        <p className="text-muted-foreground">
          {vehicles?.length || 0} véhicule(s) dans votre flotte
        </p>
      </div>

      {vehicles && vehicles.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Aucun véhicule</h3>
            <p className="text-sm text-muted-foreground">
              Votre flotte est vide
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles?.map((vehicle) => {
            const stats = statsByVehicle[vehicle.id] || { total: 0, completed: 0 };

            return (
              <Card key={vehicle.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{vehicle.registration_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.brand} {vehicle.model}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    {vehicle.vehicle_category && (
                      <Badge variant="outline">{vehicle.vehicle_category}</Badge>
                    )}
                    {vehicle.work_site && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{vehicle.work_site}</span>
                      </div>
                    )}
                    {vehicle.year && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Année {vehicle.year}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Interventions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                        <p className="text-xs text-muted-foreground">Complétées</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
