/**
 * Hydration calculation utilities
 * Core business logic for calculating water needs and scheduling reminders
 */

import type {
  ActivityLevel,
  ClimateType,
  ScheduledReminder,
} from '../models/types';

/**
 * Calculate daily hydration goal in milliliters
 *
 * EXACT FORMULA:
 * Base = weight (kg) × 32 (ml/kg)
 * Climate adjustment:
 *   - cold: -200 ml
 *   - mild: 0 ml
 *   - hot: +300 ml
 *   - veryHot: +500 ml
 * Activity adjustment:
 *   - none: 0 ml
 *   - light: +200 ml
 *   - moderate: +500 ml
 *   - heavy: +800 ml
 *
 * @param weight - User's weight in kilograms
 * @param climate - Climate type
 * @param activity - Activity level
 * @returns Daily hydration goal in milliliters
 */
export function calculateDailyGoal(
  weight: number,
  climate: ClimateType,
  activity: ActivityLevel
): number {
  // Base calculation: weight × 32 ml/kg
  const base = weight * 32;

  // Climate adjustments
  const climateAdjustments: Record<ClimateType, number> = {
    cold: -200,
    mild: 0,
    hot: 300,
    veryHot: 500,
  };

  // Activity adjustments
  const activityAdjustments: Record<ActivityLevel, number> = {
    none: 0,
    light: 200,
    moderate: 500,
    heavy: 800,
  };

  const climateAdj = climateAdjustments[climate];
  const activityAdj = activityAdjustments[activity];

  const total = base + climateAdj + activityAdj;

  // Round to nearest 10ml for cleaner numbers
  return Math.round(total / 10) * 10;
}

/**
 * Parse time string to minutes since midnight
 *
 * @param timeStr - Time in "HH:MM" format
 * @returns Minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to "HH:MM" string
 *
 * @param minutes - Minutes since midnight
 * @returns Time in "HH:MM" format
 */
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Compute reminder schedule for the day
 *
 * Divides the awake time into equal intervals based on reminder frequency.
 * Distributes the daily water goal evenly across all reminders.
 *
 * @param wakeTime - Wake time in "HH:MM" format
 * @param sleepTime - Sleep time in "HH:MM" format
 * @param frequency - Reminder frequency in minutes (60 or 90)
 * @param dailyGoalML - Total daily hydration goal in milliliters
 * @returns Array of scheduled reminders with times and amounts
 */
export function computeReminderSchedule(
  wakeTime: string,
  sleepTime: string,
  frequency: number,
  dailyGoalML: number
): ScheduledReminder[] {
  const wakeMinutes = parseTimeToMinutes(wakeTime);
  const sleepMinutes = parseTimeToMinutes(sleepTime);

  // Calculate awake duration in minutes
  let awakeDuration = sleepMinutes - wakeMinutes;

  // Handle case where sleep time is after midnight
  if (awakeDuration < 0) {
    awakeDuration += 24 * 60; // Add 24 hours worth of minutes
  }

  // Calculate number of reminders that fit in the awake period
  const numberOfReminders = Math.floor(awakeDuration / frequency);

  // If no reminders fit, return empty array
  if (numberOfReminders <= 0) {
    return [];
  }

  // Calculate water amount per reminder (rounded to nearest 10ml)
  const mlPerReminder = Math.round((dailyGoalML / numberOfReminders) / 10) * 10;

  // Generate reminder schedule
  const schedule: ScheduledReminder[] = [];

  for (let i = 0; i < numberOfReminders; i++) {
    const reminderMinutes = wakeMinutes + (i * frequency);
    const time = formatMinutesToTime(reminderMinutes % (24 * 60)); // Handle wraparound

    schedule.push({
      time,
      amountML: mlPerReminder,
      index: i,
    });
  }

  return schedule;
}

/**
 * Redistribute remaining water goal when a reminder is skipped
 *
 * When the user skips a reminder, the remaining water for the day
 * needs to be redistributed across the remaining reminders.
 *
 * @param totalGoal - Total daily hydration goal in milliliters
 * @param consumed - Amount already consumed in milliliters
 * @param remindersLeft - Number of reminders remaining today
 * @returns New milliliters per reminder (rounded to nearest 10ml)
 */
export function redistributeOnSkip(
  totalGoal: number,
  consumed: number,
  remindersLeft: number
): number {
  // Calculate remaining water needed
  const remaining = totalGoal - consumed;

  // If no reminders left or already met/exceeded goal, return 0
  if (remindersLeft <= 0 || remaining <= 0) {
    return 0;
  }

  // Distribute remaining water across remaining reminders
  const mlPerReminder = remaining / remindersLeft;

  // Round to nearest 10ml for cleaner numbers
  return Math.round(mlPerReminder / 10) * 10;
}

/**
 * Calculate progress percentage
 *
 * @param consumed - Amount consumed in milliliters
 * @param goal - Daily goal in milliliters
 * @returns Progress as percentage (0-100), capped at 100
 */
export function calculateProgress(consumed: number, goal: number): number {
  if (goal <= 0) return 0;

  const progress = (consumed / goal) * 100;
  return Math.min(Math.round(progress), 100);
}

/**
 * Format milliliters to human-readable string
 *
 * @param ml - Milliliters
 * @returns Formatted string (e.g., "250 ml", "1.5 L")
 */
export function formatMilliliters(ml: number): string {
  if (ml >= 1000) {
    const liters = (ml / 1000).toFixed(1);
    return `${liters} L`;
  }
  return `${ml} ml`;
}

/**
 * Get current time in "HH:MM" format
 *
 * @returns Current time as string
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get today's date in "YYYY-MM-DD" format
 *
 * @returns Today's date as string
 */
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if it's time for a reminder
 *
 * @param reminderTime - Reminder time in "HH:MM" format
 * @param currentTime - Current time in "HH:MM" format (optional, defaults to now)
 * @param toleranceMinutes - Tolerance window in minutes (default: 5)
 * @returns True if current time is within tolerance of reminder time
 */
export function isReminderTime(
  reminderTime: string,
  currentTime?: string,
  toleranceMinutes: number = 5
): boolean {
  const now = currentTime || getCurrentTime();
  const nowMinutes = parseTimeToMinutes(now);
  const reminderMinutes = parseTimeToMinutes(reminderTime);

  const diff = Math.abs(nowMinutes - reminderMinutes);
  return diff <= toleranceMinutes;
}
