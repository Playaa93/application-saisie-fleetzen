"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export function HomeButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Détecter si on est sur une page d'intervention en cours
  const isOnInterventionForm = pathname?.includes("/nouvelle-intervention") ||
                               pathname?.includes("/interventions/form") ||
                               pathname?.includes("/interventions/new");

  const handleHomeClick = () => {
    if (isOnInterventionForm) {
      setShowConfirmation(true);
    } else {
      router.push("/interventions");
    }
  };

  const confirmNavigation = () => {
    setShowConfirmation(false);
    router.push("/interventions");
  };

  const cancelNavigation = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <button
        onClick={handleHomeClick}
        className="fixed top-4 right-4 z-50 bg-card hover:bg-accent text-foreground p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Retour à l'accueil"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>

      {/* Modal de confirmation */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-lg shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 dark:bg-amber-900/20 p-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-amber-600 dark:text-amber-500"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Intervention en cours
              </h3>
            </div>

            <p className="text-muted-foreground mb-6">
              Vous êtes en train de saisir une intervention. Si vous quittez maintenant, vos données seront perdues.
            </p>

            <div className="flex gap-3">
              <button
                onClick={cancelNavigation}
                className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-colors"
              >
                Continuer la saisie
              </button>
              <button
                onClick={confirmNavigation}
                className="flex-1 px-4 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium rounded-lg transition-colors"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
