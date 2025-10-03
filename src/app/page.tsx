'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BottomNav } from '@/components/mobile/BottomNav';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-primary/10 to-background flex flex-col items-center justify-center p-4 pb-16">
      {/* Logo FleetZen en haut */}
      <div className="absolute top-8">
        <Image
          src="/logo-fleetzen.svg"
          alt="FleetZen Logo"
          width={280}
          height={280}
          priority
        />
      </div>

      {/* Carte principale - centrée verticalement */}
      <div className="bg-card rounded-2xl border border-border shadow-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-foreground mb-8">Suivi des interventions</h1>
        <div className="space-y-4">
          <Link
            href="/nouvelle-intervention"
            className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle intervention
          </Link>

          <Link
            href="/interventions"
            className="flex items-center justify-center gap-2 w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-medium hover:bg-secondary/80 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Voir les interventions
          </Link>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
