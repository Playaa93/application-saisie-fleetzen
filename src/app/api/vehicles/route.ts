import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger, { logError } from '@/lib/logger';
import { vehicleQuerySchema, vehicleCreateSchema } from '@/lib/validations/api';
import { ZodError } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// GET /api/vehicles?clientId=xxx&site=xxx&category=xxx
// Fetch vehicles filtered by client, site, and category
// ============================================================================
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query params with Zod
    let validatedQuery;
    try {
      validatedQuery = vehicleQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.errors }, 'GET /api/vehicles - Validation failed');
        return NextResponse.json({
          success: false,
          error: 'Paramètres de requête invalides',
          errorCode: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        }, { status: 400 });
      }
      throw error;
    }

    const { clientId, site, category, page = 1, limit = 50 } = validatedQuery;

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
      `, { count: 'exact' }) // Count total for pagination
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

    // Apply pagination with Supabase .range()
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: vehicles, error, count } = await query.order('license_plate');

    if (error) {
      logError(error, { context: 'GET /api/vehicles', clientId, site, category });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vehicles' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info({
      clientId,
      site,
      category,
      count: vehicles?.length || 0,
      total: count,
      page,
      limit,
      duration
    }, 'Vehicles fetched successfully');

    return NextResponse.json({
      success: true,
      vehicles: vehicles || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
        hasNext: count ? (page * limit) < count : false,
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, { context: 'GET /api/vehicles - unhandled exception', duration });
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
  const startTime = Date.now();

  try {
    const rawBody = await request.json();

    // Validate body with Zod
    let validatedBody;
    try {
      validatedBody = vehicleCreateSchema.parse({
        client_id: rawBody.clientId,
        registration_number: rawBody.licensePlate,
        brand: rawBody.make,
        model: rawBody.model,
        year: rawBody.year,
        work_site: rawBody.site,
        vehicle_category: rawBody.category,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.errors }, 'POST /api/vehicles - Validation failed');
        return NextResponse.json({
          success: false,
          error: 'Données invalides',
          errorCode: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        }, { status: 400 });
      }
      throw error;
    }

    const { fuelType, tankCapacity } = rawBody; // Legacy fields not in schema yet

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: newVehicle, error } = await supabase
      .from('vehicles')
      .insert({
        license_plate: validatedBody.registration_number,
        client_id: validatedBody.client_id,
        work_site: validatedBody.work_site,
        vehicle_category: validatedBody.vehicle_category?.toLowerCase(),
        make: validatedBody.brand || null,
        model: validatedBody.model || null,
        year: validatedBody.year || null,
        fuel_type: fuelType || null,
        tank_capacity: tankCapacity || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logError(error, {
        context: 'POST /api/vehicles',
        licensePlate: validatedBody.registration_number,
        clientId: validatedBody.client_id
      });
      return NextResponse.json(
        { success: false, error: 'Failed to create vehicle' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info({
      vehicleId: newVehicle.id,
      licensePlate: validatedBody.registration_number,
      site: validatedBody.work_site,
      duration
    }, 'Vehicle created successfully');

    return NextResponse.json({
      success: true,
      vehicle: newVehicle,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, { context: 'POST /api/vehicles - unhandled exception', duration });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
