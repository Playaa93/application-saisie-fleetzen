import { NextResponse } from 'next/server';

// Test endpoint to isolate Supabase import issue
export async function GET() {
  try {
    console.log('Debug endpoint called');

    // Test 1: Can we import createClient?
    const { createClient } = await import('@supabase/supabase-js');
    console.log('✅ Supabase import successful');

    // Test 2: Can we access env vars?
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('✅ Env vars accessible');

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing credentials',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }

    // Test 3: Can we create client?
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    return NextResponse.json({
      success: true,
      message: 'All Supabase checks passed',
      hasClient: !!supabase
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug check failed',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined
    }, { status: 500 });
  }
}
