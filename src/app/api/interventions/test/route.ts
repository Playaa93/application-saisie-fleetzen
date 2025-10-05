import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

// Endpoint de test ultra-simple pour vérifier que les API routes fonctionnent
export async function GET() {
  logger.info('Test endpoint called successfully');

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    message: 'API routes are working!',
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  });
}
