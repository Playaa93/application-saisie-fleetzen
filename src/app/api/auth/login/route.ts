import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Explicit runtime configuration for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('=== START POST /api/auth/login ===');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration');
    return NextResponse.json({
      success: false,
      error: 'Configuration Supabase manquante',
      errorCode: 'CONFIGURATION_MISSING',
    }, { status: 500 });
  }

  let body: { email?: string; password?: string } | null = null;

  try {
    body = await request.json();
  } catch (error) {
    console.error('Invalid JSON payload', error);
    return NextResponse.json({
      success: false,
      error: 'Corps JSON invalide',
      errorCode: 'INVALID_JSON',
    }, { status: 400 });
  }

  const email = body?.email?.toLowerCase().trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({
      success: false,
      error: 'Email et mot de passe requis',
      errorCode: 'CREDENTIALS_MISSING',
    }, { status: 400 });
  }

  console.log(`Attempting login for: ${email}`);

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('Login error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Erreur de connexion',
        errorCode: 'AUTH_SIGN_IN_FAILED',
      }, { status: 401 });
    }

    if (!data.session || !data.user) {
      return NextResponse.json({
        success: false,
        error: 'Aucune session creee',
        errorCode: 'SESSION_MISSING',
      }, { status: 401 });
    }

    console.log('Login successful');

    const session = {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in ?? 3600,
      expiresAt: data.session.expires_at,
      tokenType: data.session.token_type ?? 'bearer',
    };

    const user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    };

    const response = NextResponse.json({
      success: true,
      data: {
        user,
        session,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });

    response.cookies.set('sb-access-token', session.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: session.expiresIn,
    });

    response.cookies.set('sb-refresh-token', session.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('=== ERROR in POST /api/auth/login ===', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      message,
      errorCode: 'UNEXPECTED_ERROR',
    }, { status: 500 });
  }
}
