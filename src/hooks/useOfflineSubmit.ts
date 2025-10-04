"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOnlineStatus } from "./useOnlineStatus";
import {
  queueIntervention,
  getPendingCount,
  deleteIntervention,
  updateInterventionStatus,
} from "@/lib/offline-db";

interface SubmitOptions {
  apiEndpoint?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useOfflineSubmit() {
  const router = useRouter();
  const { isOnline } = useOnlineStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  /**
   * Soumet une intervention (online ou offline)
   */
  const submitIntervention = useCallback(
    async (
      data: any,
      photos?: { before?: Blob; after?: Blob },
      options?: SubmitOptions
    ) => {
      setIsSubmitting(true);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        if (isOnline) {
          // Mode ONLINE: Envoyer directement à l'API
          const response = await fetch(options?.apiEndpoint || "/api/interventions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...data,
              tempId,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();

          // Upload photos si présentes
          if (photos && (photos.before || photos.after)) {
            const formData = new FormData();
            if (photos.before) formData.append("before", photos.before);
            if (photos.after) formData.append("after", photos.after);
            formData.append("interventionId", result.id);

            await fetch("/api/interventions/photos", {
              method: "POST",
              body: formData,
            });
          }

          options?.onSuccess?.();
          router.push("/");
        } else {
          // Mode OFFLINE: Mettre en queue IndexedDB
          await queueIntervention(tempId, data, photos);

          // Enregistrer Background Sync si supporté
          if ("serviceWorker" in navigator && "sync" in navigator.serviceWorker) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register("sync-interventions");
          }

          // Mettre à jour le compteur
          const count = await getPendingCount();
          setPendingCount(count);

          options?.onSuccess?.();
          router.push("/");
        }
      } catch (error) {
        console.error("Erreur soumission intervention:", error);

        if (!isOnline) {
          // Si offline, toujours mettre en queue même si erreur
          await queueIntervention(tempId, data, photos);
          const count = await getPendingCount();
          setPendingCount(count);

          options?.onSuccess?.();
          router.push("/");
        } else {
          options?.onError?.(error as Error);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [isOnline, router]
  );

  /**
   * Récupère le nombre d'interventions en attente
   */
  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
    return count;
  }, []);

  return {
    submitIntervention,
    isSubmitting,
    isOnline,
    pendingCount,
    refreshPendingCount,
  };
}
