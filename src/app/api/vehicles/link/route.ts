import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger, { logError } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// POST /api/vehicles/link
// Link an existing vehicle to a new client/site location
// ============================================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceVehicleId, clientId, site } = body;

    if (!sourceVehicleId || !clientId || !site) {
      logger.warn({ hasSourceVehicleId: !!sourceVehicleId, hasClientId: !!clientId, hasSite: !!site }, 'POST /api/vehicles/link - missing required fields');
      return NextResponse.json(
        { success: false, error: 'sourceVehicleId, clientId, and site are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the source vehicle data
    const { data: sourceVehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', sourceVehicleId)
      .single();

    if (fetchError || !sourceVehicle) {
      logError(fetchError, { context: 'POST /api/vehicles/link - source vehicle not found', sourceVehicleId });
      return NextResponse.json(
        { success: false, error: 'Source vehicle not found' },
        { status: 404 }
      );
    }

    // Check if this combination already exists
    const { data: existingLink, error: checkError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('license_plate', sourceVehicle.license_plate)
      .eq('client_id', clientId)
      .eq('work_site', site)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError) {
      logError(checkError, { context: 'POST /api/vehicles/link - check existing', licensePlate: sourceVehicle.license_plate });
      return NextResponse.json(
        { success: false, error: 'Failed to check existing link' },
        { status: 500 }
      );
    }

    if (existingLink) {
      logger.warn({ licensePlate: sourceVehicle.license_plate, clientId, site }, 'Vehicle already linked to this client/site');
      return NextResponse.json(
        { success: false, error: 'This vehicle is already linked to this client/site' },
        { status: 409 }
      );
    }

    // Create a new vehicle entry with the same data but new client/site
    const { data: newVehicle, error: createError } = await supabase
      .from('vehicles')
      .insert({
        license_plate: sourceVehicle.license_plate,
        make: sourceVehicle.make,
        model: sourceVehicle.model,
        year: sourceVehicle.year,
        fuel_type: sourceVehicle.fuel_type,
        tank_capacity: sourceVehicle.tank_capacity,
        vehicle_category: sourceVehicle.vehicle_category,
        client_id: clientId,
        work_site: site,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      logError(createError, { context: 'POST /api/vehicles/link - create failed', licensePlate: sourceVehicle.license_plate });
      return NextResponse.json(
        { success: false, error: 'Failed to link vehicle' },
        { status: 500 }
      );
    }

    logger.info({
      newVehicleId: newVehicle.id,
      sourceVehicleId,
      licensePlate: sourceVehicle.license_plate,
      clientId,
      site
    }, 'Vehicle linked successfully');

    return NextResponse.json({
      success: true,
      vehicle: newVehicle,
    });
  } catch (error) {
    logError(error, { context: 'POST /api/vehicles/link - unhandled exception' });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
