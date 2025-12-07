# Local Development Setup - Completion Guide

This guide will help you complete the Firebase setup that requires interactive steps.

## ✅ Completed Steps

1. ✅ Installed main project dependencies (`npm install`)
2. ✅ Installed Firebase functions dependencies
3. ✅ Installed Firebase CLI globally
4. ✅ Configured Firebase functions to use OpenAI (v6 SDK)
5. ✅ Created feature branch: `feature/local-development-setup`

## 🔧 Manual Steps Required

### Step 1: Login to Firebase

Run this command in your terminal (it will open a browser for authentication):

```bash
firebase login
```

### Step 2: Initialize Firebase Project

```bash
cd /Users/alex/Sites/h2o-tender
firebase init functions
```

When prompted:
- **Select**: "Use an existing project" → choose your Firebase project
- **Language**: JavaScript
- **ESLint**: No (or Yes if you prefer)
- **Install dependencies**: Yes (already done, but safe to run again)

This will create:
- `firebase.json` - Firebase configuration
- `.firebaserc` - Project aliases

### Step 3: Set OpenAI API Key

You have two options depending on your Firebase plan:

**Option A: Blaze Plan (Recommended - Pay-as-you-go)**
```bash
firebase functions:secrets:set OPENAI_API_KEY
```
When prompted, paste your OpenAI API key. This is the recommended method for production.

**Option B: Environment Variables (Works on all plans - Recommended for local dev)**
```bash
cd firebase/functions
cp .env.example .env
# Then edit .env and add your API key: OPENAI_API_KEY=your_key_here
```

Or set it directly:
```bash
export OPENAI_API_KEY="your_api_key_here"
firebase deploy --only functions
```

> **Note**: The deprecated `functions.config()` method will stop working after March 2026. Use environment variables or secrets instead.

Get your OpenAI API key from: https://platform.openai.com/api-keys

### Step 4: Deploy Firebase Functions

```bash
cd firebase/functions
firebase deploy --only functions
```

After deployment, you'll see output like:
```
✔  functions[hydrationAiProxy(us-central1)] Successful create operation.
Function URL: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/hydrationAiProxy
```

**Copy the Function URL** - you'll need it in the next step.

### Step 5: Update App Configuration

Edit `src/services/ai.ts` and update line 18:

```typescript
private static CLOUD_FUNCTION_URL = 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/hydrationAiProxy';
```

Replace `YOUR_PROJECT_ID` with your actual Firebase project ID.

### Step 6: Test the Setup

Start the development server:

```bash
npm start
```

Then test the app. The AI features should now work with your OpenAI API key.

## 🧪 Testing Locally (Optional)

To test Firebase functions locally before deploying:

```bash
cd firebase/functions
firebase emulators:start --only functions
```

This starts a local emulator. You'll need to set the secret for local testing:

```bash
# In a separate terminal
export OPENAI_API_KEY="your-api-key-here"
```

Then update `src/services/ai.ts` temporarily to point to:
```typescript
private static CLOUD_FUNCTION_URL = 'http://localhost:5001/YOUR_PROJECT_ID/us-central1/hydrationAiProxy';
```

## 📝 Next Steps

1. Complete the manual steps above
2. Test the app to ensure AI features work
3. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: configure Firebase functions for OpenAI integration"
   ```
4. Push the feature branch:
   ```bash
   git push origin feature/local-development-setup
   ```

## 🐛 Troubleshooting

### "Secret not found" or "Blaze plan required" error
- If you're on the Spark (free) plan, use environment variables instead:
  ```bash
  cd firebase/functions
  cp .env.example .env
  # Edit .env and add: OPENAI_API_KEY=your_key_here
  ```
- If using secrets, ensure you've run: `firebase functions:secrets:set OPENAI_API_KEY`
- Redeploy after setting: `firebase deploy --only functions`

### Deprecation notice about functions.config()
- `functions.config()` is deprecated and will stop working after March 2026
- Use environment variables (`.env` file) or secrets instead
- The code has been updated to use `process.env.OPENAI_API_KEY` which works with both methods

### "Function not found" error
- Verify the function URL in `src/services/ai.ts` matches your deployed function
- Check Firebase console: https://console.firebase.google.com/

### "Permission denied" error
- Ensure the function is set to allow unauthenticated calls (default for onCall functions)
- Check CORS settings if calling from web

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Project Development Setup Guide](./docs/DEVELOPMENT_SETUP.md)

