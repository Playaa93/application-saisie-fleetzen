import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger, { logError } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Exact copy of /api/clients pattern but for interventions table
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: interventions, error } = await supabase
      .from('interventions')
      .select('id, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logError(error, { context: 'GET /api/interventions/simple - Supabase query' });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch interventions' },
        { status: 500 }
      );
    }

    logger.debug({ count: interventions?.length || 0 }, 'Simple interventions fetched successfully');

    return NextResponse.json({
      success: true,
      interventions: interventions || [],
      count: interventions?.length || 0,
    });
  } catch (error) {
    logError(error, { context: 'GET /api/interventions/simple - unhandled exception' });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
