/**
 * Type definitions for H2O Tender application
 * These interfaces define the data models used throughout the app
 */

/**
 * Activity levels for hydration calculation
 */
export type ActivityLevel = 'none' | 'light' | 'moderate' | 'heavy';

/**
 * Climate types for hydration adjustments
 */
export type ClimateType = 'cold' | 'mild' | 'hot' | 'veryHot';

/**
 * Reminder frequency in minutes
 */
export type ReminderFrequency = 60 | 90;

/**
 * User settings and preferences
 * Stored persistently and used to calculate hydration goals
 */
export type WeightUnit = 'kg' | 'lbs';

export interface UserSettings {
  age?: number; // Optional: used for AI profile context
  weight: number; // Weight in kg - required for base calculation (stored in kg internally)
  weightUnit?: WeightUnit; // Preferred unit system for display (kg or lbs)
  activity: ActivityLevel; // Activity level affects hydration needs
  wakeTime: string; // Format: "HH:MM" - start of hydration window
  sleepTime: string; // Format: "HH:MM" - end of hydration window
  reminderFrequency: ReminderFrequency; // How often to remind (60 or 90 minutes)
  climate: ClimateType; // Climate affects hydration needs
  dailyGoalML: number; // Calculated daily hydration goal in milliliters (stored in ml internally)
  aiProfileSummary: string; // AI-generated profile description
  locationName?: string; // Optional: user's location name (e.g., "Bucharest, RO")
  onboardingComplete: boolean; // Whether user has completed initial setup
}

/**
 * Daily hydration state
 * Tracked per day and reset at midnight
 */
export interface DailyState {
  date: string; // Format: "YYYY-MM-DD" - the date this state represents
  consumedML: number; // Total milliliters consumed today
  remainingML: number; // Milliliters remaining to reach goal
  remindersCompleted: number; // Count of reminders user marked as completed
  remindersSkipped: number; // Count of reminders user skipped
  scheduledReminderIds: string[]; // Array of notification IDs for cleanup
}

/**
 * A single scheduled reminder with time and amount
 */
export interface ScheduledReminder {
  time: string; // Format: "HH:MM" - when to remind
  amountML: number; // How much water to suggest drinking
  index: number; // Position in the day's schedule (0-based)
}

/**
 * Chat message for AI interaction
 */
export interface ChatMessage {
  id: string; // Unique message identifier
  role: 'user' | 'assistant'; // Who sent the message
  content: string; // Message text
  timestamp: number; // Unix timestamp in milliseconds
}

/**
 * Climate data entry from fallback database or API
 */
export interface ClimateEntry {
  place: string; // Location name (e.g., "Bucharest, RO")
  lat: number; // Latitude
  lon: number; // Longitude
  climate: ClimateType; // Climate classification
  explanation: string; // Human-readable explanation of climate
}

/**
 * Notification payload data
 * Used when scheduling and receiving notifications
 */
export interface NotificationData {
  type: 'hydration_reminder'; // Notification type
  amountML: number; // Suggested water amount
  reminderIndex: number; // Which reminder in the day's schedule
  scheduledTime: string; // Format: "HH:MM"
}

/**
 * App context state
 * Global state managed by React Context
 */
export interface AppContextState {
  settings: UserSettings | null; // User settings, null if not set
  dailyState: DailyState | null; // Today's state, null if not initialized
  isLoading: boolean; // Whether data is being loaded
  error: string | null; // Error message if any
}

/**
 * App context actions
 * Methods available through the context
 */
export interface AppContextActions {
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  recordConsumption: (amountML: number) => Promise<void>;
  skipReminder: () => Promise<void>;
  completeReminder: () => Promise<void>;
  resetDay: () => Promise<void>;
  refreshData: () => Promise<void>;
}

/**
 * Combined app context type
 */
export type AppContextType = AppContextState & AppContextActions;

/**
 * Default user settings
 * Used when initializing the app or resetting
 */
export const DEFAULT_SETTINGS: UserSettings = {
  weight: 70,
  activity: 'light',
  wakeTime: '07:00',
  sleepTime: '22:00',
  reminderFrequency: 90,
  climate: 'mild',
  dailyGoalML: 2240, // Default based on 70kg, mild climate, light activity
  aiProfileSummary: '',
  onboardingComplete: false,
};

/**
 * Default daily state
 * Used when starting a new day
 */
export const DEFAULT_DAILY_STATE: Omit<DailyState, 'date'> = {
  consumedML: 0,
  remainingML: 0,
  remindersCompleted: 0,
  remindersSkipped: 0,
  scheduledReminderIds: [],
};
