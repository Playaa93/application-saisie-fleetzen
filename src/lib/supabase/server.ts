/**
 * Server-side Supabase Client (Next.js 15 App Router)
 *
 * For use in Server Components, Server Actions, and Route Handlers.
 * Uses cookies() to maintain user session.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Admin Supabase Client with Service Role Key
 *
 * ⚠️ SECURITY WARNING:
 * - This client bypasses ALL Row Level Security (RLS) policies
 * - ONLY use in Server Actions/Components (never expose to client)
 * - ALWAYS verify user authentication before using this client
 * - The service role key is stored in .env.local (gitignored)
 * - Never log, return, or expose data from this client to frontend
 *
 * @example
 * // ✅ CORRECT: Verify auth first
 * const { data: { user } } = await supabase.auth.getUser();
 * if (!user?.user_metadata?.role === 'admin') throw new Error('Unauthorized');
 * const adminClient = createAdminClient();
 *
 * @example
 * // ❌ WRONG: Direct use without auth check
 * const adminClient = createAdminClient();
 * const data = await adminClient.from('users').select('*'); // DANGEROUS!
 */
export function createAdminClient() {
  // gitguardian:ignore - Service role key read from environment variable
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Loaded from .env.local (not committed)
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
