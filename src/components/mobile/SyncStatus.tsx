"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, AlertCircle } from "lucide-react";
import { getPendingCount } from "@/lib/offline-db";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function SyncStatus() {
  const { isOnline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Mettre à jour le compteur au chargement
    updatePendingCount();

    // Vérifier toutes les 30 secondes
    const interval = setInterval(updatePendingCount, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Écouter les événements de sync
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SYNC_START") {
          setSyncing(true);
        } else if (event.data?.type === "SYNC_COMPLETE") {
          setSyncing(false);
          updatePendingCount();
        }
      });
    }
  }, []);

  const updatePendingCount = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };

  // Ne rien afficher si tout est OK
  if (isOnline && pendingCount === 0 && !syncing) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      <div className="bg-card border rounded-lg shadow-lg p-3 flex items-center gap-3">
        {/* Icône de statut */}
        {syncing ? (
          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
        ) : isOnline ? (
          <Cloud className="h-5 w-5 text-green-500 flex-shrink-0" />
        ) : (
          <CloudOff className="h-5 w-5 text-orange-500 flex-shrink-0" />
        )}

        {/* Message */}
        <div className="flex-1 min-w-0">
          {syncing ? (
            <p className="text-sm font-medium">
              Synchronisation en cours...
            </p>
          ) : isOnline && pendingCount > 0 ? (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-medium">{pendingCount}</span> intervention
                {pendingCount > 1 ? "s" : ""} en attente de synchronisation
              </p>
            </div>
          ) : !isOnline && pendingCount > 0 ? (
            <p className="text-sm">
              <span className="font-medium">{pendingCount}</span> intervention
              {pendingCount > 1 ? "s" : ""} sera{pendingCount > 1 ? "ont" : ""} synchronisée
              {pendingCount > 1 ? "s" : ""} une fois reconnecté
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Mode hors ligne
            </p>
          )}
        </div>

        {/* Indicateur visuel */}
        {pendingCount > 0 && !syncing && (
          <div className="flex-shrink-0 bg-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {pendingCount}
          </div>
        )}
      </div>
    </div>
  );
}
