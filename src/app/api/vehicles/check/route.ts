import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
      console.error('Error checking exact match:', exactError);
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
      console.error('Error checking other locations:', otherError);
      return NextResponse.json(
        { success: false, error: 'Failed to check vehicle locations' },
        { status: 500 }
      );
    }

    // Filter out current location
    const differentLocations = otherLocations?.filter(
      v => v.client_id !== clientId || v.work_site !== site
    ) || [];

    return NextResponse.json({
      success: true,
      exists: !!exactMatch || differentLocations.length > 0,
      exactMatch: exactMatch || null,
      otherLocations: differentLocations,
    });
  } catch (error) {
    console.error('Error in POST /api/vehicles/check:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
