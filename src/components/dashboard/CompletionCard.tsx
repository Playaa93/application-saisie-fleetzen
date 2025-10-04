"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

interface CompletionCardProps {
  stats: {
    total: number;
    completed: number;
    completionRate: number;
  };
}

/**
 * CompletionCard - Client Component (for interactivity)
 *
 * Receives pre-authenticated data from Server Component parent.
 * No useEffect, no fetch() = no 401 errors.
 *
 * @see src/app/page.tsx - Data fetched server-side via DAL
 */
export function CompletionCard({ stats }: CompletionCardProps) {
  return (
    <Card className="h-24 border-primary/20 bg-gradient-to-r from-primary/5 to-background">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Tournée du jour</span>
          </div>
          <span className="text-2xl font-bold text-primary">{stats.completionRate}%</span>
        </div>
        <div className="space-y-1">
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {stats.completed}/{stats.total} interventions
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
