import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// GET /api/intervention-types
// Fetch all active intervention types with their dynamic fields
// ============================================================================
export async function GET() {
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
      console.error('Error fetching intervention types:', typesError);
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
      console.error('Error fetching intervention fields:', fieldsError);
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

    return NextResponse.json({
      success: true,
      interventionTypes: typesWithFields,
      count: typesWithFields.length,
    });
  } catch (error) {
    console.error('Error in GET /api/intervention-types:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
