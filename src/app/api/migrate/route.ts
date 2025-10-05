import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger, { logError } from '@/lib/logger';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'public' },
      auth: { persistSession: false }
    });

    logger.info('Applying database migration...');

    // Execute ALTER TABLE statements using Supabase SQL
    const alterColumns = await supabase.rpc('exec', {
      query: `
        ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS work_site VARCHAR(200);
        ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_category VARCHAR(50);
      `
    });

    logger.debug({ alterColumns }, 'Columns added');

    // Create indexes
    const createIndexes = await supabase.rpc('exec', {
      query: `
        CREATE INDEX IF NOT EXISTS vehicles_work_site_idx ON vehicles(work_site);
        CREATE INDEX IF NOT EXISTS vehicles_category_idx ON vehicles(vehicle_category);
        CREATE INDEX IF NOT EXISTS vehicles_client_site_idx ON vehicles(client_id, work_site);
        CREATE INDEX IF NOT EXISTS vehicles_client_site_category_idx ON vehicles(client_id, work_site, vehicle_category);
      `
    });

    logger.debug({ createIndexes }, 'Indexes created');

    return NextResponse.json({
      success: true,
      message: 'Migration applied successfully - added work_site and vehicle_category columns',
      alterColumns,
      createIndexes
    });

  } catch (error: any) {
    logError(error, { context: 'POST /api/migrate - migration error' });

    return NextResponse.json(
      { success: false, error: error.message, details: error },
      { status: 500 }
    );
  }
}
