'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChartData } from '@/lib/dashboard-utils';

interface InterventionTypeChartProps {
  data: BarChartData[];
}

export function InterventionTypeChart({ data }: InterventionTypeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Types d'Interventions</CardTitle>
        <CardDescription>
          Les 5 types d'interventions les plus fréquents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              label={{ position: 'right', fill: 'hsl(var(--muted-foreground))' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
