"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

interface CompletionData {
  total: number;
  completed: number;
  completionRate: number;
}

export function CompletionCard() {
  const [data, setData] = useState<CompletionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompletion();
  }, []);

  const fetchCompletion = async () => {
    try {
      const token = localStorage.getItem("sb-access-token");

      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/stats/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const { total, completed, completionRate } = result.data.stats;
        setData({ total, completed, completionRate });
      }
    } catch (err) {
      console.error("Completion fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-24">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="h-24 border-primary/20 bg-gradient-to-r from-primary/5 to-background">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Tournée du jour</span>
          </div>
          <span className="text-2xl font-bold text-primary">{data.completionRate}%</span>
        </div>
        <div className="space-y-1">
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${data.completionRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {data.completed}/{data.total} interventions
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
