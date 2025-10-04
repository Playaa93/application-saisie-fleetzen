/**
 * Data Access Layer (DAL)
 *
 * Centralized data access with authentication verification.
 * Following Next.js 15 2025 best practices - verify auth as close to data source as possible.
 *
 * @see https://nextjs.org/docs/app/guides/authentication
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

/**
 * Verify user session and return authenticated Supabase client.
 * Uses React cache() to avoid repeated auth checks within the same request.
 *
 * @throws Redirects to /login if session is invalid
 * @returns {Promise<{ user, supabase }>} Authenticated user and Supabase client
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();

  // Use getUser() not getSession() - more secure
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { data: { user }, error } = await supabase.auth.getUser();

  console.log('🔍 DAL verifySession:', { hasUser: !!user, error: error?.message });

  if (error || !user) {
    console.log('❌ No user found, redirecting to /login');
    redirect('/login');
  }

  console.log('✅ User authenticated:', user.email);
  return { user, supabase };
});

/**
 * Get dashboard statistics for authenticated agent.
 *
 * @returns {Promise<{ total, completed, completionRate, tasksToday }>}
 */
export async function getDashboardStats() {
  const { user, supabase } = await verifySession();

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch all interventions for this agent today
  const { data: interventions, error: interventionsError } = await supabase
    .from('interventions')
    .select(`
      id,
      status,
      scheduled_at,
      intervention_type:intervention_types(name),
      client:clients(name),
      vehicle:vehicles(license_plate)
    `)
    .eq('agent_id', user.id)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString());

  if (interventionsError) {
    console.error('Error fetching interventions:', interventionsError);
    throw interventionsError;
  }

  const total = interventions?.length || 0;
  const completed = interventions?.filter(i => i.status === 'completed').length || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Tasks today = pending + in_progress
  const tasksToday = interventions?.filter(i =>
    i.status === 'pending' || i.status === 'in_progress'
  ).map(i => ({
    id: i.id,
    type: i.intervention_type?.name || 'Inconnu',
    status: i.status,
    scheduledAt: i.scheduled_at,
    client: i.client?.name || 'Inconnu',
    vehicule: i.vehicle?.license_plate || 'Inconnu'
  })) || [];

  return {
    stats: {
      total,
      completed,
      completionRate
    },
    tasksToday
  };
}

/**
 * Get agent profile information with stats.
 *
 * @returns {Promise<{ profile, stats }>}
 */
export async function getAgentProfile() {
  const { user, supabase } = await verifySession();

  // Fetch profile
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', user.id)
    .single();

  if (agentError) {
    console.error('Error fetching agent profile:', agentError);
    throw agentError;
  }

  // Fetch all interventions for stats
  const { data: interventions, error: interventionsError } = await supabase
    .from('interventions')
    .select(`
      id,
      status,
      created_at,
      intervention_type:intervention_types(name)
    `)
    .eq('agent_id', user.id);

  if (interventionsError) {
    console.error('Error fetching interventions:', interventionsError);
    throw interventionsError;
  }

  // Calculate stats
  const total = interventions?.length || 0;
  const completed = interventions?.filter(i => i.status === 'completed').length || 0;
  const pending = interventions?.filter(i => i.status === 'pending').length || 0;
  const inProgress = interventions?.filter(i => i.status === 'in_progress').length || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Count by type
  const byType: Record<string, number> = {};
  interventions?.forEach(i => {
    const type = i.intervention_type?.name || 'Inconnu';
    byType[type] = (byType[type] || 0) + 1;
  });

  return {
    profile: {
      id: agent.id,
      email: agent.email,
      firstName: agent.first_name,
      lastName: agent.last_name,
      fullName: `${agent.first_name} ${agent.last_name}`,
      phone: agent.phone || '',
      role: agent.role,
      isActive: agent.is_active,
      memberSince: agent.created_at
    },
    stats: {
      total,
      completed,
      pending,
      inProgress,
      recent: interventions?.filter(i => {
        const createdAt = new Date(i.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdAt >= thirtyDaysAgo;
      }).length || 0,
      byType,
      completionRate
    }
  };
}

/**
 * Get activity chart data for last 7 days.
 *
 * @returns {Promise<ChartDataPoint[]>}
 */
export async function getAgentActivityChart() {
  const { user, supabase } = await verifySession();

  // Get interventions for last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: interventions, error } = await supabase
    .from('interventions')
    .select('created_at')
    .eq('agent_id', user.id)
    .gte('created_at', sevenDaysAgo.toISOString());

  if (error) {
    console.error('Error fetching activity chart:', error);
    throw error;
  }

  // Generate chart data for last 7 days
  const chartData: { date: string; interventions: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

    const count = interventions?.filter(intervention => {
      const interventionDate = new Date(intervention.created_at);
      return interventionDate.toDateString() === date.toDateString();
    }).length || 0;

    chartData.push({ date: dateStr, interventions: count });
  }

  return chartData;
}

/**
 * Get interventions for authenticated agent.
 *
 * @param {object} filters - Optional filters (status, date range, etc.)
 * @returns {Promise<Intervention[]>}
 */
export async function getInterventions(filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const { user, supabase } = await verifySession();

  let query = supabase
    .from('interventions')
    .select(`
      *,
      intervention_type:intervention_types(name),
      client:clients(name),
      vehicle:vehicles(license_plate, brand, model)
    `)
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching interventions:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new intervention (Server Action).
 *
 * @param {FormData} formData - Intervention form data
 * @returns {Promise<{ id: string }>}
 */
export async function createIntervention(formData: FormData) {
  const { user, supabase } = await verifySession();

  // Validation and business logic here
  // This is called from a Server Action, so it's already server-side

  const interventionData = {
    agent_id: user.id,
    // ... extract and validate form data
  };

  const { data, error } = await supabase
    .from('interventions')
    .insert([interventionData])
    .select()
    .single();

  if (error) {
    console.error('Error creating intervention:', error);
    throw error;
  }

  return data;
}
