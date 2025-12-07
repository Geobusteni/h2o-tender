/**
 * Global app context using React Context API
 * Provides centralized state management for settings and daily state
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type {
  UserSettings,
  DailyState,
  AppContextType,
} from '../models/types';
import { DEFAULT_DAILY_STATE } from '../models/types';
import {
  loadSettings,
  saveSettings,
  loadDailyState,
  saveDailyState,
} from '../services/persistence';
import {
  getTodayDate,
  calculateDailyGoal,
  computeReminderSchedule,
  redistributeOnSkip,
  getCurrentTime,
} from '../utils/hydration';
import { NotificationService } from '../services/notifications';

// Create context with undefined default (will be provided by provider)
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Props for AppProvider component
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * App Context Provider
 * Wraps the app and provides global state and actions
 */
export function AppProvider({ children }: AppProviderProps): React.ReactElement {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [dailyState, setDailyState] = useState<DailyState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load initial data when app starts
   */
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        // Load settings
        const loadedSettings = await loadSettings();
        setSettings(loadedSettings);

        // Load today's state
        const today = getTodayDate();
        const loadedState = await loadDailyState(today);

        // If loaded state is from a previous day, reset it
        if (loadedState.date !== today) {
          const newState: DailyState = {
            ...DEFAULT_DAILY_STATE,
            date: today,
            remainingML: loadedSettings.dailyGoalML,
          };
          await saveDailyState(newState);
          setDailyState(newState);
        } else {
          setDailyState(loadedState);
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load app data');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  /**
   * Check if we need to reset daily state (new day)
   */
  useEffect(() => {
    const interval = setInterval(async () => {
      const today = getTodayDate();

      if (dailyState && dailyState.date !== today) {
        // New day detected, reset daily state
        const newState: DailyState = {
          ...DEFAULT_DAILY_STATE,
          date: today,
          remainingML: settings?.dailyGoalML || 0,
        };

        await saveDailyState(newState);
        setDailyState(newState);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [dailyState, settings]);

  /**
   * Update user settings
   */
  const updateSettings = useCallback(async (updates: Partial<UserSettings>): Promise<void> => {
    try {
      if (!settings) {
        throw new Error('Settings not loaded');
      }

      const newSettings = { ...settings, ...updates };

      // Recalculate daily goal if relevant fields changed
      if (
        updates.weight !== undefined ||
        updates.climate !== undefined ||
        updates.activity !== undefined
      ) {
        newSettings.dailyGoalML = calculateDailyGoal(
          newSettings.weight,
          newSettings.climate,
          newSettings.activity
        );
      }

      await saveSettings(newSettings);
      setSettings(newSettings);

      // Update daily state remaining if goal changed
      if (dailyState && updates.dailyGoalML) {
        const updatedDailyState = {
          ...dailyState,
          remainingML: updates.dailyGoalML - dailyState.consumedML,
        };
        await saveDailyState(updatedDailyState);
        setDailyState(updatedDailyState);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      throw new Error('Failed to update settings');
    }
  }, [settings, dailyState]);

  /**
   * Record water consumption
   */
  const recordConsumption = useCallback(async (amountML: number): Promise<void> => {
    try {
      if (!dailyState || !settings) {
        throw new Error('State not loaded');
      }

      const newConsumed = dailyState.consumedML + amountML;
      const newRemaining = Math.max(0, settings.dailyGoalML - newConsumed);

      const updatedState: DailyState = {
        ...dailyState,
        consumedML: newConsumed,
        remainingML: newRemaining,
      };

      await saveDailyState(updatedState);
      setDailyState(updatedState);
    } catch (err) {
      console.error('Error recording consumption:', err);
      throw new Error('Failed to record consumption');
    }
  }, [dailyState, settings]);

  /**
   * Mark current reminder as skipped
   */
  const skipReminder = useCallback(async (): Promise<void> => {
    try {
      if (!dailyState) {
        throw new Error('State not loaded');
      }

      const updatedState: DailyState = {
        ...dailyState,
        remindersSkipped: dailyState.remindersSkipped + 1,
      };

      await saveDailyState(updatedState);
      setDailyState(updatedState);
    } catch (err) {
      console.error('Error skipping reminder:', err);
      throw new Error('Failed to skip reminder');
    }
  }, [dailyState]);

  /**
   * Mark current reminder as completed
   */
  const completeReminder = useCallback(async (): Promise<void> => {
    try {
      if (!dailyState) {
        throw new Error('State not loaded');
      }

      const updatedState: DailyState = {
        ...dailyState,
        remindersCompleted: dailyState.remindersCompleted + 1,
      };

      await saveDailyState(updatedState);
      setDailyState(updatedState);
    } catch (err) {
      console.error('Error completing reminder:', err);
      throw new Error('Failed to complete reminder');
    }
  }, [dailyState]);

  /**
   * Handle skip action from notification
   * Redistributes water to remaining reminders and reschedules notifications
   */
  const handleSkipFromNotification = useCallback(async (): Promise<void> => {
    if (!settings || !dailyState) {
      throw new Error('Settings or state not loaded');
    }

    // Calculate current reminder schedule
    const schedule = computeReminderSchedule(
      settings.wakeTime,
      settings.sleepTime,
      settings.reminderFrequency,
      settings.dailyGoalML
    );

    // Get current time to find which reminders are remaining
    const currentTime = getCurrentTime();
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    // Find remaining reminders (those that haven't passed yet)
    const remainingReminders = schedule.filter((reminder) => {
      const [reminderHour, reminderMinute] = reminder.time.split(':').map(Number);
      const reminderMinutes = reminderHour * 60 + reminderMinute;
      return reminderMinutes > currentMinutes;
    });

    // Calculate reminders left (excluding the one being skipped)
    const remindersLeft = remainingReminders.length - 1;

    // Skip the reminder (update state)
    await skipReminder();

    // If there are reminders left, redistribute and reschedule
    if (remindersLeft > 0) {
      // Calculate new amount per reminder after redistribution
      const newAmountPerReminder = redistributeOnSkip(
        settings.dailyGoalML,
        dailyState.consumedML,
        remindersLeft
      );

      // Reschedule remaining reminders with new amounts
      const newSchedule = remainingReminders.slice(1).map((reminder) => ({
        hour: parseInt(reminder.time.split(':')[0], 10),
        minute: parseInt(reminder.time.split(':')[1], 10),
        mlAmount: newAmountPerReminder,
      }));

      // Reschedule notifications with updated amounts
      await NotificationService.rescheduleReminders(
        newSchedule,
        settings.wakeTime,
        settings.sleepTime
      );

      console.log(`Skipped reminder. Redistributed to ${remindersLeft} remaining reminders at ${newAmountPerReminder}ml each`);
    } else {
      // No reminders left, just cancel all
      await NotificationService.cancelAllReminders();
      console.log('Skipped reminder. No remaining reminders for today.');
    }
  }, [settings, dailyState]);

  /**
   * Set up notification response listener
   * Handles "Drink Now" and "Skip" actions from notifications
   */
  useEffect(() => {
    if (!settings || !dailyState) {
      return; // Wait for settings and state to load
    }

    // Set up notification listener
    const subscription = NotificationService.setupNotificationListener(
      // Handle "Drink Now" action
      async (mlAmount: number) => {
        try {
          console.log(`Notification: Drink Now - ${mlAmount}ml`);
          await recordConsumption(mlAmount);
          await completeReminder();
        } catch (error) {
          console.error('Error handling Drink Now action:', error);
        }
      },
      // Handle "Skip" action
      async () => {
        try {
          console.log('Notification: Skip reminder');
          await handleSkipFromNotification();
        } catch (error) {
          console.error('Error handling Skip action:', error);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  }, [settings, dailyState, handleSkipFromNotification, recordConsumption, completeReminder]);

  /**
   * Reset daily state (for debugging or manual reset)
   */
  const resetDay = async (): Promise<void> => {
    try {
      if (!settings) {
        throw new Error('Settings not loaded');
      }

      const today = getTodayDate();
      const newState: DailyState = {
        ...DEFAULT_DAILY_STATE,
        date: today,
        remainingML: settings.dailyGoalML,
      };

      await saveDailyState(newState);
      setDailyState(newState);
    } catch (err) {
      console.error('Error resetting day:', err);
      throw new Error('Failed to reset day');
    }
  };

  /**
   * Refresh all data from storage
   */
  const refreshData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);

      const today = getTodayDate();
      const loadedState = await loadDailyState(today);
      setDailyState(loadedState);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value: AppContextType = {
    settings,
    dailyState,
    isLoading,
    error,
    updateSettings,
    recordConsumption,
    skipReminder,
    completeReminder,
    resetDay,
    refreshData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to use app context
 * Throws error if used outside of AppProvider
 *
 * @returns App context value
 */
export function useApp(): AppContextType {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
}
