/**
 * GET /api/stats/dashboard
 * Statistiques dashboard pour agent connecté
 * Cache: 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const revalidate = 300; // Cache 5 minutes

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

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Session invalide' },
        { status: 401 }
      );
    }

    // Get agent interventions avec détails
    const { data: interventions, error: interventionsError } = await supabase
      .from('interventions')
      .select(`
        id,
        status,
        created_at,
        metadata,
        intervention_types (
          name
        )
      `)
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false });

    if (interventionsError) {
      console.error('Error fetching interventions:', interventionsError);
      return NextResponse.json(
        { success: false, error: 'Erreur chargement données' },
        { status: 500 }
      );
    }

    // Calcul des stats
    const total = interventions?.length || 0;
    const completed = interventions?.filter(i => i.status === 'completed').length || 0;
    const inProgress = interventions?.filter(i => i.status === 'in_progress').length || 0;
    const pending = interventions?.filter(i => i.status === 'pending').length || 0;

    // Stats par type
    const byType = interventions?.reduce((acc, intervention) => {
      const type = (intervention as any).intervention_types?.name || 'Autre';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Interventions 7 derniers jours (pour graphique)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7Days = interventions?.filter(i =>
      new Date(i.created_at) >= sevenDaysAgo
    ) || [];

    // Regrouper par jour pour le graphique
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const count = last7Days.filter(intervention => {
        const createdAt = new Date(intervention.created_at);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length;

      return {
        date: dayStart.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        interventions: count,
      };
    });

    // Interventions à faire du jour (pending + in_progress)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksToday = interventions?.filter(i => {
      // Inclure pending et in_progress
      if (i.status !== 'pending' && i.status !== 'in_progress') return false;

      // Si scheduled_at existe, vérifier si c'est aujourd'hui
      if (i.scheduled_at) {
        const scheduledDate = new Date(i.scheduled_at);
        return scheduledDate >= today && scheduledDate < tomorrow;
      }

      // Sinon, inclure toutes les pending/in_progress
      return true;
    }).slice(0, 10).map(intervention => ({
      id: intervention.id,
      type: (intervention as any).intervention_types?.name || 'Type inconnu',
      status: intervention.status,
      scheduledAt: intervention.scheduled_at,
      createdAt: intervention.created_at,
      client: intervention.metadata?.client || 'N/A',
      vehicule: intervention.metadata?.vehicule || intervention.metadata?.vehicle || 'N/A',
    })) || [];

    // 5 dernières interventions (pour historique)
    const recentInterventions = interventions?.slice(0, 5).map(intervention => ({
      id: intervention.id,
      type: (intervention as any).intervention_types?.name || 'Type inconnu',
      status: intervention.status,
      createdAt: intervention.created_at,
      client: intervention.metadata?.client || 'N/A',
      vehicule: intervention.metadata?.vehicule || intervention.metadata?.vehicle || 'N/A',
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          total,
          completed,
          inProgress,
          pending,
          byType,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
        chartData,
        tasksToday,
        recentInterventions,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);

    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
