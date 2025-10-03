import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT secret - IMPORTANT: use strong secret in production
const JWT_SECRET = process.env.JWT_SECRET || 'fleetzen-super-secret-key-change-in-production-2025';
const JWT_EXPIRES_IN = '7d'; // 7 days

export interface AgentPayload {
  id: string;
  email: string;
  role: 'admin' | 'supervisor' | 'field_agent';
  firstName: string;
  lastName: string;
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for agent
 */
export function generateToken(agent: AgentPayload): string {
  return jwt.sign(
    {
      id: agent.id,
      email: agent.email,
      role: agent.role,
      firstName: agent.firstName,
      lastName: agent.lastName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): AgentPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AgentPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Get agent from request headers
 */
export function getAgentFromHeaders(headers: Headers): AgentPayload | null {
  const authHeader = headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) return null;

  return verifyToken(token);
}
