/**
 * Géocodage inverse - Convertir coordonnées GPS en adresse lisible
 * Utilise l'API Nominatim (OpenStreetMap) - gratuite, pas de clé requise
 */

export interface Address {
  road?: string;
  house_number?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  postcode?: string;
  country?: string;
  formatted?: string;
}

interface NominatimResponse {
  address: Address;
  display_name: string;
}

// Cache pour éviter de re-géocoder les mêmes coordonnées
const geocodeCache = new Map<string, string>();

/**
 * Convertir coordonnées GPS en adresse humaine lisible
 * @param latitude Latitude (ex: 48.849583)
 * @param longitude Longitude (ex: 2.551171)
 * @returns Adresse formatée (ex: "12 Rue de la Paix, 75002 Paris, France")
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  // Clé de cache basée sur coordonnées arrondies (6 décimales = ~11cm de précision)
  const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

  // Vérifier le cache d'abord
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    // API Nominatim - respect de la politique d'utilisation:
    // - User-Agent requis
    // - Max 1 requête/seconde
    // - Pas de cache permanent

    // Timeout de 5 secondes pour éviter les blocages
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${latitude}&` +
      `lon=${longitude}&` +
      `format=json&` +
      `addressdetails=1&` +
      `accept-language=fr`,
      {
        headers: {
          'User-Agent': 'FleetZen/1.0 (Intervention Management App)',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data: NominatimResponse = await response.json();
    const addr = data.address;

    // Formater l'adresse de manière lisible
    let formatted = '';

    // Numéro + rue
    if (addr.house_number && addr.road) {
      formatted = `${addr.house_number} ${addr.road}`;
    } else if (addr.road) {
      formatted = addr.road;
    }

    // Code postal + ville
    const city = addr.city || addr.town || addr.village || addr.suburb || '';
    if (addr.postcode && city) {
      formatted += formatted ? `, ${addr.postcode} ${city}` : `${addr.postcode} ${city}`;
    } else if (city) {
      formatted += formatted ? `, ${city}` : city;
    }

    // Pays
    if (addr.country) {
      formatted += formatted ? `, ${addr.country}` : addr.country;
    }

    // Fallback sur display_name si formatage échoue
    if (!formatted && data.display_name) {
      formatted = data.display_name;
    }

    // Si toujours vide, retourner coordonnées
    if (!formatted) {
      formatted = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }

    // Mettre en cache
    geocodeCache.set(cacheKey, formatted);

    return formatted;
  } catch (error) {
    console.warn('Géocodage inverse échoué (normal en dev/offline):', error instanceof Error ? error.message : 'Unknown error');

    // En cas d'erreur (timeout, offline, CORS), retourner coordonnées formatées
    const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    // Mettre en cache le fallback pour éviter de retenter
    geocodeCache.set(cacheKey, coords);

    return coords;
  }
}

/**
 * Générer un lien Google Maps pour navigation
 */
export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}

/**
 * Générer un lien Waze pour navigation
 */
export function getWazeUrl(latitude: number, longitude: number): string {
  return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
}

/**
 * Calculer la distance entre deux points GPS (formule Haversine)
 * @param lat1 Latitude du point 1 (degrés décimaux)
 * @param lon1 Longitude du point 1 (degrés décimaux)
 * @param lat2 Latitude du point 2 (degrés décimaux)
 * @param lon2 Longitude du point 2 (degrés décimaux)
 * @returns Distance en mètres
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Rayon de la Terre en mètres
  const R = 6371000;

  // Convertir degrés en radians
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  // Formule Haversine
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance en mètres
  const distance = R * c;

  return distance;
}

/**
 * Vérifier si une position est dans une zone géographique (geofencing)
 * @param currentLat Latitude actuelle
 * @param currentLon Longitude actuelle
 * @param targetLat Latitude cible
 * @param targetLon Longitude cible
 * @param radiusMeters Rayon du geofence en mètres (par défaut: 100m)
 * @returns true si dans la zone, false sinon
 */
export function isWithinGeofence(
  currentLat: number,
  currentLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number = 100
): boolean {
  const distance = calculateDistance(currentLat, currentLon, targetLat, targetLon);
  return distance <= radiusMeters;
}

/**
 * Formater une distance en texte lisible
 * @param meters Distance en mètres
 * @returns Texte formaté (ex: "150 m" ou "2.3 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
