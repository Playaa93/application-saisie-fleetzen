import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// GET /api/vehicles?clientId=xxx&site=xxx&category=xxx
// Fetch vehicles filtered by client, site, and category
// ============================================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const site = searchParams.get('site');
    const category = searchParams.get('category');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('vehicles')
      .select(`
        id,
        license_plate,
        make,
        model,
        year,
        fuel_type,
        tank_capacity,
        vehicle_category,
        work_site,
        metadata
      `)
      .eq('client_id', clientId)
      .eq('is_active', true);

    // Add site filter if provided
    if (site) {
      query = query.eq('work_site', site);
    }

    // Add category filter if provided (convert to lowercase for DB comparison)
    if (category) {
      query = query.eq('vehicle_category', category.toLowerCase());
    }

    const { data: vehicles, error } = await query.order('license_plate');

    if (error) {
      console.error('Error fetching vehicles:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vehicles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vehicles: vehicles || [],
      count: vehicles?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/vehicles
// Create a new vehicle
// ============================================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      licensePlate,
      clientId,
      site,
      category,
      make,
      model,
      year,
      fuelType,
      tankCapacity
    } = body;

    if (!licensePlate || !clientId || !site || !category) {
      return NextResponse.json(
        { success: false, error: 'licensePlate, clientId, site, and category are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: newVehicle, error } = await supabase
      .from('vehicles')
      .insert({
        license_plate: licensePlate,
        client_id: clientId,
        work_site: site,
        vehicle_category: category.toLowerCase(),
        make: make || null,
        model: model || null,
        year: year || null,
        fuel_type: fuelType || null,
        tank_capacity: tankCapacity || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vehicle:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create vehicle' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vehicle: newVehicle,
    });
  } catch (error) {
    console.error('Error in POST /api/vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
