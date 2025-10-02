/**
 * API Error Handler Utilities
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  // Custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Database errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string; detail?: string };

    // PostgreSQL error codes
    switch (dbError.code) {
      case '23505': // Unique violation
        return NextResponse.json(
          { error: 'Resource already exists', details: dbError.detail },
          { status: 409 }
        );
      case '23503': // Foreign key violation
        return NextResponse.json(
          { error: 'Referenced resource not found', details: dbError.detail },
          { status: 400 }
        );
      case '23502': // Not null violation
        return NextResponse.json(
          { error: 'Required field missing', details: dbError.detail },
          { status: 400 }
        );
    }
  }

  // Default error
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
