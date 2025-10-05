"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Database, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingRow } from "./SettingRow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DataSection() {
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // TODO: Implémenter synchronisation réelle
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setLastSync(new Date());
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearCache = () => {
    // Vider le cache localStorage
    const keysToKeep = ["sb-access-token"];
    Object.keys(localStorage).forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // Vider IndexedDB si utilisé
    if ("indexedDB" in window) {
      indexedDB.deleteDatabase("FleetZenCache");
    }

    setShowClearCacheDialog(false);
    toast.success('Cache vidé', {
      description: 'Toutes les données temporaires ont été supprimées',
      duration: 2000
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Données & Synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Synchronisation..." : "Synchroniser maintenant"}
            </Button>
            {lastSync && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Dernière synchronisation :{" "}
                {lastSync.toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          <div className="pt-2 border-t">
            <SettingRow
              icon={Trash2}
              label="Vider le cache"
              description="Supprimer les données temporaires"
              danger
              onClick={() => setShowClearCacheDialog(true)}
            />
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showClearCacheDialog} onOpenChange={setShowClearCacheDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vider le cache</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera toutes les données en cache (photos, données temporaires).
              Vos données synchronisées seront conservées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCache} className="bg-destructive">
              Vider le cache
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
