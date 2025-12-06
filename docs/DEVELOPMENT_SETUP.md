# Development Setup Guide

Complete guide to setting up H2O Tender for local development on macOS, Windows, and Linux.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the App](#running-the-app)
4. [Platform-Specific Setup](#platform-specific-setup)
5. [Firebase Setup](#firebase-setup)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### All Platforms

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18.x or 20.x | JavaScript runtime |
| npm | 9.x+ | Package manager (comes with Node.js) |
| Git | 2.x+ | Version control |

### Verify Installation

```bash
node --version   # Should show v18.x.x or v20.x.x
npm --version    # Should show 9.x.x or 10.x.x
git --version    # Should show 2.x.x
```

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/Geobusteni/h2o-tender.git
cd h2o-tender
```

### Step 2: Install Dependencies

```bash
# Install main app dependencies
npm install

# Install Firebase Cloud Functions dependencies (optional, for backend development)
cd firebase/functions
npm install
cd ../..
```

### Step 3: Install Expo CLI (Global)

```bash
npm install -g expo-cli
```

Or use npx (no global install needed):
```bash
npx expo --version
```

---

## Running the App

### Start Development Server

```bash
npm start
# or
npx expo start
```

This opens the Expo Dev Tools in your terminal with options:

```
› Press a │ open Android
› Press i │ open iOS simulator (macOS only)
› Press w │ open web
› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

### Running on Physical Device

1. Install **Expo Go** app from:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start the dev server: `npm start`

3. Scan the QR code:
   - **iOS**: Use the Camera app to scan
   - **Android**: Use Expo Go app to scan

---

## Platform-Specific Setup

### macOS (iOS + Android Development)

#### iOS Development

1. **Install Xcode** from the Mac App Store

2. **Install Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```

3. **Accept Xcode License**:
   ```bash
   sudo xcodebuild -license accept
   ```

4. **Install CocoaPods** (for native dependencies):
   ```bash
   sudo gem install cocoapods
   ```

5. **Run iOS Simulator**:
   ```bash
   npm start
   # Then press 'i' to open iOS simulator
   ```

   Or directly:
   ```bash
   npx expo run:ios
   ```

#### Android Development on macOS

1. **Install Android Studio**:
   - Download from [developer.android.com/studio](https://developer.android.com/studio)
   - Run the installer and follow the setup wizard

2. **Install Android SDK** (via Android Studio):
   - Open Android Studio → More Actions → SDK Manager
   - Install: Android SDK Platform 34, Android SDK Build-Tools, Android Emulator

3. **Set Environment Variables** (add to `~/.zshrc` or `~/.bash_profile`):
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

4. **Reload shell**:
   ```bash
   source ~/.zshrc
   ```

5. **Create Android Virtual Device (AVD)**:
   - Android Studio → More Actions → Virtual Device Manager
   - Create Device → Select a phone (e.g., Pixel 7) → Select system image → Finish

6. **Run Android Emulator**:
   ```bash
   npm start
   # Then press 'a' to open Android emulator
   ```

---

### Windows (Android Development Only)

> **Note**: iOS development requires macOS. For iOS testing on Windows, use Expo Go on a physical iPhone or use a cloud-based Mac service.

#### Step 1: Install Node.js

1. Download from [nodejs.org](https://nodejs.org/) (LTS version)
2. Run installer, keep default options
3. Restart terminal/PowerShell

#### Step 2: Install Android Studio

1. Download from [developer.android.com/studio](https://developer.android.com/studio)
2. Run installer with these components:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device
   - Intel HAXM (for faster emulation)

#### Step 3: Set Environment Variables

1. Open **System Properties** → **Environment Variables**

2. Add new **User Variable**:
   - Name: `ANDROID_HOME`
   - Value: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`

3. Edit **Path** variable, add these entries:
   ```
   %ANDROID_HOME%\emulator
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

4. Restart PowerShell/Command Prompt

#### Step 4: Create Android Emulator

1. Open Android Studio
2. More Actions → Virtual Device Manager
3. Create Device → Pixel 7 → Select system image (API 34) → Finish

#### Step 5: Run the App

```powershell
cd h2o-tender
npm install
npm start
# Press 'a' to open Android emulator
```

#### Windows-Specific Tips

- Use **PowerShell** or **Windows Terminal** (not Command Prompt)
- If npm is slow, try: `npm config set registry https://registry.npmjs.org/`
- For faster builds, add project folder to Windows Defender exclusions

---

### Linux (Android Development Only)

#### Ubuntu/Debian

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install required libraries for Android Studio
sudo apt-get install -y libc6:i386 libncurses5:i386 libstdc++6:i386 lib32z1 libbz2-1.0:i386

# Install Android Studio
# Download from https://developer.android.com/studio
# Extract and run: ./android-studio/bin/studio.sh
```

#### Set Environment Variables

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Reload:
```bash
source ~/.bashrc
```

#### Enable KVM for Faster Emulation

```bash
# Check if KVM is available
egrep -c '(vmx|svm)' /proc/cpuinfo  # Should return > 0

# Install KVM
sudo apt-get install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils

# Add user to kvm group
sudo adduser $USER kvm

# Logout and login again
```

#### Run the App

```bash
npm start
# Press 'a' to open Android emulator
```

---

## Firebase Setup

The app uses Firebase Cloud Functions as an AI proxy. This is optional for basic development.

### Step 1: Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it `h2o-tender` (or any name)
4. Disable Google Analytics (optional)
5. Create project

### Step 2: Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Step 3: Initialize Firebase

```bash
cd h2o-tender
firebase init functions

# Select:
# - Use existing project → h2o-tender
# - Language: JavaScript
# - ESLint: No (we have our own config)
# - Install dependencies: Yes
```

### Step 4: Configure AI Provider

Edit `firebase/functions/index.js` and uncomment your preferred AI provider:

**Option A: OpenAI**
```javascript
// Set API key
firebase functions:secrets:set OPENAI_API_KEY
```

**Option B: Anthropic Claude**
```javascript
// Set API key
firebase functions:secrets:set ANTHROPIC_API_KEY
```

### Step 5: Deploy Functions

```bash
cd firebase/functions
npm install
firebase deploy --only functions
```

### Step 6: Update App Configuration

Edit `src/services/ai.ts`:
```typescript
private static CLOUD_FUNCTION_URL = 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/hydrationAiProxy';
```

---

## Development Workflow

### Code Structure

```
h2o-tender/
├── App.tsx                 # Entry point with navigation
├── src/
│   ├── screens/            # App screens
│   │   ├── AIOnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/         # Reusable UI components
│   ├── services/           # AI, notifications, persistence
│   ├── utils/              # Calculation functions
│   ├── context/            # Global state (AppContext)
│   └── assets/             # Static assets, fallback data
├── firebase/functions/     # Backend Cloud Functions
└── docs/                   # Documentation
```

### Common Commands

```bash
# Start development server
npm start

# Run on iOS (macOS only)
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

### Making Changes

1. Edit files in `src/`
2. App auto-reloads (Fast Refresh)
3. If stuck, press `r` in terminal to reload
4. For native changes, restart with `npm start`

### Pre-commit Checks (Optional)

Install pre-commit hooks for automatic security scanning:

```bash
pip install pre-commit
pre-commit install
```

---

## Troubleshooting

### Common Issues

#### "Metro bundler" not starting
```bash
# Clear cache and restart
npx expo start -c
```

#### iOS Simulator not opening (macOS)
```bash
# Ensure Xcode is selected
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all
```

#### Android Emulator not starting
```bash
# Check if emulator is installed
emulator -list-avds

# Run specific emulator
emulator -avd Pixel_7_API_34
```

#### "Unable to resolve module" error
```bash
# Clear all caches
rm -rf node_modules
npm cache clean --force
npm install
npx expo start -c
```

#### Notifications not working
- **iOS Simulator**: Push notifications don't work in simulator. Use physical device.
- **Android Emulator**: Check notification permissions in device settings.

#### Slow performance on Windows
- Add project folder to Windows Defender exclusions
- Use SSD for project files
- Close unnecessary background apps

### Getting Help

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Project Issues](https://github.com/Geobusteni/h2o-tender/issues)

---

## Next Steps After Setup

1. Run the app: `npm start`
2. Complete the AI onboarding flow
3. Test hydration tracking on Home screen
4. Explore Settings screen
5. (Optional) Set up Firebase for AI features

Happy coding!
