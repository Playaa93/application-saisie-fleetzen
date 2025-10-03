import { useState, useEffect } from 'react';

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationState {
  loading: boolean;
  error: string | null;
  data: GeolocationData | null;
}

export function useGeolocation(enableHighAccuracy = true, timeout = 10000) {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState({
        loading: false,
        error: 'La géolocalisation n\'est pas supportée par votre navigateur',
        data: null,
      });
      return;
    }

    // Get current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          error: null,
          data: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          },
        });
      },
      (error) => {
        let errorMessage = 'Erreur de géolocalisation';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Autorisation de géolocalisation refusée. Veuillez activer la localisation dans les paramètres.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position GPS non disponible. Vérifiez votre connexion.';
            break;
          case error.TIMEOUT:
            errorMessage = 'La demande de localisation a expiré. Réessayez.';
            break;
        }

        setState({
          loading: false,
          error: errorMessage,
          data: null,
        });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge: 0, // Don't use cached position
      }
    );
  }, [enableHighAccuracy, timeout]);

  return state;
}

/**
 * Request geolocation on demand (not automatic)
 */
export function requestGeolocation(
  enableHighAccuracy = true,
  timeout = 10000
): Promise<GeolocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas supportée'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let errorMessage = 'Erreur de géolocalisation';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Autorisation de géolocalisation refusée';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position GPS non disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'La demande de localisation a expiré';
            break;
        }

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge: 0,
      }
    );
  });
}
