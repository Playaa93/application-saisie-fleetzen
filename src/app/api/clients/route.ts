import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// GET /api/clients
// Fetch all active clients
// ============================================================================
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: clients, error } = await supabase
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
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clients: clients || [],
      count: clients?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/clients:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
