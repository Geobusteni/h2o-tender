import * as Location from 'expo-location';

interface Coordinates {
  latitude: number;
  longitude: number;
}

// ClimateData matches the structure in climate_fallback.json
interface ClimateData {
  place: string;
  lat: number;
  lon: number;
  climate: 'cold' | 'mild' | 'hot' | 'veryHot' | string;
  explanation: string;
}

export interface ClimateMatch {
  city: string;
  climate: 'cold' | 'mild' | 'hot' | 'veryHot';
  explanation: string;
  distance: number;
}

/**
 * Request location permissions from the user
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Location permission not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Get current device location
 * Returns latitude and longitude coordinates
 */
export async function getCurrentLocation(): Promise<Coordinates> {
  const LOCATION_TIMEOUT_MS = 15000;

  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    // Check if location services are enabled
    const locationEnabled = await isLocationEnabled();
    if (!locationEnabled) {
      throw new Error('Location services are disabled. Please enable them in your device settings.');
    }

    // Add timeout to prevent hanging
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Location request timed out. Please try again or enter your city manually.'));
      }, LOCATION_TIMEOUT_MS);
    });

    const location = await Promise.race([locationPromise, timeoutPromise]);

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get current location. Please check your location settings.');
  }
}

/**
 * Calculate Haversine distance between two points on Earth
 * Returns distance in kilometers
 *
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find the nearest climate match from fallback database
 * Uses Haversine distance to find closest city
 *
 * @param lat User's latitude
 * @param lon User's longitude
 * @param fallbackDB Climate fallback database (array of ClimateData objects)
 * @returns Nearest climate match with distance, or null if database is empty
 */
export function findNearestClimate(
  lat: number,
  lon: number,
  fallbackDB: ClimateData[]
): ClimateMatch | null {
  if (!fallbackDB || fallbackDB.length === 0) {
    console.warn('Climate fallback database is empty');
    return null;
  }

  let nearestMatch: ClimateMatch | null = null;
  let minDistance = Infinity;

  for (const entry of fallbackDB) {
    const distance = haversineDistance(
      lat,
      lon,
      entry.lat,
      entry.lon
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestMatch = {
        city: entry.place,
        climate: entry.climate as ClimateMatch['climate'],
        explanation: entry.explanation,
        distance,
      };
    }
  }

  if (nearestMatch) {
    console.log(
      `Nearest climate match: ${nearestMatch.city} (${minDistance.toFixed(2)} km away)`
    );
  }

  return nearestMatch;
}

/**
 * Get reverse geocoding information for coordinates
 * Returns city, region, and country information
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<Location.LocationGeocodedAddress | null> {
  try {
    const geocoded = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (geocoded.length > 0) {
      return geocoded[0];
    }

    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Get city name from coordinates
 * Useful for displaying location to user
 */
export async function getCityName(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const geocoded = await reverseGeocode(latitude, longitude);

    if (geocoded) {
      return geocoded.city || geocoded.district || geocoded.region || 'Unknown location';
    }

    return 'Unknown location';
  } catch (error) {
    console.error('Error getting city name:', error);
    return 'Unknown location';
  }
}

/**
 * Check if location services are enabled on device
 */
export async function isLocationEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
}
