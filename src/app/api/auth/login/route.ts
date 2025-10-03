import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  console.log('=== START POST /api/auth/login ===');

  try {
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables');
      return NextResponse.json({
        error: 'Configuration error: Missing Supabase credentials'
      }, { status: 500 });
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        error: 'Email et mot de passe requis'
      }, { status: 400 });
    }

    console.log(`Attempting login for: ${email}`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login error:', error);
      return NextResponse.json({
        error: error.message || 'Erreur de connexion'
      }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json({
        error: 'Aucune session créée'
      }, { status: 401 });
    }

    console.log('✅ Login successful');

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      }
    });

  } catch (error) {
    console.error('=== ERROR in POST /api/auth/login ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      error: 'Internal server error',
      message: errorMessage
    }, { status: 500 });
  }
}
