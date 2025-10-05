import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PhotosGallery } from '@/components/admin/PhotosGallery';

/**
 * Page Client - Galerie Photos
 *
 * Affiche uniquement les photos des interventions de la flotte du client.
 */
export default async function ClientPhotosPage() {
  const supabase = await createClient();

  // Vérifier authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est un client
  const { data: clientUser, error: clientError } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (clientError || !clientUser) {
    redirect('/');
  }

  // Fetch photos filtrées par RLS (interventions de client_id uniquement)
  const { data: photos, error } = await supabase
    .from('photos')
    .select(`
      id,
      type,
      url,
      filename,
      created_at,
      intervention:interventions(
        id,
        intervention_type:intervention_types(name),
        client:clients(name),
        vehicle:vehicles(license_plate),
        agent:agents(first_name, last_name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching photos:', error);
    return (
      <div className="p-8">
        <div className="text-destructive">
          Erreur lors du chargement des photos
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Photos Interventions</h1>
        <p className="text-muted-foreground">
          Galerie avant/après de vos interventions
        </p>
      </div>

      <PhotosGallery photos={photos || []} />
    </div>
  );
}
