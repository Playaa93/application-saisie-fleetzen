'use client';

import { useState, useEffect } from 'react';
import { InterventionFormData } from '@/types/intervention';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance, formatDistance, getGoogleMapsUrl, getWazeUrl, isWithinGeofence } from '@/lib/geocoding';
import { toast } from 'sonner';

interface Step5TrajetNavigationProps {
  formData: Partial<InterventionFormData>;
  onNext: (data: Partial<InterventionFormData>) => void;
  onPrevious: () => void;
}

// Rayon de geofencing en mètres (100m)
const GEOFENCE_RADIUS = 100;

export default function Step5TrajetNavigation({ formData, onNext, onPrevious }: Step5TrajetNavigationProps) {
  const { loading: gpsLoading, error: gpsError, data: gpsData } = useGeolocation(true, 10000);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinZone, setIsWithinZone] = useState(false);

  // Extraire l'adresse de destination depuis formData
  const destinationAddress = typeof formData.adresseArrivee === 'string'
    ? formData.adresseArrivee
    : formData.adresseArrivee?.adresse || '';

  // Pour le geofencing, on a besoin des coordonnées de destination
  // Dans une vraie app, on utiliserait le geocoding (adresse → GPS)
  // Ici, on simule avec les coordonnées stockées dans formData si disponibles
  useEffect(() => {
    // TODO: Implémenter geocoding forward (adresse → coordonnées GPS)
    // Pour l'instant, on utilise les coordonnées si déjà disponibles
    // ou on simule Paris comme exemple

    // Exemple: Si l'adresse contient "Paris", coordonnées de Paris
    if (destinationAddress.toLowerCase().includes('paris')) {
      setDestinationCoords({ lat: 48.8566, lon: 2.3522 });
    } else {
      // Par défaut, utiliser une position fictive
      // Dans une vraie app, appeler une API de geocoding
      setDestinationCoords({ lat: 48.8566, lon: 2.3522 });
    }
  }, [destinationAddress]);

  // Calculer la distance et vérifier le geofencing
  useEffect(() => {
    if (gpsData && destinationCoords) {
      const dist = calculateDistance(
        gpsData.latitude,
        gpsData.longitude,
        destinationCoords.lat,
        destinationCoords.lon
      );
      setDistance(dist);

      const withinZone = isWithinGeofence(
        gpsData.latitude,
        gpsData.longitude,
        destinationCoords.lat,
        destinationCoords.lon,
        GEOFENCE_RADIUS
      );
      setIsWithinZone(withinZone);

      // Notification quand on entre dans la zone
      if (withinZone && distance && distance > GEOFENCE_RADIUS) {
        toast.success('🎯 Vous êtes arrivé à destination !', {
          description: 'Vous pouvez maintenant finaliser la remise du véhicule.'
        });
      }
    }
  }, [gpsData, destinationCoords, distance]);

  const handleOpenMaps = () => {
    if (!destinationCoords) {
      toast.error('Coordonnées de destination non disponibles');
      return;
    }

    const url = getGoogleMapsUrl(destinationCoords.lat, destinationCoords.lon);

    // Essayer d'ouvrir l'app native Maps (iOS/Android)
    window.location.href = `maps://maps.google.com/maps?daddr=${destinationCoords.lat},${destinationCoords.lon}`;

    // Fallback vers Google Maps web après 500ms
    setTimeout(() => {
      window.open(url, '_blank');
    }, 500);

    toast.success('Ouverture de Google Maps...');
  };

  const handleOpenWaze = () => {
    if (!destinationCoords) {
      toast.error('Coordonnées de destination non disponibles');
      return;
    }

    const url = getWazeUrl(destinationCoords.lat, destinationCoords.lon);
    window.location.href = url;

    toast.success('Ouverture de Waze...');
  };

  const handleArrived = () => {
    if (!isWithinZone) {
      toast.error('Vous devez être sur place pour continuer', {
        description: `Distance actuelle: ${distance ? formatDistance(distance) : 'inconnue'}`
      });
      return;
    }

    // Sauvegarder les coordonnées GPS de remise
    onNext({
      latitude: gpsData?.latitude,
      longitude: gpsData?.longitude,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Convoyage en cours</h2>
        <p className="text-muted-foreground">Navigation vers la destination</p>
      </div>

      <div className="space-y-6">
        {/* Destination */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Destination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{destinationAddress || 'Adresse non renseignée'}</p>
          </CardContent>
        </Card>

        {/* État GPS et Distance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-500" />
              Position GPS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gpsLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Localisation en cours...</span>
              </div>
            )}

            {gpsError && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Erreur GPS</p>
                  <p className="text-xs text-destructive/80 mt-1">{gpsError}</p>
                </div>
              </div>
            )}

            {gpsData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Distance restante:</span>
                  <span className="text-lg font-bold text-primary">
                    {distance !== null ? formatDistance(distance) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Précision GPS:</span>
                  <span className="text-sm font-medium">
                    ±{Math.round(gpsData.accuracy)} m
                  </span>
                </div>

                {/* Indicateur de zone */}
                {isWithinZone ? (
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/10 border border-green-300 dark:border-green-700 rounded-md">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      ✓ Vous êtes sur place
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-300 dark:border-yellow-700 rounded-md">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                      En route vers la destination
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Boutons de navigation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleOpenMaps}
              disabled={!destinationCoords}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Ouvrir dans Google Maps
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleOpenWaze}
              disabled={!destinationCoords}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Ouvrir dans Waze
            </Button>
          </CardContent>
        </Card>

        {/* Message geofencing */}
        {!isWithinZone && !gpsLoading && !gpsError && (
          <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-700 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Vous devez être sur place pour continuer
              </p>
              <p className="text-blue-600 dark:text-blue-300 mt-1">
                Rapprochez-vous à moins de {GEOFENCE_RADIUS}m de la destination pour déverrouiller l'étape de remise.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="flex-1"
          >
            ← Retour
          </Button>
          <Button
            type="button"
            onClick={handleArrived}
            className="flex-1"
            disabled={!isWithinZone || gpsLoading || !!gpsError}
          >
            {isWithinZone ? 'Arrivé - Remise →' : 'En route...'}
          </Button>
        </div>
      </div>
    </div>
  );
}
