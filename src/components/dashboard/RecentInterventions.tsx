"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

interface RecentIntervention {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  client: string;
  vehicule: string;
}

export function RecentInterventions() {
  const [interventions, setInterventions] = useState<RecentIntervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecentInterventions();
  }, []);

  const fetchRecentInterventions = async () => {
    try {
      const token = localStorage.getItem("sb-access-token");

      if (!token) {
        setError("Non authentifié");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/stats/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Erreur lors du chargement");
        setIsLoading(false);
        return;
      }

      setInterventions(result.data.recentInterventions || []);
    } catch (err) {
      console.error("Recent interventions fetch error:", err);
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Terminée
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="default" className="bg-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interventions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interventions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (interventions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interventions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune intervention récente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Interventions récentes</CardTitle>
        <Link
          href="/interventions/history"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Voir tout
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {interventions.map((intervention) => (
            <Link
              key={intervention.id}
              href={`/interventions/${intervention.id}`}
              className="block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{intervention.type}</p>
                    {getStatusBadge(intervention.status)}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="truncate">
                      <span className="font-medium">Client:</span> {intervention.client}
                    </p>
                    <p className="truncate">
                      <span className="font-medium">Véhicule:</span> {intervention.vehicule}
                    </p>
                    <p>
                      {new Date(intervention.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
