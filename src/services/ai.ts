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
  // TODO: Add your Firebase Cloud Function URL here
  // Example: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/hydrationAiProxy
  private static CLOUD_FUNCTION_URL = 'YOUR_FIREBASE_FUNCTION_URL';

  /**
   * Main method to ask the AI a question
   * Tries server-side AI first, falls back to local data for location queries
   */
  static async ask(prompt: string): Promise<string> {
    try {
      // Try server-side AI proxy first
      return await this.serverProxyAsk(prompt);
    } catch (error) {
      console.warn('Server AI failed, attempting local fallback:', error);

      // If it's a location-based query, try local fallback
      if (this.isLocationQuery(prompt)) {
        try {
          return await this.localFallbackAsk(prompt);
        } catch (fallbackError) {
          console.error('Local fallback also failed:', fallbackError);
          throw new Error('AI service unavailable. Please try again later.');
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

      // Temporary implementation using fetch
      const response = await fetch(this.CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { prompt } }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      return data.result.response;
    } catch (error) {
      console.error('Server proxy error:', error);
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
   * Get location-based climate recommendation
   *
   * Example prompt:
   * "Given coordinates (lat: 37.7749, lon: -122.4194) identify city and climate (cold/mild/hot/veryHot)"
   */
  static async getClimateForLocation(latitude: number, longitude: number): Promise<ClimateResponse | null> {
    const prompt = `Given coordinates (lat: ${latitude}, lon: ${longitude}) identify the city and climate type.
Respond in this exact format: "City: [city name], Climate: [cold/mild/hot/veryHot] - [brief explanation]"`;

    const response = await this.ask(prompt);
    return this.parseClimateResponse(response);
  }
}
