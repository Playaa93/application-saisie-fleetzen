import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('interventions')
      .select(`
        *,
        intervention_types (
          id,
          name,
          code,
          icon,
          color
        ),
        clients (
          id,
          name,
          code
        ),
        vehicles (
          id,
          license_plate,
          make,
          model,
          vehicle_category
        ),
        agents (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('❌ Error fetching intervention:', error);
      return NextResponse.json({ error: 'Intervention introuvable' }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Intervention introuvable' }, { status: 404 });
    }

    // Formater la réponse
    const intervention = {
      id: data.id,
      type: data.intervention_types?.name || '',
      typeCode: data.intervention_types?.code || '',
      typeIcon: data.intervention_types?.icon || '',
      typeColor: data.intervention_types?.color || '',

      client: data.clients?.name || '',
      clientId: data.client_id,

      vehicule: data.vehicles?.license_plate
        ? `${data.vehicles.license_plate} - ${data.vehicles.make} ${data.vehicles.model}`
        : '',
      vehicleId: data.vehicle_id,
      vehicleCategory: data.vehicles?.vehicle_category || '',

      agent: data.agents
        ? `${data.agents.first_name} ${data.agents.last_name}`
        : '',
      agentEmail: data.agents?.email || '',

      status: data.status,
      notes: data.notes,
      internalNotes: data.internal_notes,

      coordinates: data.coordinates,
      locationAccuracy: data.location_accuracy,

      scheduledAt: data.scheduled_at,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      signedAt: data.signed_at,

      clientSignature: data.client_signature,
      agentSignature: data.agent_signature,

      metadata: data.metadata || {},

      createdAt: data.created_at,
      updatedAt: data.updated_at,
      syncedAt: data.synced_at,

      // Photos à implémenter plus tard
      photos: []
    };

    return NextResponse.json(intervention);
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
