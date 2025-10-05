import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger, { logError } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// GET /api/sites?clientId=xxx
// Fetch unique sites where a client has vehicles
// ============================================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get distinct sites for this client
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('work_site')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .not('work_site', 'is', null);

    if (error) {
      logError(error, { context: 'GET /api/sites - fetch query', clientId });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sites' },
        { status: 500 }
      );
    }

    // Extract unique sites
    const uniqueSites = [...new Set(vehicles?.map(v => v.work_site).filter(Boolean))];

    logger.debug({ clientId, count: uniqueSites.length }, 'Sites fetched successfully');

    return NextResponse.json({
      success: true,
      sites: uniqueSites.sort(),
      count: uniqueSites.length,
    });
  } catch (error) {
    logError(error, { context: 'GET /api/sites - unhandled exception' });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
