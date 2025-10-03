import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('interventions')
      .select(`
        id,
        created_at,
        status,
        intervention_types (
          name,
          code
        ),
        clients (
          name
        ),
        vehicles (
          license_plate,
          make,
          model
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching interventions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch interventions' },
        { status: 500 }
      );
    }

    // Formater les données pour correspondre à l'interface frontend
    const interventions = (data || []).map(intervention => ({
      id: intervention.id,
      type: intervention.intervention_types?.name || 'Type inconnu',
      client: intervention.clients?.name || 'Client inconnu',
      vehicule: intervention.vehicles
        ? `${intervention.vehicles.license_plate} - ${intervention.vehicles.make} ${intervention.vehicles.model}`
        : 'Aucun véhicule',
      creeLe: intervention.created_at,
      status: intervention.status
    }));

    return NextResponse.json({
      success: true,
      interventions,
      count: interventions.length,
    });
  } catch (error) {
    console.error('Error in GET /api/interventions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
