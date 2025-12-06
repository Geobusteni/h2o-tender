# Settings Screen Documentation

## Overview
The Settings screen allows users to modify their hydration preferences and app configuration. All changes are persisted immediately and trigger real-time recalculation of the daily hydration goal.

## File Structure

### Created Files
```
/root/gits/h2o-tender/src/
├── screens/
│   └── SettingsScreen.tsx          # Main settings screen
└── components/
    ├── SettingsRow.tsx              # Reusable settings row component
    ├── TimePicker.tsx               # Cross-platform time picker
    └── SegmentedControl.tsx         # Segmented button control
```

## Installation

### Required Dependencies
The Settings screen requires `@react-native-community/datetimepicker` for time selection:

```bash
npm install @react-native-community/datetimepicker@8.2.0
```

Or with Expo:
```bash
npx expo install @react-native-community/datetimepicker
```

This dependency has been added to `package.json`.

## Features

### 1. Profile Settings
- **Weight**: Numeric input (kg) with validation (1-500 kg)
- **Age**: Optional numeric input with validation (1-120 years)
- **Activity Level**: Picker with 4 options (none, light, moderate, heavy)
- **Climate**: Picker with 4 options (cold, mild, hot, veryHot)

### 2. Reminder Schedule
- **Wake Time**: Time picker for start of hydration window
- **Sleep Time**: Time picker for end of hydration window
- **Reminder Frequency**: Segmented control (60 or 90 minutes)

### 3. Notifications
- **Notification Sound**: Toggle switch (UI only, sound functionality to be implemented)

### 4. Actions
- **Rerun AI Onboarding**: Clears onboarding flag and navigates back to onboarding
- **Reset All Data**: Destructive action with confirmation dialog
- **Support Development**: Opens donation link in browser

## Components

### SettingsRow
Reusable component for displaying settings items with consistent styling.

**Props:**
```typescript
interface SettingsRowProps {
  label: string;                      // Setting label text
  value?: string | number;            // Display value
  onPress?: () => void;               // Tap handler
  type?: 'text' | 'number' | 'picker' | 'toggle' | 'time' | 'custom';
  toggleValue?: boolean;              // For toggle type
  onToggleChange?: (value: boolean) => void;
  customRightComponent?: React.ReactNode;
  style?: ViewStyle;
  showChevron?: boolean;              // Show right chevron
}
```

**Usage:**
```tsx
<SettingsRow
  label="Weight"
  value={`${weight} kg`}
  type="number"
  onPress={showWeightInput}
  showChevron
/>
```

### TimePicker
Cross-platform time picker that returns time in "HH:MM" format.

**Props:**
```typescript
interface TimePickerProps {
  value: string;              // Time in "HH:MM" format
  onChange: (time: string) => void;
  label?: string;             // Modal title (iOS only)
}
```

**Platform Differences:**
- **iOS**: Shows modal with spinner and "Done" button
- **Android**: Shows inline picker that auto-dismisses

**Usage:**
```tsx
<TimePicker
  value={wakeTime}
  onChange={handleWakeTimeChange}
  label="Wake Time"
/>
```

### SegmentedControl
Segmented button control for selecting between options.

**Props:**
```typescript
interface SegmentedControlProps {
  options: string[];          // Array of option labels
  selectedIndex: number;      // Currently selected index
  onChange: (index: number) => void;
  style?: ViewStyle;
}
```

**Usage:**
```tsx
<SegmentedControl
  options={['60 min', '90 min']}
  selectedIndex={reminderFrequency === 60 ? 0 : 1}
  onChange={handleReminderFrequencyChange}
/>
```

## Functionality

### Real-time Goal Calculation
The daily goal is recalculated whenever weight, climate, or activity level changes:

```typescript
const currentGoal = calculateDailyGoal(weight, climate, activity);
```

The formula used:
```
Base = weight (kg) × 32 (ml/kg)
Climate adjustment:
  - cold: -200 ml
  - mild: 0 ml
  - hot: +300 ml
  - veryHot: +500 ml
Activity adjustment:
  - none: 0 ml
  - light: +200 ml
  - moderate: +500 ml
  - heavy: +800 ml
```

### Notification Rescheduling
When wake time, sleep time, or reminder frequency changes, notifications are automatically rescheduled:

```typescript
const rescheduleNotifications = async (wake, sleep, frequency) => {
  const goal = calculateDailyGoal(weight, climate, activity);
  const schedule = computeReminderSchedule(wake, sleep, frequency, goal);
  await NotificationService.rescheduleReminders(schedule, wake, sleep);
};
```

### Data Persistence
All settings changes are immediately persisted using the `updateSettings` function from AppContext:

```typescript
await updateSettings({ weight: newWeight });
```

This triggers:
1. Context state update
2. AsyncStorage persistence
3. Daily goal recalculation (if relevant)
4. Daily state update (if goal changed)

## User Experience

### Input Validation
- Weight: Must be between 1-500 kg
- Age: Must be between 1-120 years (optional)
- Invalid inputs show alert dialogs

### Confirmation Dialogs
Destructive actions require confirmation:
- **Rerun Onboarding**: Warns user that current settings persist until completion
- **Reset All Data**: Double confirmation with destructive button style

### Visual Feedback
- Current daily goal displayed prominently at top
- Selected values highlighted in pickers
- Active touch states on all interactive elements

## Navigation

### Required Navigation Props
The screen expects a `navigation` prop for navigation actions:

```typescript
interface SettingsScreenProps {
  navigation?: any;
}
```

**Navigation Targets:**
- `Onboarding`: When rerunning AI onboarding or after reset

## Styling

### Color Scheme
- Primary: `#4A90E2` (blue)
- Danger: `#E74C3C` (red)
- Background: `#F5F5F5` (light gray)
- White: `#FFFFFF`
- Text: `#333333`, `#666666`

### Responsive Layout
- Scrollable content for all screen sizes
- Modal inputs with 80% width, max 400px
- Touch targets minimum 44px height
- Bottom spacing for scrolling clearance

## Integration

### Context Integration
The screen uses the `useApp()` hook from AppContext:

```typescript
const { settings, updateSettings } = useApp();
```

### Service Integration
- **NotificationService**: For rescheduling reminders
- **persistence**: For reset functionality

## Future Enhancements
- Notification sound preference implementation
- Auto-detect climate option
- Export/import settings
- Statistics and history viewing
- Dark mode support

## Testing Checklist
- [ ] Weight input accepts valid values (1-500)
- [ ] Weight input rejects invalid values
- [ ] Age input is optional
- [ ] Activity level changes recalculate goal
- [ ] Climate changes recalculate goal
- [ ] Time pickers work on iOS and Android
- [ ] Reminder frequency changes reschedule notifications
- [ ] Rerun onboarding navigates correctly
- [ ] Reset all data clears storage
- [ ] Support link opens browser
- [ ] All modals can be cancelled
- [ ] Settings persist across app restarts
