import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mapper les champs pour compatibilité frontend
    const interventions = data.map(intervention => ({
      id: intervention.id,
      type: intervention.type,
      client: intervention.client,
      vehicule: intervention.vehicule,
      kilometres: intervention.kilometres,
      notes: intervention.notes,
      creeLe: intervention.created_at,
      photos: intervention.photos || []
    }));

    return NextResponse.json(interventions);
  } catch (error) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json({ error: 'Erreur de récupération' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extraire les données du formulaire
    const interventionData = {
      type: formData.get('type') as string,
      client: formData.get('client') as string,
      vehicule: formData.get('vehicule') as string,
      kilometres: formData.get('kilometres') ? parseInt(formData.get('kilometres') as string) : null,
      notes: formData.get('notes') as string || null,
      // Champs additionnels pour lavage
      prestation_lavage: formData.get('prestationLavage') as string || null,
      site_travail: formData.get('siteTravail') as string || null,
      type_vehicule: formData.get('typeVehicule') as string || null,
      vehicule_tracteur: formData.get('vehiculeTracteur') as string || null,
      vehicule_remorque: formData.get('vehiculeRemorque') as string || null,
      // Champs pour carburant
      type_carburant: formData.get('typeCarburant') as string || null,
      litres_livres: formData.get('litresLivres') ? parseFloat(formData.get('litresLivres') as string) : null,
      niveau_avant: formData.get('niveauAvant') ? parseFloat(formData.get('niveauAvant') as string) : null,
      niveau_apres: formData.get('niveauApres') ? parseFloat(formData.get('niveauApres') as string) : null,
    };

    // Insérer dans Supabase
    const { data, error } = await supabase
      .from('interventions')
      .insert([interventionData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    // Gérer les photos (à implémenter avec Supabase Storage si besoin)
    // Pour l'instant, on les ignore car la table interventions a déjà un champ photos jsonb

    return NextResponse.json({ success: true, intervention: data });
  } catch (error) {
    console.error('Error creating intervention:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
