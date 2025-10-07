'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface InterventionMapClientProps {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  className?: string;
}

export function InterventionMapClient({
  latitude,
  longitude,
  address,
  accuracy,
  className = 'h-64 w-full rounded-lg',
}: InterventionMapClientProps) {
  const mapRef = useRef<L.Map | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter hydration mismatch avec next-themes
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fix pour les icônes Leaflet (uniquement côté client)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Cleanup: supprimer la map à l'unmount pour éviter "already initialized"
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // URLs des tiles selon le thème (light/dark)
  const tileUrl = mounted && resolvedTheme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CartoDB</a>';

  // Ne pas afficher la carte avant que le thème soit résolu
  if (!mounted) {
    return <div className={className} />;
  }

  return (
    <div className={className} style={{ maxHeight: '400px' }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full rounded-lg"
        ref={mapRef}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url={tileUrl}
          attribution={attribution}
        />

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
