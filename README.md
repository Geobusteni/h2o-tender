# H2O Tender

A React Native hydration tracking app built with Expo.

## Features

- Personalized daily hydration goals based on weight, activity level, and climate
- Smart reminder scheduling throughout the day
- Progress tracking with visual feedback
- Climate-aware recommendations
- AI-powered hydration insights

## Project Structure

```
h2o-tender/
├── App.tsx                          # Main entry point
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
└── src/
    ├── assets/
    │   └── climate_fallback.json    # Climate database fallback
    ├── context/
    │   └── AppContext.tsx           # Global state management
    ├── models/
    │   └── types.ts                 # TypeScript type definitions
    ├── services/
    │   └── persistence.ts           # AsyncStorage wrapper
    └── utils/
        └── hydration.ts             # Hydration calculation logic
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
- Scan the QR code with Expo Go app (iOS/Android)
- Press `i` for iOS simulator
- Press `a` for Android emulator

## Core Calculations

### Daily Hydration Goal

The app uses the following formula to calculate daily water intake:

```
Base = weight (kg) × 32 ml/kg

Climate Adjustment:
- Cold: -200 ml
- Mild: 0 ml
- Hot: +300 ml
- Very Hot: +500 ml

Activity Adjustment:
- None: 0 ml
- Light: +200 ml
- Moderate: +500 ml
- Heavy: +800 ml

Total = Base + Climate + Activity
```

### Reminder Scheduling

Reminders are distributed evenly throughout the user's waking hours based on their selected frequency (60 or 90 minutes).

## Technology Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **AsyncStorage** - Local data persistence
- **Expo Notifications** - Push notifications
- **Expo Location** - Geolocation services

## Screens

- **AI Onboarding** - Conversational chat to collect user preferences
- **Home** - Dashboard with progress ring, quick-add buttons, next reminder
- **Settings** - Edit all parameters with live goal recalculation

## Setup

1. `npm install`
2. `npm start`
3. Set up Firebase Cloud Function (see `docs/FIREBASE_SETUP.md`)

## License

Private project
