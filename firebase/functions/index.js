const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });

/**
 * HTTPS Callable Cloud Function for AI hydration assistance
 *
 * This function acts as a proxy between your mobile app and an LLM API
 * to keep API keys secure on the server side.
 *
 * Setup Instructions:
 * 1. Choose your LLM provider (OpenAI or Anthropic)
 * 2. Add your API key using ONE of these methods:
 *    
 *    Option A - Blaze Plan (Recommended):
 *    firebase functions:secrets:set OPENAI_API_KEY
 *    
 *    Option B - Environment Variables (Works on all plans):
 *    Create .env file in firebase/functions/ with: OPENAI_API_KEY=your_key_here
 *    Or set via: firebase functions:config:set env.OPENAI_API_KEY="YOUR_API_KEY"
 * 
 * 3. The OpenAI implementation is active by default
 * 4. Deploy: firebase deploy --only functions
 * 
 * Note: functions.config() is deprecated. Use environment variables instead.
 */

// ============================================================================
// OPTION 1: OpenAI Implementation (Active)
// ============================================================================
const OpenAI = require('openai');

// Initialize OpenAI client - uses environment variables (modern approach)
// Option 1 (Blaze plan): firebase functions:secrets:set OPENAI_API_KEY
// Option 2 (All plans): Set in .env file or via environment variables
function getOpenAIClient() {
  // Get API key from environment variable (works with secrets or direct env vars)
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY not configured. Use one of:\n' +
      '  Blaze plan: firebase functions:secrets:set OPENAI_API_KEY\n' +
      '  All plans: Create .env file in firebase/functions/ with OPENAI_API_KEY=your_key\n' +
      '  Or set environment variable before deployment'
    );
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
}

exports.hydrationAiProxy = functions.https.onCall(async (data, context) => {
  // Validate input
  if (!data.prompt || typeof data.prompt !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with a "prompt" parameter.'
    );
  }

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // or 'gpt-4' for better responses
      messages: [
        {
          role: 'system',
          content: 'You are a helpful hydration assistant. Provide concise, friendly advice about daily water intake based on user inputs. When identifying climate from coordinates, respond in the exact format: "City: [city name], Climate: [cold/mild/hot/veryHot] - [brief explanation]"'
        },
        {
          role: 'user',
          content: data.prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    // Log for debugging (optional)
    console.log('AI Request:', data.prompt);
    console.log('AI Response:', response);

    return { response };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get AI response',
      error.message
    );
  }
});

// ============================================================================
// OPTION 2: Anthropic Claude Implementation
// ============================================================================
/*
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: functions.config().anthropic.key,
});

exports.hydrationAiProxy = functions.https.onCall(async (data, context) => {
  // Validate input
  if (!data.prompt || typeof data.prompt !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with a "prompt" parameter.'
    );
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022', // or 'claude-3-opus-20240229' for best quality
      max_tokens: 200,
      system: 'You are a helpful hydration assistant. Provide concise, friendly advice about daily water intake based on user inputs. When identifying climate from coordinates, respond in the exact format: "City: [city name], Climate: [cold/mild/hot/veryHot] - [brief explanation]"',
      messages: [
        {
          role: 'user',
          content: data.prompt
        }
      ],
    });

    const response = message.content[0].text;

    // Log for debugging (optional)
    console.log('AI Request:', data.prompt);
    console.log('AI Response:', response);

    return { response };
  } catch (error) {
    console.error('Anthropic API Error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get AI response',
      error.message
    );
  }
});
*/

// ============================================================================
// OPTION 3: Simple Mock Implementation (for testing) - DISABLED
// ============================================================================
/*
// Mock implementation - uncomment only for testing without API key
exports.hydrationAiProxy = functions.https.onCall(async (data, context) => {
  // Validate input
  if (!data.prompt || typeof data.prompt !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with a "prompt" parameter.'
    );
  }

  // TODO: Replace this mock with actual LLM API call
  console.log('Mock AI Request:', data.prompt);

  // Simple pattern matching for demo purposes
  let response = 'I am a mock AI response. Please configure your LLM API to get real responses.';

  if (data.prompt.toLowerCase().includes('coordinate') || data.prompt.toLowerCase().includes('climate')) {
    // Mock climate response
    response = 'City: San Francisco, Climate: mild - This location has moderate temperatures year-round due to coastal influence.';
  } else if (data.prompt.toLowerCase().includes('daily') || data.prompt.toLowerCase().includes('calculation')) {
    // Mock calculation explanation
    response = 'Your daily hydration goal is calculated as: Base (weight × 35ml) + Activity bonus (moderate = +500ml) + Climate adjustment (hot = +500ml). This ensures you stay properly hydrated based on your specific needs.';
  }

  return { response };
});
*/

// ============================================================================
// Additional Helper Functions
// ============================================================================

/**
 * Health check endpoint to verify function is deployed correctly
 */
exports.healthCheck = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).json({
      status: 'ok',
      message: 'H2O Tender Cloud Functions are running',
      timestamp: new Date().toISOString(),
    });
  });
});

/**
 * Example: Rate limiting helper (optional, for production use)
 * Prevents abuse by limiting requests per user
 */
function checkRateLimit(userId) {
  // TODO: Implement rate limiting using Firestore
  // Store request counts per user per time window
  // Return true if within limits, false if exceeded
  return true;
}
