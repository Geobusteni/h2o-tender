# Getting Started with H2O Tender

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio (for emulator)
- Expo Go app on physical device (optional)

## Quick Start

### 1. Install Dependencies

```bash
cd h2o-tender
npm install
```

### 2. Start Development Server

```bash
npm start
# or
expo start
```

### 3. Run on Device/Simulator

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

## Project Structure

```
h2o-tender/
├── App.tsx                 # Main entry with navigation
├── src/
│   ├── models/
│   │   └── types.ts        # TypeScript interfaces
│   ├── services/
│   │   ├── ai.ts           # AI service (Firebase proxy)
│   │   ├── notifications.ts # Push notifications
│   │   └── persistence.ts  # AsyncStorage wrapper
│   ├── screens/
│   │   ├── AIOnboardingScreen.tsx  # Onboarding chat
│   │   ├── HomeScreen.tsx          # Main dashboard
│   │   └── SettingsScreen.tsx      # User settings
│   ├── components/
│   │   ├── ChatBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── QuickAddModal.tsx
│   │   └── ...
│   ├── utils/
│   │   ├── hydration.ts    # Calculation functions
│   │   └── location.ts     # Location utilities
│   ├── context/
│   │   └── AppContext.tsx  # Global state
│   └── assets/
│       └── climate_fallback.json  # Offline climate DB
├── firebase/
│   └── functions/          # Cloud Function for AI proxy
└── docs/                   # Documentation
```

## Key Features

### 1. AI Onboarding
The app starts with a conversational onboarding that collects:
- Location (GPS or manual)
- Weight and age
- Activity level
- Wake/sleep times
- Reminder frequency

### 2. Hydration Calculation
```
Daily Goal = (Weight × 32) + Climate Adjustment + Activity Adjustment

Climate: cold=0, mild=+150, hot=+300, veryHot=+600
Activity: none=0, light=+150, moderate=+300, heavy=+600
```

### 3. Smart Reminders
- Scheduled between wake and sleep times
- "Drink Now" and "Skip" actions
- Skip redistributes water to remaining reminders

### 4. Offline Support
- Climate fallback database for offline use
- All data persisted locally with AsyncStorage

## Configuration

### Firebase Setup (Required for AI)

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.

Quick steps:
1. Create Firebase project
2. Deploy Cloud Function
3. Add your LLM API key (OpenAI or Anthropic)
4. Update URL in `src/services/ai.ts`

### Notifications Setup

Notifications work automatically on:
- iOS: Requires permission (prompted on first launch)
- Android: Works by default

For iOS builds, ensure you have:
- Apple Developer account
- Push notification capability enabled

## Development Commands

```bash
# Start development
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm test
```

## Building for Production

### Expo EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Local Build

```bash
# iOS (requires Mac)
expo run:ios --configuration Release

# Android
expo run:android --variant release
```

## Testing on Physical Device

1. Install Expo Go from App Store / Play Store
2. Run `expo start`
3. Scan QR code with camera (iOS) or Expo Go (Android)

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules
npm install
```

### iOS Simulator not launching
```bash
sudo xcode-select -s /Applications/Xcode.app
```

### Android Emulator issues
- Ensure ANDROID_HOME is set
- Run `adb devices` to verify connection

### Notifications not working
- iOS: Check notification permissions in Settings
- Android: Check notification channel settings
- Both: Ensure device is not in Do Not Disturb mode

## Next Steps

1. Complete Firebase setup for AI functionality
2. Customize the app icon and splash screen
3. Add additional cities to `climate_fallback.json`
4. Configure donation URL in Settings screen
