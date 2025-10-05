import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger, { logError } from '@/lib/logger';
import { interventionTypeCreateSchema } from '@/lib/validations/api';
import { ZodError } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// GET /api/intervention-types
// Fetch all active intervention types with their dynamic fields
// ============================================================================
export async function GET() {
  const startTime = Date.now();

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch intervention types with their fields
    const { data: types, error: typesError } = await supabase
      .from('intervention_types')
      .select(`
        id,
        name,
        code,
        description,
        icon,
        color,
        requires_vehicle,
        requires_photos,
        min_photos,
        sort_order
      `)
      .eq('is_active', true)
      .order('sort_order');

    if (typesError) {
      logError(typesError, { context: 'GET /api/intervention-types - fetch types' });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch intervention types' },
        { status: 500 }
      );
    }

    // Fetch fields for all types
    const { data: fields, error: fieldsError } = await supabase
      .from('intervention_fields')
      .select('*')
      .in('intervention_type_id', types.map(t => t.id))
      .order('sort_order');

    if (fieldsError) {
      logError(fieldsError, { context: 'GET /api/intervention-types - fetch fields' });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch intervention fields' },
        { status: 500 }
      );
    }

    // Group fields by intervention type
    const typesWithFields = types.map(type => ({
      ...type,
      fields: fields.filter(f => f.intervention_type_id === type.id),
    }));

    const duration = Date.now() - startTime;
    logger.info({ count: typesWithFields.length, duration }, 'Intervention types fetched successfully');

    return NextResponse.json({
      success: true,
      interventionTypes: typesWithFields,
      count: typesWithFields.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, { context: 'GET /api/intervention-types - unhandled exception', duration });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/intervention-types
// Create a new intervention type
// ============================================================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const rawBody = await request.json();

    // Validate body with Zod
    let validatedBody;
    try {
      validatedBody = interventionTypeCreateSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn({ errors: error.errors }, 'POST /api/intervention-types - Validation failed');
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

    const { data: newType, error } = await supabase
      .from('intervention_types')
      .insert({
        name: validatedBody.name,
        code: validatedBody.code,
        description: validatedBody.description || null,
        icon: validatedBody.icon || null,
        color: validatedBody.color || null,
        requires_vehicle: validatedBody.requires_vehicle,
        requires_photos: validatedBody.requires_photos,
        min_photos: validatedBody.min_photos,
        sort_order: validatedBody.sort_order,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logError(error, {
        context: 'POST /api/intervention-types',
        typeName: validatedBody.name
      });
      return NextResponse.json(
        { success: false, error: 'Failed to create intervention type' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info({
      typeId: newType.id,
      typeName: validatedBody.name,
      duration
    }, 'Intervention type created successfully');

    return NextResponse.json({
      success: true,
      interventionType: newType,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, { context: 'POST /api/intervention-types - unhandled exception', duration });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
