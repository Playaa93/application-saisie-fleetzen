import { createClient } from '@/lib/supabase/server';
import { KPIGrid } from '@/components/admin/dashboard/KPIGrid';
import { InterventionsTrendChart } from '@/components/admin/dashboard/InterventionsTrendChart';
import { InterventionTypeChart } from '@/components/admin/dashboard/InterventionTypeChart';
import { AgentPerformanceChart } from '@/components/admin/dashboard/AgentPerformanceChart';
import { VehicleUtilizationChart } from '@/components/admin/dashboard/VehicleUtilizationChart';
import { AlertsCard } from '@/components/admin/dashboard/AlertsCard';
import { RecentInterventionsTable } from '@/components/admin/dashboard/RecentInterventionsTable';
import { transformTrendData, transformBarData, transformPieData } from '@/lib/dashboard-utils';
import { AlertCircle, Clock, Wrench } from 'lucide-react';

/**
 * Admin Dashboard 2025
 *
 * Dashboard moderne avec KPI, graphiques, et insights actionnables
 */
export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch all data in parallel for performance
  const [
    { count: totalInterventions },
    { count: completedInterventions },
    { count: pendingInterventions },
    { count: inProgressInterventions },
    { count: totalAgents },
    { count: activeAgents },
    { count: totalVehicles },
    { count: activeVehiclesToday },
    { data: recentInterventions },
    { data: trendData },
    { data: typeData },
    { data: agentData },
    { data: vehicleData },
    { count: interventionsThisMonth },
    { count: interventionsLastMonth },
  ] = await Promise.all([
    // Total interventions
    supabase.from('interventions').select('*', { count: 'exact', head: true }),

    // Completed interventions
    supabase.from('interventions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),

    // Pending interventions
    supabase.from('interventions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),

    // In progress interventions
    supabase.from('interventions').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),

    // Total agents
    supabase.from('agents').select('*', { count: 'exact', head: true }),

    // Active agents (has interventions this month)
    supabase.from('agents').select('*', { count: 'exact', head: true }).eq('is_active', true),

    // Total vehicles
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),

    // Active vehicles today (placeholder - count all for now)
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('is_active', true),

    // Recent interventions
    supabase
      .from('interventions')
      .select(`
        id,
        status,
        created_at,
        intervention_type:intervention_types(name),
        client:clients(name),
        vehicle:vehicles(license_plate),
        agent:agents(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5),

    // Trend data (last 30 days)
    supabase.rpc('get_interventions_trend', {}),

    // Top intervention types
    supabase.rpc('get_top_intervention_types', {}),

    // Top agents
    supabase.rpc('get_top_agents', {}),

    // Vehicle distribution by category
    supabase.rpc('get_vehicle_distribution', {}),

    // This month interventions
    supabase
      .from('interventions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

    // Last month interventions
    supabase
      .from('interventions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString())
      .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  // Calculate additional metrics
  const avgInterventionDuration = 2.5; // Placeholder - calculate from actual data
  const maintenanceRequired = 3; // Placeholder - query vehicles needing maintenance

  // Prepare KPI stats
  const kpiStats = {
    totalInterventions: totalInterventions || 0,
    completedInterventions: completedInterventions || 0,
    pendingInterventions: pendingInterventions || 0,
    inProgressInterventions: inProgressInterventions || 0,
    activeVehiclesToday: activeVehiclesToday || 0,
    totalVehicles: totalVehicles || 0,
    avgInterventionDuration,
    maintenanceRequired,
    interventionsThisMonth: interventionsThisMonth || 0,
    interventionsLastMonth: interventionsLastMonth || 0,
    totalAgents: totalAgents || 0,
    activeAgents: activeAgents || 0,
  };

  // Transform chart data
  const trendChartData = trendData ? transformTrendData(trendData) : [];
  const typeChartData = typeData ? transformBarData(typeData) : [];
  const agentChartData = agentData ? transformBarData(agentData) : [];
  const vehicleChartData = vehicleData ? transformPieData(vehicleData) : [];

  // Prepare alerts
  const alerts = [];
  if (pendingInterventions && pendingInterventions > 10) {
    alerts.push({
      id: '1',
      type: 'warning' as const,
      icon: Clock,
      title: 'Interventions en attente',
      description: `${pendingInterventions} interventions nécessitent une assignation`,
      action: { label: 'Voir les interventions', href: '/admin/interventions' },
      count: pendingInterventions,
    });
  }
  if (maintenanceRequired > 0) {
    alerts.push({
      id: '2',
      type: 'danger' as const,
      icon: Wrench,
      title: 'Maintenance requise',
      description: `${maintenanceRequired} véhicules nécessitent une maintenance`,
      action: { label: 'Voir les véhicules', href: '/admin/vehicles' },
      count: maintenanceRequired,
    });
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord Admin</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de FleetZen - {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* KPI Grid */}
      <KPIGrid stats={kpiStats} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InterventionsTrendChart data={trendChartData} />
        <AlertsCard alerts={alerts} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InterventionTypeChart data={typeChartData} />
        <AgentPerformanceChart data={agentChartData} />
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VehicleUtilizationChart data={vehicleChartData} />
        <div className="lg:col-span-2">
          <RecentInterventionsTable interventions={recentInterventions || []} />
        </div>
      </div>
    </div>
  );
}
