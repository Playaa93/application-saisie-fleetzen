import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// GET /api/vehicles?clientId=xxx&category=tracteur
// Fetch vehicles for a specific client, optionally filtered by category
// ============================================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const category = searchParams.get('category'); // Optional filter

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
        vehicle_category
      `)
      .eq('client_id', clientId)
      .eq('is_active', true);

    // Add category filter if provided
    if (category) {
      query = query.eq('vehicle_category', category);
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
