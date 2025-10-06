/**
 * Dashboard utility functions
 * Helpers pour calculs KPI et formatage données charts
 */

export interface DashboardStats {
  totalInterventions: number;
  totalAgents: number;
  totalClients: number;
  totalVehicles: number;
  completedInterventions: number;
  pendingInterventions: number;
  inProgressInterventions: number;
  activeVehiclesToday: number;
  avgInterventionDuration: number;
  maintenanceRequired: number;
  interventionsThisMonth: number;
  interventionsLastMonth: number;
}

/**
 * Calculate completion rate percentage
 */
export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Calculate growth rate between two periods
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Format duration in hours to human-readable string
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}min`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}j ${remainingHours}h`;
}

/**
 * Format number with K/M suffixes
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Get trend indicator (up, down, stable)
 */
export function getTrendIndicator(growth: number): 'up' | 'down' | 'stable' {
  if (growth > 5) return 'up';
  if (growth < -5) return 'down';
  return 'stable';
}

/**
 * Get status badge variant based on intervention status
 */
export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'pending':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Get status color for charts
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'hsl(var(--chart-1))'; // Green
    case 'in_progress':
      return 'hsl(var(--chart-2))'; // Blue
    case 'pending':
      return 'hsl(var(--chart-3))'; // Orange
    case 'cancelled':
      return 'hsl(var(--chart-4))'; // Red
    default:
      return 'hsl(var(--chart-5))'; // Gray
  }
}

/**
 * Transform data for trend chart (interventions over time)
 */
export interface TrendChartData {
  date: string;
  completed: number;
  in_progress: number;
  pending: number;
}

export function transformTrendData(rawData: any[]): TrendChartData[] {
  // Group by date and status
  const grouped = rawData.reduce((acc, item) => {
    const date = new Date(item.date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
    if (!acc[date]) {
      acc[date] = { date, completed: 0, in_progress: 0, pending: 0 };
    }
    acc[date][item.status as keyof Omit<TrendChartData, 'date'>] = item.count;
    return acc;
  }, {} as Record<string, TrendChartData>);

  return Object.values(grouped);
}

/**
 * Transform data for bar chart (intervention types)
 */
export interface BarChartData {
  name: string;
  count: number;
  fill: string;
}

export function transformBarData(rawData: any[]): BarChartData[] {
  return rawData.map((item, index) => ({
    name: item.name,
    count: item.count,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`,
  }));
}

/**
 * Transform data for pie chart (vehicle categories)
 */
export interface PieChartData {
  name: string;
  value: number;
  fill: string;
}

export function transformPieData(rawData: any[]): PieChartData[] {
  const categoryLabels: Record<string, string> = {
    tracteur: 'Tracteur',
    porteur: 'Porteur',
    remorque: 'Remorque',
    ensemble_complet: 'Ensemble complet',
    autre: 'Autre',
  };

  return rawData.map((item, index) => ({
    name: categoryLabels[item.vehicle_category] || item.vehicle_category,
    value: item.count,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`,
  }));
}
