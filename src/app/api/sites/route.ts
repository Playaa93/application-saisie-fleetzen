import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger, { logError } from '@/lib/logger';
import { siteQuerySchema } from '@/lib/validations/api';
import { ZodError } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// GET /api/sites?clientId=xxx
// Fetch unique sites where a client has vehicles
// ============================================================================
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate query params with Zod
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    let validatedQuery;
    try {
      validatedQuery = siteQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.errors }, 'GET /api/sites - Validation failed');
        return NextResponse.json({
          success: false,
          error: 'Paramètres de requête invalides',
          errorCode: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        }, { status: 400 });
      }
      throw error;
    }

    const { clientId } = validatedQuery;

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

    const duration = Date.now() - startTime;
    logger.info({ clientId, count: uniqueSites.length, duration }, 'Sites fetched successfully');

    return NextResponse.json({
      success: true,
      sites: uniqueSites.sort(),
      count: uniqueSites.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, { context: 'GET /api/sites - unhandled exception', duration });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
