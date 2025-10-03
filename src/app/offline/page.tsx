'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-primary/10 to-background flex flex-col items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl p-8 max-w-md w-full text-center">
        {/* Logo FleetZen */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo-fleetzen.svg"
            alt="FleetZen Logo"
            width={120}
            height={120}
            priority
          />
        </div>

        {/* Icône Offline */}
        <div className="mb-6">
          <svg
            className="w-20 h-20 mx-auto text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-4">
          Vous êtes hors ligne
        </h1>

        <p className="text-muted-foreground mb-6">
          FleetZen nécessite une connexion Internet pour fonctionner. Veuillez vérifier votre connexion et réessayer.
        </p>

        {/* Statut de connexion */}
        <div className="bg-muted rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="inline-block w-3 h-3 rounded-full bg-destructive mr-2"></span>
            Pas de connexion Internet
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition"
          >
            Réessayer
          </button>

          <Link
            href="/"
            className="block w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-medium hover:bg-secondary/80 transition"
          >
            Retour à l'accueil
          </Link>
        </div>

        {/* Conseils */}
        <div className="mt-8 text-left">
          <p className="text-sm font-medium text-foreground mb-2">
            Conseils de dépannage :
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Vérifiez votre connexion Wi-Fi ou données mobiles</li>
            <li>Désactivez puis réactivez le mode avion</li>
            <li>Redémarrez votre appareil si nécessaire</li>
          </ul>
        </div>
      </div>

      {/* Informations techniques */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          FleetZen PWA • Version {process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
        </p>
      </div>
    </div>
  );
}
