/**
 * API Response Helpers
 */

import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  meta?: {
    count?: number;
    total?: number;
    limit?: number;
    offset?: number;
    [key: string]: any;
  };
}

export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta'],
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

export function errorResponse(
  error: string,
  details?: any,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  );
}

export function createdResponse<T>(
  data: T,
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse<T>> {
  return successResponse(data, meta, 201);
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse(message, undefined, 401);
}

export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse(message, undefined, 403);
}

export function notFoundResponse(
  message: string = 'Resource not found'
): NextResponse<ApiResponse> {
  return errorResponse(message, undefined, 404);
}
