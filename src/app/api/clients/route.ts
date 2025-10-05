import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger, { logError } from '@/lib/logger';
import { clientQuerySchema, clientCreateSchema } from '@/lib/validations/api';
import { ZodError } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// GET /api/clients?search=xxx&active=true&page=1&limit=20
// Fetch all active clients with optional filters
// ============================================================================
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate query params with Zod
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    let validatedQuery;
    try {
      validatedQuery = clientQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.errors }, 'GET /api/clients - Validation failed');
        return NextResponse.json({
          success: false,
          error: 'Paramètres de requête invalides',
          errorCode: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        }, { status: 400 });
      }
      throw error;
    }

    const { search, active, page, limit } = validatedQuery;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('clients')
      .select(`
        id,
        name,
        code,
        city,
        postal_code,
        contact_name,
        contact_phone,
        coordinates
      `, { count: 'exact' })
      .eq('is_active', active)
      .neq('code', 'FLEETZEN-INTERNAL'); // Exclure le client interne FleetZen

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,city.ilike.%${search}%`);
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('name');

    const { data: clients, error, count } = await query;

    if (error) {
      logError(error, { context: 'GET /api/clients - fetch query', search, active });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info({
      count: clients?.length || 0,
      total: count || 0,
      page,
      limit,
      search,
      duration
    }, 'Clients fetched successfully');

    return NextResponse.json({
      success: true,
      clients: clients || [],
      count: clients?.length || 0,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, { context: 'GET /api/clients - unhandled exception', duration });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/clients
// Create a new client
// ============================================================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const rawBody = await request.json();

    // Validate body with Zod
    let validatedBody;
    try {
      validatedBody = clientCreateSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.errors }, 'POST /api/clients - Validation failed');
        return NextResponse.json({
          success: false,
          error: 'Données invalides',
          errorCode: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        }, { status: 400 });
      }
      throw error;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        name: validatedBody.name,
        code: validatedBody.code || null,
        city: validatedBody.city || null,
        postal_code: validatedBody.postal_code || null,
        contact_name: validatedBody.contact_name || null,
        contact_phone: validatedBody.contact_phone || null,
        coordinates: validatedBody.coordinates || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logError(error, {
        context: 'POST /api/clients',
        clientName: validatedBody.name
      });
      return NextResponse.json(
        { success: false, error: 'Failed to create client' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info({
      clientId: newClient.id,
      clientName: validatedBody.name,
      duration
    }, 'Client created successfully');

    return NextResponse.json({
      success: true,
      client: newClient,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, { context: 'POST /api/clients - unhandled exception', duration });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
