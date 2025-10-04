"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileEdit, ArrowRight, Clock } from "lucide-react";
import { listDrafts, type DraftData } from "@/lib/indexedDB";

export function DraftsListHome() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const allDrafts = await listDrafts();
      // Sort by timestamp descending (newest first)
      allDrafts.sort((a, b) => b.timestamp - a.timestamp);
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInterventionLabel = (type: string) => {
    switch (type) {
      case 'lavage':
        return '🚛 Lavage Véhicule';
      case 'carburant-livraison':
        return '⛽ Livraison Carburant';
      case 'carburant-cuve':
        return '🛢️ Remplissage Cuve';
      default:
        return type;
    }
  };

  const getStepLabel = (type: string, step: number) => {
    if (type === 'lavage') {
      const steps = ['Type', 'Lavage', 'Client', 'Photos', 'Validation'];
      return `${step}/${steps.length} - ${steps[step - 1] || ''}`;
    }
    if (type === 'carburant-livraison') {
      const steps = ['Type', 'Client', 'Carburant', 'Photos', 'Validation'];
      return `${step}/${steps.length} - ${steps[step - 1] || ''}`;
    }
    if (type === 'carburant-cuve') {
      const steps = ['Type', 'Cuve', 'Validation'];
      return `${step}/${steps.length} - ${steps[step - 1] || ''}`;
    }
    return `Étape ${step}`;
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Il y a ${days}j`;
    if (hours > 0) return `Il y a ${hours}h`;
    if (minutes > 0) return `Il y a ${minutes}min`;
    return 'À l\'instant';
  };

  const handleDraftClick = () => {
    router.push('/nouvelle-intervention');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Brouillons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (drafts.length === 0) {
    return null; // Don't show section if no drafts
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="h-5 w-5" />
          Brouillons
          <Badge variant="secondary" className="ml-2">{drafts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {drafts.map((draft) => (
            <button
              key={draft.id}
              onClick={handleDraftClick}
              className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {getInterventionLabel(draft.typePrestation)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {getStepLabel(draft.typePrestation, draft.currentStep)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {getTimeAgo(draft.timestamp)}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
