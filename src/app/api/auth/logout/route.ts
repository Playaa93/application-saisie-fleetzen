import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 * Déconnexion de l'utilisateur avec suppression des cookies Supabase
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();

    // Déconnecter l'utilisateur Supabase
    await supabase.auth.signOut();

    // Supprimer explicitement tous les cookies Supabase
    const allCookies = cookieStore.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        cookieStore.delete(cookie.name);
      }
    });

    return NextResponse.json(
      { success: true, message: 'Déconnexion réussie' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout
 * Redirection pour les appels GET (fallback)
 */
export async function GET() {
  // Rediriger vers la page de login avec un message
  return NextResponse.redirect(new URL('/login?message=use-post-method', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
