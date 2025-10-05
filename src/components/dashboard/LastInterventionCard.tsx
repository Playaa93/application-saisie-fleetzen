"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, ArrowRight } from "lucide-react";

interface SavedContext {
  typePrestation: string;
  clientId?: string;
  client?: { id: string; name: string } | null;
  siteTravail?: string | null;
  vehicleId?: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * LastInterventionCard - Client Component
 *
 * Displays a toggle to resume last intervention from localStorage context.
 * Similar pattern to DraftsListHome - only shows if context exists and is valid.
 * No server-side data fetching needed.
 *
 * @see src/app/nouvelle-intervention/page.tsx (line 455) - Context saved after submission
 * @see src/components/interventions/Step1TypePrestation.tsx (line 27) - Context loaded
 */
export function LastInterventionCard() {
  const router = useRouter();
  const [context, setContext] = useState<SavedContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContext();
  }, []);

  const loadContext = () => {
    try {
      const saved = localStorage.getItem('last-intervention-context');
      if (saved) {
        const parsedContext: SavedContext = JSON.parse(saved);

        // Check if context is still valid (not expired)
        if (Date.now() < parsedContext.expiresAt) {
          setContext(parsedContext);
        } else {
          // Remove expired context
          localStorage.removeItem('last-intervention-context');
        }
      }
    } catch (error) {
      console.error('Error loading intervention context:', error);
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

  if (isLoading) {
    return null; // Skip loading state for better UX
  }

  if (!context) {
    return null; // Don't show section if no context
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Reprendre dernière intervention
        </CardTitle>
      </CardHeader>
      <CardContent>
        <button
          onClick={() => router.push('/nouvelle-intervention')}
          className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/50 transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm mb-2">
                {getInterventionLabel(context.typePrestation)}
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                {context.client?.name && (
                  <p className="truncate">
                    <span className="font-medium">Client:</span> {context.client.name}
                  </p>
                )}
                {context.siteTravail && (
                  <p className="truncate">
                    <span className="font-medium">Site:</span> {context.siteTravail}
                  </p>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
