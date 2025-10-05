import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger, { logError } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// POST /api/vehicles/check
// Check if a license plate exists and where
// ============================================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { licensePlate, clientId, site } = body;

    if (!licensePlate) {
      logger.warn({ clientId, site }, 'POST /api/vehicles/check - missing licensePlate');
      return NextResponse.json(
        { success: false, error: 'licensePlate is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if this exact vehicle exists (same client + site)
    const { data: exactMatch, error: exactError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('license_plate', licensePlate)
      .eq('client_id', clientId)
      .eq('work_site', site)
      .eq('is_active', true)
      .maybeSingle();

    if (exactError) {
      logError(exactError, { context: 'POST /api/vehicles/check - exact match query', licensePlate });
      return NextResponse.json(
        { success: false, error: 'Failed to check vehicle' },
        { status: 500 }
      );
    }

    // Check if vehicle exists elsewhere (different client or site)
    const { data: otherLocations, error: otherError } = await supabase
      .from('vehicles')
      .select(`
        id,
        license_plate,
        client_id,
        work_site,
        vehicle_category,
        make,
        model,
        clients (
          id,
          name
        )
      `)
      .eq('license_plate', licensePlate)
      .eq('is_active', true);

    if (otherError) {
      logError(otherError, { context: 'POST /api/vehicles/check - other locations query', licensePlate });
      return NextResponse.json(
        { success: false, error: 'Failed to check vehicle locations' },
        { status: 500 }
      );
    }

    // Filter out current location
    const differentLocations = otherLocations?.filter(
      v => v.client_id !== clientId || v.work_site !== site
    ) || [];

    logger.debug({
      licensePlate,
      hasExactMatch: !!exactMatch,
      otherLocationsCount: differentLocations.length
    }, 'Vehicle check completed');

    return NextResponse.json({
      success: true,
      exists: !!exactMatch || differentLocations.length > 0,
      exactMatch: exactMatch || null,
      otherLocations: differentLocations,
    });
  } catch (error) {
    logError(error, { context: 'POST /api/vehicles/check - unhandled exception' });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
