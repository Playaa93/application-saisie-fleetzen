import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/nouvelle-intervention',
  '/interventions',
  '/historique',
  '/profil',
];

// Admin routes (require admin/super_admin role)
const adminRoutes = ['/admin'];

// Client routes (require client_users role)
const clientRoutes = ['/client'];

// Public routes that do not require authentication
const publicRoutes = ['/login'];

const assetExtensionPattern = /\.(?:svg|png|jpg|jpeg|gif|webp)$/i;

function redirectToLogin(request: NextRequest, pathname: string, errorCode?: string): NextResponse {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  if (errorCode) {
    loginUrl.searchParams.set('error', errorCode);
  }
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/service-worker.js' ||
    assetExtensionPattern.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const needsAuth =
    protectedRoutes.some(route => pathname.startsWith(route)) ||
    adminRoutes.some(route => pathname.startsWith(route)) ||
    clientRoutes.some(route => pathname.startsWith(route));

  if (!needsAuth && pathname === '/') {
    // Homepage - allow but will redirect in layout based on role
    return NextResponse.next();
  }

  if (!needsAuth) {
    return NextResponse.next();
  }

  // Optimistic auth check - read cookie only, no DB query
  // Real verification happens in Data Access Layer (DAL)
  // https://nextjs.org/docs/app/guides/authentication

  // Supabase SSR uses cookies with pattern: sb-<project-ref>-auth-token
  // Check if ANY Supabase auth cookie exists (optimistic check only)
  const cookieStore = request.cookies;
  const hasAuthCookie = cookieStore.getAll().some(cookie =>
    cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  );

  if (!hasAuthCookie) {
    // Fast redirect for unauthenticated users
    return redirectToLogin(request, pathname);
  }

  // Auth cookie exists - allow request to proceed
  // Server Components will verify session + role via DAL
  // Role-based access control happens in layout.tsx files
  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};
