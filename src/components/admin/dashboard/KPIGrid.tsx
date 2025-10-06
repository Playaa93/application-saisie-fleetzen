'use client';

import { KPICard } from './KPICard';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Truck,
  TrendingUp,
  Users,
  Wrench,
  CalendarClock,
} from 'lucide-react';
import {
  calculateCompletionRate,
  calculateGrowthRate,
  formatDuration,
  formatCompactNumber,
} from '@/lib/dashboard-utils';

interface KPIGridProps {
  stats: {
    totalInterventions: number;
    completedInterventions: number;
    pendingInterventions: number;
    inProgressInterventions: number;
    activeVehiclesToday: number;
    totalVehicles: number;
    avgInterventionDuration: number; // in hours
    maintenanceRequired: number;
    interventionsThisMonth: number;
    interventionsLastMonth: number;
    totalAgents: number;
    activeAgents: number;
  };
}

export function KPIGrid({ stats }: KPIGridProps) {
  const completionRate = calculateCompletionRate(
    stats.completedInterventions,
    stats.totalInterventions
  );

  const monthlyGrowth = calculateGrowthRate(
    stats.interventionsThisMonth,
    stats.interventionsLastMonth
  );

  const vehicleUtilization = Math.round(
    (stats.activeVehiclesToday / stats.totalVehicles) * 100
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Taux de complétion */}
      <KPICard
        title="Taux de complétion"
        value={`${completionRate}%`}
        subtitle={`${stats.completedInterventions} sur ${stats.totalInterventions}`}
        icon={CheckCircle2}
        variant={completionRate >= 95 ? 'success' : completionRate >= 80 ? 'default' : 'warning'}
        trend={{
          value: completionRate - 90, // Compare to target 90%
          label: 'Objectif: 95%',
        }}
      />

      {/* Temps moyen intervention */}
      <KPICard
        title="Temps moyen"
        value={formatDuration(stats.avgInterventionDuration)}
        subtitle="Par intervention"
        icon={Clock}
        variant="default"
      />

      {/* Véhicules actifs */}
      <KPICard
        title="Véhicules actifs"
        value={`${stats.activeVehiclesToday}/${stats.totalVehicles}`}
        subtitle={`${vehicleUtilization}% utilisation`}
        icon={Truck}
        variant={vehicleUtilization >= 70 ? 'success' : 'default'}
        trend={{
          value: vehicleUtilization - 75, // Compare to target 75%
          label: 'Aujourd\'hui',
        }}
      />

      {/* Interventions en attente */}
      <KPICard
        title="En attente"
        value={stats.pendingInterventions}
        subtitle={`${stats.inProgressInterventions} en cours`}
        icon={ClipboardList}
        variant={stats.pendingInterventions > 10 ? 'warning' : 'default'}
      />

      {/* Maintenance requise */}
      <KPICard
        title="Maintenance requise"
        value={stats.maintenanceRequired}
        subtitle="Véhicules"
        icon={Wrench}
        variant={stats.maintenanceRequired > 5 ? 'danger' : 'default'}
      />

      {/* Agents actifs */}
      <KPICard
        title="Agents actifs"
        value={`${stats.activeAgents}/${stats.totalAgents}`}
        subtitle={`${Math.round((stats.activeAgents / stats.totalAgents) * 100)}% disponibles`}
        icon={Users}
        variant="default"
      />

      {/* Interventions ce mois */}
      <KPICard
        title="Ce mois"
        value={formatCompactNumber(stats.interventionsThisMonth)}
        subtitle="Interventions"
        icon={CalendarClock}
        variant="default"
        trend={{
          value: monthlyGrowth,
          label: `vs mois dernier (${stats.interventionsLastMonth})`,
        }}
      />

      {/* Croissance */}
      <KPICard
        title="Croissance"
        value={`${monthlyGrowth > 0 ? '+' : ''}${monthlyGrowth}%`}
        subtitle="vs mois dernier"
        icon={TrendingUp}
        variant={monthlyGrowth > 0 ? 'success' : monthlyGrowth < 0 ? 'danger' : 'default'}
        trend={{
          value: monthlyGrowth,
          label: `${stats.interventionsThisMonth} interventions`,
        }}
      />
    </div>
  );
}
