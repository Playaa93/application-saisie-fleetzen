import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
      console.error('Error fetching source vehicle:', fetchError);
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
      console.error('Error checking existing link:', checkError);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing link' },
        { status: 500 }
      );
    }

    if (existingLink) {
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
      console.error('Error creating linked vehicle:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to link vehicle' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vehicle: newVehicle,
    });
  } catch (error) {
    console.error('Error in POST /api/vehicles/link:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
