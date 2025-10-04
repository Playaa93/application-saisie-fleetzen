import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/nouvelle-intervention',
  '/interventions',
  '/historique',
  '/profil',
];

// Public routes that do not require authentication
const publicRoutes = ['/login', '/'];

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

  const needsAuth = protectedRoutes.some(route => pathname.startsWith(route));

  if (!needsAuth) {
    return NextResponse.next();
  }

  // Optimistic auth check - read cookie only, no DB query
  // Real verification happens in Data Access Layer (DAL)
  // https://nextjs.org/docs/app/guides/authentication
  const token = request.cookies.get('sb-access-token')?.value;

  if (!token) {
    // Fast redirect for unauthenticated users
    return redirectToLogin(request, pathname);
  }

  // Token exists - allow request to proceed
  // Server Components will verify session via DAL
  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};
