# H2O Tender - Cross-Platform Hydration App

## Project Overview
H2O Tender is a cross-platform (iOS & Android) hydration tracking app built with React Native. It uses AI-powered onboarding to personalize hydration goals and reminder schedules.

## Tech Stack
- **Framework**: React Native (Expo managed workflow for simplicity)
- **Backend**: Firebase (Cloud Functions for AI proxy, no API keys in app)
- **State Management**: React Context + AsyncStorage
- **Notifications**: expo-notifications (cross-platform)
- **Location**: expo-location

## Core Features
1. **AI Onboarding Chat** - Conversational UI to collect user data
2. **Smart Hydration Goals** - Formula-based calculation with climate/activity adjustments
3. **Reminder Scheduling** - Notifications between wake/sleep times
4. **Skip Redistribution** - Missed reminders redistribute water to remaining ones
5. **Progress Tracking** - Circular progress, quick-add buttons, daily stats

## Hydration Formula (EXACT)
```
Base = weightKg * 32 (ml)
Climate: cold=+0, mild=+150, hot=+300, veryHot=+600
Activity: none=+0, light=+150, moderate=+300, heavy=+600
dailyGoalML = Base + ClimateAdj + ActivityAdj
```

## Data Models
```typescript
interface UserSettings {
  age?: number;
  weight: number; // kg
  activity: 'none' | 'light' | 'moderate' | 'heavy';
  wakeTime: string; // HH:mm format
  sleepTime: string; // HH:mm format
  reminderFrequency: 60 | 90; // minutes
  climate: 'cold' | 'mild' | 'hot' | 'veryHot';
  dailyGoalML: number;
  aiProfileSummary: string;
  locationName?: string;
}

interface DailyState {
  date: string; // YYYY-MM-DD
  consumedML: number;
  remainingML: number;
  remindersCompleted: number;
  remindersSkipped: number;
  scheduledReminderIds: string[];
}
```

## Skip Redistribution Logic (EXACT)
1. missedAmount = mlForThatReminder
2. remainingML = totalGoalML - consumedML
3. remindersLeft = totalReminders - remindersCompleted - remindersSkipped
4. newMlPerReminder = Math.ceil(remainingML / Math.max(1, remindersLeft))
5. Update future notifications with new amounts

## AI Service
- Use Firebase Cloud Function as proxy (no API keys in app)
- Endpoint: `https://<region>-<project-id>.cloudfunctions.net/hydrationAiProxy`
- Fallback: Local climate_fallback.json when AI unavailable

## AI Prompts
### Location Classification
```
Given coordinates (lat: {lat}, lon: {lon}) identify the nearest city and classify climate (cold/mild/hot/veryHot). Return JSON: { city: string, climate: string, explanation: string }
```

### Onboarding Summary
```
User inputs: weight={weight}kg, age={age}, activity={activity}, wake={wake}, sleep={sleep}, frequency={frequency}min, place={placeName}. Using formula: Base=weight*32 ml plus climate and activity adjustments. Explain dailyGoalML calculation and reminder schedule.
```

## File Structure
```
h2o-tender/
├── App.tsx
├── src/
│   ├── models/           # TypeScript interfaces
│   ├── services/         # AI, Notifications, Persistence
│   ├── screens/          # Main app screens
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Hydration math, helpers
│   ├── context/          # App state context
│   └── assets/           # climate_fallback.json
├── firebase/             # Cloud Function code
└── docs/                 # Setup instructions
```

## Development Rules
- Keep it simple - choose the simplest solution
- No over-engineering - only build what's specified
- Offline-first - fallback DB when AI unavailable
- Cross-platform - same codebase for iOS and Android
- Accessible UI - large touch targets, clear fonts

## Firebase Setup Required
1. Create Firebase project
2. Deploy Cloud Function for AI proxy
3. Configure in app (project ID only, no API keys)
