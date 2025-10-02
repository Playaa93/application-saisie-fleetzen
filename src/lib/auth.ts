/**
 * Authentication utilities
 * Password hashing, JWT generation/verification
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '30d';

// ============================================================================
// PASSWORD HASHING
// ============================================================================

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// ============================================================================
// JWT TOKENS
// ============================================================================

interface JWTPayload {
  agentId: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Generate a JWT token for an agent
 */
export function generateJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract JWT from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Middleware helper to verify authenticated requests
 */
export function verifyAuthToken(authHeader: string | null): JWTPayload | null {
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    return null;
  }
  return verifyJWT(token);
}
