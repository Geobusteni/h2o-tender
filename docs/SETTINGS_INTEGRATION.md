# Settings Screen Integration Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install @react-native-community/datetimepicker@8.2.0
```

Or with Expo:
```bash
npx expo install @react-native-community/datetimepicker
```

### 2. Import the Screen
```typescript
import { SettingsScreen } from './src/screens/SettingsScreen';
```

### 3. Add to Navigation
The exact integration depends on your navigation setup. Here are examples for common patterns:

#### React Navigation (Stack Navigator)
```typescript
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
      {/* Other screens */}
    </Stack.Navigator>
  );
}
```

#### React Navigation (Tab Navigator)
```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings" size={size} color={color} />
          ),
        }}
      />
      {/* Other tabs */}
    </Tab.Navigator>
  );
}
```

#### Simple Direct Render (for testing)
```typescript
import { SettingsScreen } from './src/screens/SettingsScreen';

export default function App() {
  return (
    <AppProvider>
      <SettingsScreen />
    </AppProvider>
  );
}
```

### 4. Navigate to Settings
From any screen with navigation access:

```typescript
// Using React Navigation
navigation.navigate('Settings');

// Or as a button
<TouchableOpacity onPress={() => navigation.navigate('Settings')}>
  <Text>Open Settings</Text>
</TouchableOpacity>
```

## Required Context

The SettingsScreen requires the AppContext to be available:

```typescript
import { AppProvider } from './src/context/AppContext';

export default function App() {
  return (
    <AppProvider>
      {/* Your navigation here */}
    </AppProvider>
  );
}
```

## Files Created

All files are ready to use with no modifications needed:

```
/root/gits/h2o-tender/
├── src/
│   ├── screens/
│   │   └── SettingsScreen.tsx          (720 lines)
│   └── components/
│       ├── SettingsRow.tsx             (129 lines)
│       ├── TimePicker.tsx              (180 lines)
│       └── SegmentedControl.tsx        (101 lines)
├── docs/
│   ├── SETTINGS_SCREEN.md              (Documentation)
│   └── SETTINGS_INTEGRATION.md         (This file)
└── package.json                         (Updated with datetimepicker)
```

## Navigation Flow

### From Settings Screen
The Settings screen can navigate to:
- **Onboarding**: When "Rerun AI Onboarding" is pressed
  - Sets `onboardingComplete: false`
  - Navigates to `'Onboarding'` screen

### To Settings Screen
Typically accessed from:
- Tab bar navigation
- Hamburger menu
- Header button on main screen

## Features Checklist

After integration, verify these features work:

- [ ] Screen displays current settings from context
- [ ] Weight modal opens and saves correctly
- [ ] Age modal opens and saves correctly
- [ ] Activity picker shows and updates goal
- [ ] Climate picker shows and updates goal
- [ ] Time pickers work on both iOS and Android
- [ ] Reminder frequency segmented control works
- [ ] Daily goal updates in real-time
- [ ] "Rerun AI Onboarding" navigates correctly
- [ ] "Reset All Data" clears storage
- [ ] "Support Development" opens browser
- [ ] Settings persist after app restart

## Troubleshooting

### Common Issues

**Issue**: `DateTimePicker` not found
```bash
# Solution: Install the dependency
npx expo install @react-native-community/datetimepicker
```

**Issue**: Navigation error when pressing buttons
```bash
# Solution: Pass navigation prop to SettingsScreen
<SettingsScreen navigation={navigation} />
```

**Issue**: Settings don't persist
```bash
# Solution: Ensure AppProvider wraps your app
<AppProvider>
  <NavigationContainer>
    {/* Your screens */}
  </NavigationContainer>
</AppProvider>
```

**Issue**: Daily goal not updating
```bash
# Solution: Check that calculateDailyGoal is working
import { calculateDailyGoal } from './src/utils/hydration';
console.log(calculateDailyGoal(70, 'mild', 'light')); // Should return a number
```

## TypeScript Support

All components are fully typed. If using TypeScript, no additional type definitions are needed.

### Navigation Types (Optional)
For type-safe navigation:

```typescript
type RootStackParamList = {
  Settings: undefined;
  Onboarding: undefined;
  // other screens...
};

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}
```

## Custom Styling

To customize the look, modify the styles in each component:

### Change Primary Color
Find and replace `#4A90E2` in:
- `/root/gits/h2o-tender/src/screens/SettingsScreen.tsx`
- `/root/gits/h2o-tender/src/components/SegmentedControl.tsx`
- `/root/gits/h2o-tender/src/components/TimePicker.tsx`

### Change Danger Color
Find and replace `#E74C3C` in:
- `/root/gits/h2o-tender/src/screens/SettingsScreen.tsx`

## Next Steps

1. Install dependencies: `npm install`
2. Add SettingsScreen to your navigation
3. Test on both iOS and Android
4. Customize donation URL in SettingsScreen.tsx (line with `buymeacoffee.com`)
5. Implement notification sound functionality if needed

## Support

For issues or questions:
- Check the main documentation: `/root/gits/h2o-tender/docs/SETTINGS_SCREEN.md`
- Review the CLAUDE.md project specifications
- Verify all dependencies are installed correctly
