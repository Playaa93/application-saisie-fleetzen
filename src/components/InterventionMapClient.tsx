'use client';

import { useEffect } from 'react';
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
  useEffect(() => {
    // Fix pour les icônes Leaflet (uniquement côté client)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className={className}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
