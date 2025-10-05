import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import logger, { logError } from '@/lib/logger';
import { loginSchema } from '@/lib/validations/api';
import { ZodError } from 'zod';

// Explicit runtime configuration for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  // Parse and validate request body with Zod
  let body;
  try {
    const rawBody = await request.json();
    body = loginSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn({ errors: error.errors }, 'Login validation failed');
      return NextResponse.json({
        success: false,
        error: 'Données invalides',
        errorCode: 'VALIDATION_ERROR',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      }, { status: 400 });
    }

    logError(error, { context: 'POST /api/auth/login - Invalid JSON' });
    return NextResponse.json({
      success: false,
      error: 'Corps JSON invalide',
      errorCode: 'INVALID_JSON',
    }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();
  const password = body.password;

  logger.debug({ email }, 'Login attempt started'); // email sera automatiquement redacted

  try {
    // Use SSR client (same as DAL) to ensure cookie compatibility
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const duration = Date.now() - startTime;
      logError(error, {
        context: 'POST /api/auth/login - Sign in failed',
        email, // sera redacted
        duration
      });
      return NextResponse.json({
        success: false,
        error: error.message || 'Erreur de connexion',
        errorCode: 'AUTH_SIGN_IN_FAILED',
      }, { status: 401 });
    }

    if (!data.session || !data.user) {
      logger.warn({ email }, 'Login succeeded but no session created');
      return NextResponse.json({
        success: false,
        error: 'Aucune session creee',
        errorCode: 'SESSION_MISSING',
      }, { status: 401 });
    }

    const duration = Date.now() - startTime;
    logger.info({
      userId: data.user.id,
      email: data.user.email, // sera redacted
      duration
    }, 'Login successful');

    // Supabase SSR client handles cookies automatically
    // Return minimal user data for client
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresIn: data.session.expires_in ?? 3600,
          expiresAt: data.session.expires_at,
          tokenType: data.session.token_type ?? 'bearer',
        },
      },
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, {
      context: 'POST /api/auth/login - Unexpected error',
      duration
    });
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      message,
      errorCode: 'UNEXPECTED_ERROR',
    }, { status: 500 });
  }
}
