# H2O Tender - Product Plan

## 1. Product Vision

H2O Tender is a cross-platform hydration tracking app that uses conversational AI onboarding to create personalized daily water intake goals. Unlike generic hydration apps that use one-size-fits-all recommendations, H2O Tender calculates precise targets based on individual factors (weight, activity, climate, schedule) and adapts throughout the day when users skip reminders. The app prioritizes simplicity: users complete a friendly chat once, then interact primarily through notifications and quick-add buttons.

---

## 2. Core User Stories

| # | User Story | Priority |
|---|------------|----------|
| 1 | As a new user, I want to complete a quick AI chat that asks about my lifestyle so that I get a personalized hydration goal without manual setup. | P0 |
| 2 | As a user, I want to see my daily progress as a simple circular gauge so that I instantly know how much more I need to drink. | P0 |
| 3 | As a user, I want to tap quick-add buttons (+100ml, +200ml, custom) so that logging water takes under 2 seconds. | P0 |
| 4 | As a user, I want to receive push notifications at smart intervals so that I stay on track without constant app checking. | P0 |
| 5 | As a user, I want to tap "Skip" on a reminder and have the remaining water redistributed to later reminders so that my daily goal stays achievable. | P1 |
| 6 | As a user, I want to edit my profile (weight, activity, location) in settings so that my goal updates when my circumstances change. | P1 |
| 7 | As a user, I want the app to work offline using stored climate data so that I can log water anywhere. | P2 |

---

## 3. MVP Feature List

### Must Have (Phase 1)
- AI onboarding chat (collects: location, weight, age, activity level, wake/sleep times, reminder frequency)
- Hydration goal calculation using formula
- Home screen with circular progress indicator
- Quick-add buttons: +100ml, +200ml, +Custom
- Local storage for daily logs
- Basic settings screen

### Should Have (Phase 2)
- Push notifications with "Drink Now" and "Skip" actions
- Skip redistribution logic
- Firebase Cloud Function AI proxy
- Settings with live goal recalculation

### Nice to Have (Phase 3)
- Offline climate database fallback
- Weekly/monthly progress charts
- Streak tracking

---

## 4. Screen Flow

```
[Launch]
    |
    v
[Onboarding Check] ---> [AI Chat Onboarding] ---> [Home]
    |                   (first launch only)
    v
[Home Screen]
    |-- Tap progress ring ---> [Today's Log Detail]
    |-- Tap quick-add btn ---> [Water logged, ring updates]
    |-- Tap custom btn ------> [Custom Amount Modal]
    |-- Tap settings icon ---> [Settings Screen]

[Notification Received]
    |-- Tap "Drink Now" ---> [Home + auto-log default amount]
    |-- Tap "Skip" -------> [Redistribute remaining, update reminders]

[Settings Screen]
    |-- Edit weight ------> [Goal recalculates live]
    |-- Edit location ----> [Climate adjustment updates]
    |-- Edit activity ----> [Goal recalculates live]
    |-- Edit wake/sleep --> [Reminder schedule updates]
    |-- Edit frequency ---> [Reminder interval updates]
```

---

## 5. Technical Architecture

### High-Level Component Overview

```
+------------------------------------------------------------------+
|                        REACT NATIVE (EXPO)                        |
+------------------------------------------------------------------+
|                                                                   |
|  [Screens]              [Components]           [Services]         |
|  - OnboardingChat       - ProgressRing         - HydrationCalc    |
|  - Home                 - QuickAddButtons      - NotificationMgr  |
|  - Settings             - ReminderCard         - StorageService   |
|  - LogDetail            - SettingsForm         - AIService        |
|                                                                   |
+------------------------------------------------------------------+
|                         LOCAL STATE                               |
|  - AsyncStorage (user profile, daily logs)                        |
|  - React Context (current day state)                              |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    FIREBASE CLOUD FUNCTIONS                       |
|  - /api/chat (AI proxy - protects API keys)                      |
|  - /api/climate (optional: real-time climate lookup)             |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      EXTERNAL SERVICES                            |
|  - OpenAI/Claude API (via Firebase proxy)                        |
|  - Weather API (climate data)                                    |
+------------------------------------------------------------------+
```

### Hydration Formula

```
Daily Goal (ml) = Base + Climate Adjustment + Activity Adjustment

Base = weight (kg) * 32

Climate Adjustment:
  - Cold (<10C):     +0 ml
  - Mild (10-20C):   +150 ml
  - Hot (20-30C):    +300 ml
  - Very Hot (>30C): +600 ml

Activity Adjustment:
  - None/Sedentary:  +0 ml
  - Light:           +150 ml
  - Moderate:        +300 ml
  - Heavy:           +600 ml
```

### Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Expo (managed workflow) | Fastest path to both iOS and Android with minimal native config |
| AsyncStorage | Simple key-value store sufficient for MVP; no backend needed for user data |
| Firebase Cloud Functions | Secure AI proxy without exposing API keys in client bundle |
| Local-first architecture | App works offline; cloud functions only for AI chat and optional climate |
| Expo Notifications | Cross-platform push notifications with action buttons |

---

## 6. Implementation Phases

### Phase 1: Core Loop (Week 1-2)
**Goal:** User can complete onboarding and log water

- [ ] Project setup (Expo, TypeScript, basic navigation)
- [ ] AI onboarding chat UI (static flow first, AI integration later)
- [ ] Hydration calculation service
- [ ] Home screen with progress ring
- [ ] Quick-add buttons (+100ml, +200ml, custom modal)
- [ ] AsyncStorage for profile and daily logs
- [ ] Basic settings screen (view only)

**Exit Criteria:** User completes onboarding, sees goal, logs water, progress updates.

### Phase 2: Notifications & Settings (Week 3-4)
**Goal:** User receives reminders and can adjust settings

- [ ] Firebase Cloud Function setup (AI proxy)
- [ ] Connect onboarding chat to AI proxy
- [ ] Push notification scheduling based on wake/sleep times
- [ ] Notification actions: "Drink Now" and "Skip"
- [ ] Skip redistribution logic
- [ ] Editable settings with live recalculation
- [ ] Reminder frequency adjustment

**Exit Criteria:** User receives smart reminders, can skip and see redistribution, can edit all profile fields.

### Phase 3: Polish & Offline (Week 5-6)
**Goal:** App is reliable and delightful

- [ ] Offline climate database (fallback when no network)
- [ ] Error handling and loading states
- [ ] Onboarding flow polish (animations, progress indicator)
- [ ] Settings validation and edge cases
- [ ] App icon and splash screen
- [ ] Basic analytics (anonymous usage)

**Exit Criteria:** App works offline, handles errors gracefully, feels polished.

### Phase 4: Launch Prep (Week 7)
**Goal:** Ready for App Store / Play Store

- [ ] App Store screenshots and description
- [ ] Privacy policy (required for both stores)
- [ ] TestFlight / Internal testing
- [ ] Bug fixes from testing
- [ ] Performance optimization
- [ ] Submit to stores

**Exit Criteria:** App submitted and approved on both platforms.

---

## Appendix: Data Models

### UserProfile
```typescript
interface UserProfile {
  id: string;
  weight: number;           // kg
  age: number;
  location: string;         // city or region
  climate: 'cold' | 'mild' | 'hot' | 'veryHot';
  activityLevel: 'none' | 'light' | 'moderate' | 'heavy';
  wakeTime: string;         // "07:00"
  sleepTime: string;        // "22:00"
  reminderFrequency: number; // minutes between reminders
  dailyGoal: number;        // calculated, ml
  onboardingComplete: boolean;
}
```

### DailyLog
```typescript
interface DailyLog {
  date: string;             // "2024-01-15"
  goal: number;             // ml (snapshot from that day)
  entries: WaterEntry[];
  skippedReminders: number;
}

interface WaterEntry {
  id: string;
  amount: number;           // ml
  timestamp: string;        // ISO datetime
  source: 'manual' | 'notification';
}
```

### ReminderSchedule
```typescript
interface ReminderSchedule {
  nextReminder: string;     // ISO datetime
  remainingToday: number;   // ml still to drink
  remindersLeft: number;    // count of remaining reminders
  amountPerReminder: number; // ml to suggest per reminder
}
```
