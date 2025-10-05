import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiting avec Upstash Redis (recommandé pour Vercel)
 *
 * Configuration:
 * - UPSTASH_REDIS_REST_URL (dans .env.local)
 * - UPSTASH_REDIS_REST_TOKEN (dans .env.local)
 *
 * Limites par défaut:
 * - API publiques: 10 requêtes / 10 secondes par IP
 * - API authentifiées: 100 requêtes / minute par utilisateur
 *
 * Utilisation:
 * ```typescript
 * import { rateLimitByIP, rateLimitByUser } from '@/lib/rate-limit';
 *
 * // Dans une API route
 * const ip = request.headers.get('x-forwarded-for') || 'unknown';
 * const { success } = await rateLimitByIP(ip);
 * if (!success) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */

// Vérifier que les variables d'environnement sont définies
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Si pas configuré, utiliser un mock en développement (pas de rate limiting)
const isDevelopment = process.env.NODE_ENV !== 'production';
const isConfigured = upstashUrl && upstashToken;

// Créer le client Redis Upstash
const redis = isConfigured
  ? new Redis({
      url: upstashUrl,
      token: upstashToken,
    })
  : null;

// Rate limiter pour les API publiques (par IP)
export const rateLimitByIP = isConfigured
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requêtes par 10 secondes
      analytics: true,
      prefix: 'ratelimit:ip',
    })
  : {
      // Mock pour développement
      limit: async () => ({
        success: true,
        limit: 10,
        remaining: 10,
        reset: Date.now() + 10000,
        pending: Promise.resolve(),
      }),
    };

// Rate limiter pour les API authentifiées (par user ID)
export const rateLimitByUser = isConfigured
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requêtes par minute
      analytics: true,
      prefix: 'ratelimit:user',
    })
  : {
      // Mock pour développement
      limit: async () => ({
        success: true,
        limit: 100,
        remaining: 100,
        reset: Date.now() + 60000,
        pending: Promise.resolve(),
      }),
    };

// Rate limiter pour les endpoints critiques (login, register)
export const rateLimitAuth = isConfigured
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 tentatives par 15 minutes
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : {
      // Mock pour développement
      limit: async () => ({
        success: true,
        limit: 5,
        remaining: 5,
        reset: Date.now() + 900000,
        pending: Promise.resolve(),
      }),
    };

/**
 * Helper pour extraire l'IP du client depuis les headers Next.js
 */
export function getClientIP(request: Request): string {
  // Vercel forwards the client IP in x-forwarded-for
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Fallback pour développement local
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Log en développement si rate limiting n'est pas configuré
 */
if (isDevelopment && !isConfigured) {
  console.warn(
    '[Rate Limit] Upstash Redis non configuré - rate limiting désactivé en développement'
  );
  console.warn('[Rate Limit] Ajouter UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN dans .env.local');
}
