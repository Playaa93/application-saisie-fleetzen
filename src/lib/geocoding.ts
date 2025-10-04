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
