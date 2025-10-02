/**
 * POST /api/auth/login
 * Agent Authentication Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { agents } from '@/db/schema';
import { agentSessions } from '@/db/intervention-schema';
import { eq, and } from 'drizzle-orm';
import { verifyPassword } from '@/utils/auth';
import { generateAuthToken } from '@/middleware/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find agent by email
    const [user] = await db
      .select({
        id: agents.id,
        email: agents.email,
        passwordHash: agents.passwordHash,
        fullName: agents.firstName,
        role: agents.role,
        organizationId: agents.id, // No organization in agents table
        isActive: agents.isActive,
      })
      .from(agents)
      .where(eq(agents.email, validatedData.email.toLowerCase()))
      .limit(1);

    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      validatedData.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const [session] = await db
      .insert(agentSessions)
      .values({
        agentId: user.id,
        token: '', // Will be updated after token generation
        deviceId: validatedData.deviceId,
        deviceName: validatedData.deviceName,
        deviceType: validatedData.deviceType,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        isActive: true,
        expiresAt,
        lastActivityAt: new Date(),
      })
      .returning();

    // Generate JWT token
    const token = await generateAuthToken(user.id, session.id);

    // Update session with token
    await db
      .update(agentSessions)
      .set({ token })
      .where(eq(agentSessions.id, session.id));

    // Update last login timestamp
    await db
      .update(agents)
      .set({ lastLoginAt: new Date() })
      .where(eq(agents.id, user.id));

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
