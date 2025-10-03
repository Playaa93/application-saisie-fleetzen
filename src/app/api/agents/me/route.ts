/**
 * GET /api/agents/me
 * Get authenticated agent profile with stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Session invalide' },
        { status: 401 }
      );
    }

    // Get agent profile
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, email, first_name, last_name, phone, role, is_active, created_at')
      .eq('id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Profil agent non trouvé' },
        { status: 404 }
      );
    }

    // Get agent stats
    const { data: interventions, error: statsError } = await supabase
      .from('interventions')
      .select('id, status, intervention_type, created_at')
      .eq('agent_id', user.id);

    // Calculate stats
    const totalInterventions = interventions?.length || 0;
    const completedInterventions = interventions?.filter(i => i.status === 'completed').length || 0;
    const pendingInterventions = interventions?.filter(i => i.status === 'pending').length || 0;
    const inProgressInterventions = interventions?.filter(i => i.status === 'in_progress').length || 0;

    // Get stats by type
    const statsByType = interventions?.reduce((acc, intervention) => {
      const type = intervention.intervention_type || 'Autre';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Recent interventions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentInterventions = interventions?.filter(i =>
      new Date(i.created_at) >= sevenDaysAgo
    ).length || 0;

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: agent.id,
          email: agent.email,
          firstName: agent.first_name,
          lastName: agent.last_name,
          fullName: `${agent.first_name} ${agent.last_name}`,
          phone: agent.phone,
          role: agent.role,
          isActive: agent.is_active,
          memberSince: agent.created_at,
        },
        stats: {
          total: totalInterventions,
          completed: completedInterventions,
          pending: pendingInterventions,
          inProgress: inProgressInterventions,
          recent: recentInterventions,
          byType: statsByType,
          completionRate: totalInterventions > 0
            ? Math.round((completedInterventions / totalInterventions) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);

    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
