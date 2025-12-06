# Firebase Setup Guide for H2O Tender

This guide walks you through setting up Firebase Cloud Functions as an AI proxy for the H2O Tender app.

## Why Firebase?

- **Security**: API keys stay on the server, never in the app
- **Cross-platform**: Same backend for iOS and Android
- **Scalability**: Handles traffic spikes automatically
- **Free tier**: Generous limits for small apps

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it `h2o-tender` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

## Step 3: Initialize Firebase in Project

```bash
cd /path/to/h2o-tender
firebase init functions
```

Select:
- Use existing project → select your `h2o-tender` project
- Language: JavaScript
- ESLint: Yes
- Install dependencies: Yes

## Step 4: Configure Cloud Function

The Cloud Function is already created at `firebase/functions/index.js`. You need to:

### Option A: Use OpenAI

1. Get an API key from [OpenAI Platform](https://platform.openai.com/)
2. Set the secret:
   ```bash
   firebase functions:secrets:set OPENAI_API_KEY
   ```
3. In `firebase/functions/index.js`, uncomment the OpenAI implementation

### Option B: Use Anthropic Claude

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Set the secret:
   ```bash
   firebase functions:secrets:set ANTHROPIC_API_KEY
   ```
3. In `firebase/functions/index.js`, uncomment the Claude implementation

## Step 5: Deploy Functions

```bash
cd firebase/functions
npm install
firebase deploy --only functions
```

After deployment, you'll see the function URL:
```
https://<region>-<project-id>.cloudfunctions.net/hydrationAiProxy
```

## Step 6: Update App Configuration

In `src/services/ai.ts`, update the Firebase URL:

```typescript
// TODO: Replace with your Firebase Cloud Function URL
const FIREBASE_FUNCTION_URL = 'https://us-central1-h2o-tender.cloudfunctions.net/hydrationAiProxy';
```

## Step 7: Test the Function

```bash
curl -X POST https://<your-url>/hydrationAiProxy \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, test message"}'
```

## Security Rules

The Cloud Function includes:
- CORS protection
- Request validation
- Error handling
- Rate limiting (optional, via Firebase)

## Cost Considerations

| Usage Level | Firebase Cost | LLM API Cost |
|------------|---------------|--------------|
| < 2M invocations/month | Free | Pay per token |
| Typical user (10 calls/day) | Free | ~$0.01/month |

## Local Development

To test functions locally:

```bash
cd firebase/functions
npm run serve
```

This starts a local emulator at `http://localhost:5001`.

## Troubleshooting

### "Function not found" error
- Ensure the function is deployed: `firebase functions:list`
- Check the region matches in your app config

### "Permission denied" error
- Verify the function is set to public (allowUnauthenticated)
- Check CORS settings

### "API key invalid" error
- Verify secret is set: `firebase functions:secrets:access OPENAI_API_KEY`
- Redeploy after setting secrets

## Next Steps

1. Set up Firebase Authentication (optional, for user accounts)
2. Add Firebase Analytics to track usage
3. Configure error reporting with Firebase Crashlytics
