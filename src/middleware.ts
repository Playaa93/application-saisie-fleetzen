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

  const tokenFromCookie = request.cookies.get('sb-access-token')?.value;
  const tokenFromHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return redirectToLogin(request, pathname);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware');
    return redirectToLogin(request, pathname, 'configuration_error');
  }

  try {
    const verificationResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
      cache: 'no-store',
    });

    if (!verificationResponse.ok) {
      console.error('Supabase token validation failed', verificationResponse.status);
      return redirectToLogin(request, pathname, 'session_expired');
    }

    const user = await verificationResponse.json();
    const response = NextResponse.next();

    if (user?.id) {
      response.headers.set('x-user-id', user.id);
    }

    if (user?.email) {
      response.headers.set('x-user-email', user.email);
    }

    return response;
  } catch (error) {
    console.error('Middleware error while validating token:', error);
    return redirectToLogin(request, pathname);
  }
}

export const config = {
  matcher: ['/:path*'],
};
