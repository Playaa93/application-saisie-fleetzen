import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger, { logError } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Force cache invalidation - v2
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    logger.debug({ interventionId: id }, 'Fetching intervention details');

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
      .eq('id', id)
      .single();

    if (error) {
      logError(error, { context: 'GET /api/interventions/[id]', interventionId: id });
      return NextResponse.json({ error: 'Intervention introuvable' }, { status: 404 });
    }

    if (!data) {
      logger.warn({ interventionId: id }, 'Intervention not found');
      return NextResponse.json({ error: 'Intervention introuvable' }, { status: 404 });
    }

    logger.debug({
      interventionId: id,
      hasRelations: {
        interventionTypes: !!data.intervention_types,
        clients: !!data.clients,
        vehicles: !!data.vehicles,
        agents: !!data.agents
      }
    }, 'Intervention data fetched successfully');

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

    const duration = Date.now() - startTime;
    logger.info({
      interventionId: id,
      duration,
      hasPhotos: intervention.photos.length > 0
    }, 'Intervention retrieved successfully');

    return NextResponse.json(intervention);
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, {
      context: 'GET /api/interventions/[id] - unhandled exception',
      duration
    });

    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
