import { createClient } from '@/lib/supabase/server';
import { PhotosGallery } from '@/components/admin/PhotosGallery';

/**
 * Page Admin - Galerie Photos
 *
 * Vue avant/après des interventions avec photos.
 * Admins voient toutes les photos (RLS policy).
 */
export default async function AdminPhotosPage() {
  const supabase = await createClient();

  // Fetch all photos with intervention details
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
          Galerie avant/après des interventions
        </p>
      </div>

      <PhotosGallery photos={photos || []} />
    </div>
  );
}
