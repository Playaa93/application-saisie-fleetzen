import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

interface InterventionMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  className?: string;
}

/**
 * Carte interactive Leaflet pour afficher la position d'une intervention
 * Charge Leaflet dynamiquement côté client pour éviter les erreurs SSR
 */

// Import dynamique du composant client avec Next.js
const InterventionMapClient = dynamic(
  () => import('./InterventionMapClient').then((mod) => mod.InterventionMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    ),
  }
);

export function InterventionMap(props: InterventionMapProps) {
  return <InterventionMapClient {...props} />;
}
