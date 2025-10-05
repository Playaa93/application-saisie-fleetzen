import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger, { logError } from '@/lib/logger';
import { ZodError, z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Schema for vehicle-categories query (clientId + site required)
const vehicleCategoriesQuerySchema = z.object({
  clientId: z.string().uuid({ message: 'clientId invalide (UUID requis)' }),
  site: z.string().min(1, 'Site requis'),
});

// ============================================================================
// GET /api/vehicle-categories?clientId=xxx&site=xxx
// Fetch unique vehicle categories for a client at a specific site
// ============================================================================
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate query params with Zod
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    let validatedQuery;
    try {
      validatedQuery = vehicleCategoriesQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.errors }, 'GET /api/vehicle-categories - Validation failed');
        return NextResponse.json({
          success: false,
          error: 'Paramètres de requête invalides',
          errorCode: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        }, { status: 400 });
      }
      throw error;
    }

    const { clientId, site } = validatedQuery;
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
      logError(error, { context: 'GET /api/vehicle-categories - fetch query', clientId, site });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vehicle categories' },
        { status: 500 }
      );
    }

    // Extract unique categories
    const uniqueCategories = [...new Set(vehicles?.map(v => v.vehicle_category).filter(Boolean))];

    const duration = Date.now() - startTime;
    logger.info({ clientId, site, count: uniqueCategories.length, duration }, 'Vehicle categories fetched successfully');

    return NextResponse.json({
      success: true,
      categories: uniqueCategories.sort(),
      count: uniqueCategories.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, { context: 'GET /api/vehicle-categories - unhandled exception', duration });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
