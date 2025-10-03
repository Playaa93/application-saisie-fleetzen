import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Force cache invalidation - v2
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 [START] GET /api/interventions/[id]');

  try {
    console.log('📦 [STEP 1] Awaiting params...');
    const { id } = await params;
    console.log('✅ [STEP 1] Params resolved:', { id });

    console.log('🔑 [STEP 2] Loading env vars...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    console.log('✅ [STEP 2] Env vars loaded:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });

    console.log('🔌 [STEP 3] Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ [STEP 3] Client created');

    console.log('🔍 [STEP 4] Querying Supabase...');
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
      .eq('id', id)
      .single();

    console.log('📊 [STEP 4] Query result:', {
      hasData: !!data,
      hasError: !!error,
      errorDetails: error ? { code: error.code, message: error.message } : null
    });

    if (error) {
      console.error('❌ [ERROR] Supabase error:', error);
      return NextResponse.json({ error: 'Intervention introuvable' }, { status: 404 });
    }

    if (!data) {
      console.error('❌ [ERROR] No data returned');
      return NextResponse.json({ error: 'Intervention introuvable' }, { status: 404 });
    }

    console.log('🔧 [STEP 5] Formatting response...');
    console.log('📋 [DEBUG] Raw data structure:', {
      hasInterventionTypes: !!data.intervention_types,
      hasClients: !!data.clients,
      hasVehicles: !!data.vehicles,
      hasAgents: !!data.agents
    });

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

    console.log('✅ [STEP 5] Response formatted successfully');
    console.log('🎉 [SUCCESS] Returning intervention data');

    return NextResponse.json(intervention);
  } catch (error) {
    console.error('❌❌❌ [FATAL ERROR] Unhandled exception:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Error message:', error instanceof Error ? error.message : String(error));

    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
