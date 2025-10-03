import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('interventions')
      .select(`
        *,
        intervention_types (name),
        clients (name),
        vehicles (license_plate, make, model)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mapper les champs pour compatibilité frontend
    const interventions = data.map(intervention => ({
      id: intervention.id,
      type: intervention.intervention_types?.name || '',
      client: intervention.clients?.name || '',
      vehicule: intervention.vehicles?.license_plate ?
        `${intervention.vehicles.license_plate} - ${intervention.vehicles.make} ${intervention.vehicles.model}` : '',
      kilometres: null, // Pas de champ kilomètres dans la table
      notes: intervention.notes,
      creeLe: intervention.created_at,
      photos: [] // Pas encore implémenté
    }));

    return NextResponse.json(interventions);
  } catch (error) {
    console.error('❌ Error fetching interventions:', error);
    console.error('📋 Full error:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Erreur de récupération' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Récupérer le type d'intervention en texte
    const interventionTypeName = formData.get('type') as string;

    console.log('🔍 Looking up intervention type:', interventionTypeName);

    // Chercher l'intervention_type_id correspondant
    const { data: interventionTypes, error: typeError } = await supabase
      .from('intervention_types')
      .select('id')
      .eq('name', interventionTypeName)
      .single();

    if (typeError || !interventionTypes) {
      console.error('❌ Intervention type not found:', interventionTypeName, typeError);
      return NextResponse.json({
        error: `Type d'intervention "${interventionTypeName}" introuvable`
      }, { status: 400 });
    }

    console.log('✅ Found intervention type ID:', interventionTypes.id);

    // TODO: Récupérer l'agent_id de la session utilisateur
    // Pour l'instant, on va chercher le premier agent disponible
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .limit(1)
      .single();

    if (agentError || !agents) {
      console.error('❌ No agent found:', agentError);
      return NextResponse.json({
        error: 'Aucun agent trouvé. Veuillez créer un agent d\'abord.'
      }, { status: 400 });
    }

    console.log('✅ Using agent ID:', agents.id);

    // Helper pour convertir "null" string en null réel
    const getFormValue = (key: string): string | null => {
      const value = formData.get(key) as string;
      return (value === 'null' || value === 'undefined' || !value) ? null : value;
    };

    // Préparer les données d'intervention
    const interventionData = {
      intervention_type_id: interventionTypes.id,
      agent_id: agents.id,
      client_id: getFormValue('clientId')!,  // Required field
      vehicle_id: getFormValue('vehicleId'),  // Optional field
      status: 'completed' as const,
      notes: getFormValue('notes'),
      completed_at: new Date().toISOString(),
    };

    console.log('🔍 Attempting to insert:', interventionData);

    // Insérer dans Supabase
    const { data, error } = await supabase
      .from('interventions')
      .insert([interventionData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      console.error('📋 Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Insert successful:', data);

    return NextResponse.json({ success: true, intervention: data });
  } catch (error) {
    console.error('Error creating intervention:', error);
    return NextResponse.json({
      error: 'Erreur lors de la création de l\'intervention'
    }, { status: 500 });
  }
}
