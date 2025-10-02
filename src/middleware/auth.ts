/**
 * Authentication Middleware for Field Agents
 * JWT-based authentication with session management
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/db';
import { agentSessions } from '@/db/intervention-schema';
import { eq, and, gt } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    organizationId: string;
  };
  session?: {
    id: string;
    token: string;
  };
}

/**
 * Extract JWT token from request headers
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  // Support "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}

/**
 * Verify JWT token and validate session
 */
export async function authenticateAgent(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
}> {
  try {
    // Extract token from request
    const token = extractToken(request);

    if (!token) {
      return { success: false, error: 'No authentication token provided' };
    }

    // Verify JWT token
    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (error) {
      return { success: false, error: 'Invalid or expired token' };
    }

    if (!payload.userId || !payload.sessionId) {
      return { success: false, error: 'Invalid token payload' };
    }

    // Validate session in database
    const [session] = await db
      .select()
      .from(agentSessions)
      .where(
        and(
          eq(agentSessions.id, payload.sessionId as string),
          eq(agentSessions.token, token),
          eq(agentSessions.isActive, true),
          gt(agentSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      return { success: false, error: 'Session not found or expired' };
    }

    // Get user details
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        organizationId: users.organizationId,
        isActive: users.isActive,
      })
      .from(users)
      .where(
        and(
          eq(users.id, payload.userId as string),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    if (!user) {
      return { success: false, error: 'User not found or inactive' };
    }

    // Update last activity timestamp
    await db
      .update(agentSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(agentSessions.id, session.id));

    return {
      success: true,
      user,
      session: {
        id: session.id,
        token: session.token,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Middleware wrapper for protected routes
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await authenticateAgent(request);

  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  // Attach user and session to request
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = auth.user;
  authenticatedRequest.session = auth.session;

  return handler(authenticatedRequest);
}

/**
 * Role-based access control
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[],
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await authenticateAgent(request);

  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!allowedRoles.includes(auth.user.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = auth.user;
  authenticatedRequest.session = auth.session;

  return handler(authenticatedRequest);
}

/**
 * Generate JWT token for authenticated session
 */
export async function generateAuthToken(
  userId: string,
  sessionId: string
): Promise<string> {
  const { SignJWT } = await import('jose');

  const token = await new SignJWT({
    userId,
    sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // 30 days
    .sign(JWT_SECRET);

  return token;
}
