/**
 * POST /api/auth/login
 * Agent Authentication with Supabase Auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email.toLowerCase(),
      password: validatedData.password,
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError?.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Email ou mot de passe incorrect'
        },
        { status: 401 }
      );
    }

    // Get agent metadata from agents table
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, email, first_name, last_name, phone, role, is_active')
      .eq('id', authData.user.id)
      .single();

    if (agentError || !agent) {
      console.error('Agent fetch error:', agentError?.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Profil agent non trouvé'
        },
        { status: 404 }
      );
    }

    // Check if agent is active
    if (!agent.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Compte désactivé. Contactez l\'administrateur.'
        },
        { status: 403 }
      );
    }

    // Return success with session and agent data
    return NextResponse.json({
      success: true,
      data: {
        session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_at: authData.session?.expires_at,
          expires_in: authData.session?.expires_in,
        },
        user: {
          id: agent.id,
          email: agent.email,
          firstName: agent.first_name,
          lastName: agent.last_name,
          fullName: `${agent.first_name} ${agent.last_name}`,
          phone: agent.phone,
          role: agent.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur'
      },
      { status: 500 }
    );
  }
}
