import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// GET /api/vehicle-categories?clientId=xxx&site=xxx
// Fetch unique vehicle categories for a client at a specific site
// ============================================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const site = searchParams.get('site');

    if (!clientId || !site) {
      return NextResponse.json(
        { success: false, error: 'clientId and site parameters are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get distinct vehicle categories for this client and site
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('vehicle_category')
      .eq('client_id', clientId)
      .eq('work_site', site)
      .eq('is_active', true)
      .not('vehicle_category', 'is', null);

    if (error) {
      console.error('Error fetching vehicle categories:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vehicle categories' },
        { status: 500 }
      );
    }

    // Extract unique categories
    const uniqueCategories = [...new Set(vehicles?.map(v => v.vehicle_category).filter(Boolean))];

    return NextResponse.json({
      success: true,
      categories: uniqueCategories.sort(),
      count: uniqueCategories.length,
    });
  } catch (error) {
    console.error('Error in GET /api/vehicle-categories:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
