/**
 * Authentication Utilities
 * Password hashing and token generation
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a verification token with expiry
 */
export function generateVerificationToken(): {
  token: string;
  expiry: Date;
} {
  const token = generateToken();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hour expiry

  return { token, expiry };
}

/**
 * Generate a password reset token with expiry
 */
export function generatePasswordResetToken(): {
  token: string;
  expiry: Date;
} {
  const token = generateToken();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // 1 hour expiry

  return { token, expiry };
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
