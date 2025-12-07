import { getCurrentLocation, findNearestClimate } from '../utils/location';
import climateFallbackData from '../assets/climate_fallback.json';

interface ClimateResponse {
  city: string;
  climate: 'cold' | 'mild' | 'hot' | 'veryHot';
  explanation: string;
}

// AIResponse interface for future use with server responses
// interface AIResponse {
//   response: string;
// }

export class AIService {
  // Firebase Cloud Function URL
  // For local development (emulator): http://localhost:5001/h2o-tender/us-central1/hydrationAiProxy
  // For production (after Blaze upgrade): https://us-central1-h2o-tender.cloudfunctions.net/hydrationAiProxy
  private static CLOUD_FUNCTION_URL = __DEV__ 
    ? 'http://localhost:5001/h2o-tender/us-central1/hydrationAiProxy'
    : 'https://us-central1-h2o-tender.cloudfunctions.net/hydrationAiProxy';

  /**
   * Check if network is available by attempting a quick connection test
   * Returns true if network is available, false otherwise
   */
  private static async checkNetworkAvailability(): Promise<boolean> {
    try {
      // Quick connectivity check - try to reach the Firebase function with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(this.CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { prompt: 'test' } }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // Even if we get an error response, network is available
      return true;
    } catch (error) {
      // Network is not available
      console.warn('Network availability check failed:', error);
      return false;
    }
  }

  /**
   * Main method to ask the AI a question
   * Tries server-side AI first, falls back to local data for location queries
   */
  static async ask(prompt: string): Promise<string> {
    try {
      // Try server-side AI proxy first
      return await this.serverProxyAsk(prompt);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('Server AI failed, attempting local fallback:', errorMessage);

      // If it's a location-based query or network error, try local fallback
      if (this.isLocationQuery(prompt) || errorMessage === 'NETWORK_ERROR') {
        try {
          return await this.localFallbackAsk(prompt);
        } catch (fallbackError) {
          console.error('Local fallback also failed:', fallbackError);
          // Re-throw with a user-friendly message
          throw new Error('Unable to determine climate data. Please enter your location manually.');
        }
      }

      throw error;
    }
  }

  /**
   * Calls Firebase Cloud Function to proxy AI requests
   *
   * Example Request:
   * {
   *   prompt: "Given coordinates (lat: 37.7749, lon: -122.4194) identify city and climate"
   * }
   *
   * Example Response:
   * {
   *   response: "City: San Francisco, Climate: mild - The moderate temperatures..."
   * }
   */
  private static async serverProxyAsk(prompt: string): Promise<string> {
    // TODO: Initialize Firebase if not already done
    // import { getFunctions, httpsCallable } from 'firebase/functions';
    // const functions = getFunctions();
    // const hydrationAiProxy = httpsCallable(functions, 'hydrationAiProxy');

    try {
      // TODO: Replace with actual Firebase callable function
      // const result = await hydrationAiProxy({ prompt });
      // return result.data.response;

      // Call Firebase callable function via HTTP
      // For callable functions, the request format is: { data: { ... } }
      // Response format is: { result: { ... } }
      const response = await fetch(this.CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: { prompt } 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      // Callable functions return { result: { ... } }
      if (result.result && result.result.response) {
        return result.result.response;
      }
      // Fallback for direct response
      if (result.response) {
        return result.response;
      }
      throw new Error('Unexpected response format from Firebase function');
    } catch (error) {
      console.error('Server proxy error:', error);
      // Check if it's a network error
      const isNetworkError = 
        error instanceof TypeError && 
        (error.message.includes('Network request failed') || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('network'));
      
      if (isNetworkError) {
        throw new Error('NETWORK_ERROR');
      }
      throw new Error('Failed to reach AI server');
    }
  }

  /**
   * Local fallback for location-based queries using climate_fallback.json
   * Uses device location and Haversine distance to find nearest city
   */
  private static async localFallbackAsk(_prompt: string): Promise<string> {
    try {
      // Get current device location
      const location = await getCurrentLocation();

      // Find nearest climate match from fallback database
      const fallbackDB = climateFallbackData;
      const nearestMatch = findNearestClimate(
        location.latitude,
        location.longitude,
        fallbackDB
      );

      if (!nearestMatch) {
        throw new Error('No climate data available for your location');
      }

      // Format response similar to AI response
      return `City: ${nearestMatch.city}, Climate: ${nearestMatch.climate} - ${nearestMatch.explanation}`;
    } catch (error) {
      console.error('Local fallback error:', error);
      throw new Error('Unable to determine climate data');
    }
  }

  /**
   * Parse AI response for climate information
   * Extracts structured data from natural language response
   */
  static parseClimateResponse(response: string): ClimateResponse | null {
    try {
      // Expected format: "City: CityName, Climate: climateType - explanation text"
      const cityMatch = response.match(/City:\s*([^,]+)/i);
      const climateMatch = response.match(/Climate:\s*(cold|mild|hot|veryHot)/i);
      const explanationMatch = response.match(/Climate:\s*(?:cold|mild|hot|veryHot)\s*-\s*(.+)/i);

      if (!cityMatch || !climateMatch) {
        return null;
      }

      return {
        city: cityMatch[1].trim(),
        climate: climateMatch[1].toLowerCase() as ClimateResponse['climate'],
        explanation: explanationMatch ? explanationMatch[1].trim() : 'Climate data based on your location.',
      };
    } catch (error) {
      console.error('Failed to parse climate response:', error);
      return null;
    }
  }

  /**
   * Check if the prompt is asking for location/climate information
   */
  private static isLocationQuery(prompt: string): boolean {
    const locationKeywords = ['coordinate', 'location', 'climate', 'city', 'latitude', 'longitude'];
    const lowerPrompt = prompt.toLowerCase();
    return locationKeywords.some(keyword => lowerPrompt.includes(keyword));
  }

  /**
   * Generate summary explanation for daily goal calculation
   *
   * Example prompt:
   * "User inputs: weight=70kg, age=30, activityLevel=moderate, climate=hot.
   *  Explain dailyGoalML calculation showing: base (weight * 35) + activity bonus + climate bonus"
   */
  static async explainDailyGoal(
    weight: number,
    age: number,
    activityLevel: string,
    climate: string
  ): Promise<string> {
    const prompt = `User inputs: weight=${weight}kg, age=${age}, activityLevel=${activityLevel}, climate=${climate}.
Explain the daily hydration goal calculation in a friendly, concise way.
Include: base calculation (weight * 35ml), activity level bonus, and climate adjustment.`;

    return await this.ask(prompt);
  }

  /**
   * Get location-based climate recommendation from coordinates
   * ALWAYS tries AI service - no network check (for manual entry)
   * Falls back to local climate database only if AI fails
   * Only uses local fallback if the match is reasonably close (within 500km)
   *
   * Example prompt:
   * "Given coordinates (lat: 37.7749, lon: -122.4194) identify city and climate (cold/mild/hot/veryHot)"
   */
  static async getClimateForLocation(latitude: number, longitude: number): Promise<ClimateResponse | null> {
    // Maximum distance (km) to use local fallback - beyond this, ask for manual entry
    const MAX_FALLBACK_DISTANCE_KM = 500;

    // Try AI service first (always attempt, no network check)
    try {
      const prompt = `Given coordinates (lat: ${latitude}, lon: ${longitude}) identify the city and climate type.
Respond in this exact format: "City: [city name], Climate: [cold/mild/hot/veryHot] - [brief explanation]"`;

      const response = await this.serverProxyAsk(prompt);
      const aiResult = this.parseClimateResponse(response);
      
      // If AI succeeded, use it
      if (aiResult) {
        return aiResult;
      }
    } catch (error) {
      // AI service failed - try local fallback
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('AI service failed, trying local climate database:', errorMessage);
      
      try {
        const fallbackDB = climateFallbackData;
        const nearestMatch = findNearestClimate(latitude, longitude, fallbackDB);
        
        // Only use local fallback if we have a match AND it's reasonably close
        if (nearestMatch && nearestMatch.distance <= MAX_FALLBACK_DISTANCE_KM) {
          console.log(`Using local climate data: ${nearestMatch.city} (${nearestMatch.distance.toFixed(1)} km away)`);
          return {
            city: nearestMatch.city,
            climate: nearestMatch.climate,
            explanation: `${nearestMatch.explanation} (estimated from nearby location)`,
          };
        } else if (nearestMatch) {
          // Match found but too far away - don't use it
          console.warn(
            `Nearest city (${nearestMatch.city}) is ${nearestMatch.distance.toFixed(1)} km away, ` +
            `exceeds maximum fallback distance of ${MAX_FALLBACK_DISTANCE_KM} km`
          );
        }
      } catch (fallbackError) {
        console.error('Local fallback also failed:', fallbackError);
      }
    }
    
    // No reliable data available - return null
    console.warn('No reliable climate data available for coordinates:', latitude, longitude);
    return null;
  }

  /**
   * Get location-based climate recommendation with network check (for device location only)
   * Checks network FIRST - if network fails, returns null immediately
   * Only tries AI if network is available
   */
  static async getClimateForLocationWithNetworkCheck(latitude: number, longitude: number): Promise<ClimateResponse | null> {
    // Check network availability BEFORE attempting any AI calls
    const isNetworkAvailable = await this.checkNetworkAvailability();
    
    if (!isNetworkAvailable) {
      console.warn('Network not available - requiring manual location entry');
      // Return null immediately to trigger manual entry - don't try AI
      return null;
    }

    // Network is available - proceed with normal flow
    return await this.getClimateForLocation(latitude, longitude);
  }

  /**
   * Get climate for location from city name (manual entry)
   * ALWAYS tries AI service - no network check
   */
  static async getClimateForCityName(cityName: string): Promise<ClimateResponse | null> {
    try {
      const prompt = `What is the climate type for ${cityName}? 
Respond in this exact format: "City: ${cityName}, Climate: [cold/mild/hot/veryHot] - [brief explanation]"`;

      const response = await this.serverProxyAsk(prompt);
      return this.parseClimateResponse(response);
    } catch (error) {
      console.error('Failed to get climate for city name:', error);
      // Return default mild climate if AI fails
      return {
        city: cityName,
        climate: 'mild',
        explanation: 'Moderate climate (default setting)',
      };
    }
  }
}
