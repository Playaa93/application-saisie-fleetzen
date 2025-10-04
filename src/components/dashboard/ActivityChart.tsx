"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface ChartDataPoint {
  date: string;
  interventions: number;
}

interface ActivityChartProps {
  chartData: ChartDataPoint[];
}

/**
 * ActivityChart - Client Component (for interactivity)
 *
 * Receives pre-authenticated data from Server Component parent.
 * No useEffect, no fetch() = no 401 errors.
 *
 * @see src/app/profil/page.tsx - Data fetched server-side via DAL
 */
export function ActivityChart({ chartData }: ActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Activité des 7 derniers jours
        </CardTitle>
        <CardDescription>Évolution de vos interventions sur la semaine</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Bar
              dataKey="interventions"
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
