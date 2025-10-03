'use client';

import { useEffect, useState } from 'react';
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
 * Charge Leaflet dynamiquement pour éviter les erreurs SSR
 */
export function InterventionMap({
  latitude,
  longitude,
  address,
  accuracy,
  className = 'h-64 w-full rounded-lg',
}: InterventionMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapComponents, setMapComponents] = useState<any>(null);

  // Charger Leaflet uniquement côté client
  useEffect(() => {
    setIsClient(true);

    // Import dynamique de react-leaflet et leaflet
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([reactLeaflet, L]) => {
      // Fix pour les icônes Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      setMapComponents({
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        Marker: reactLeaflet.Marker,
        Popup: reactLeaflet.Popup,
        Circle: reactLeaflet.Circle,
      });
    });
  }, []);

  if (!isClient || !mapComponents) {
    // Placeholder pendant le chargement
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <div className="text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Circle } = mapComponents;

  return (
    <div className={className}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full rounded-lg"
      >
        {/* Tuiles OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marqueur de position */}
        <Marker position={[latitude, longitude]}>
          <Popup>
            <div className="text-sm">
              {address && <p className="font-medium mb-1">{address}</p>}
              <p className="text-xs text-muted-foreground">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
              {accuracy && (
                <p className="text-xs text-muted-foreground mt-1">
                  Précision: ±{accuracy}m
                </p>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Cercle de précision GPS */}
        {accuracy && (
          <Circle
            center={[latitude, longitude]}
            radius={accuracy}
            pathOptions={{
              fillColor: 'blue',
              fillOpacity: 0.1,
              color: 'blue',
              weight: 1,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
