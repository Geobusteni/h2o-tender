/**
 * Global app context using React Context API
 * Provides centralized state management for settings and daily state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
} from '../utils/hydration';

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
export function AppProvider({ children }: AppProviderProps): JSX.Element {
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
  const updateSettings = async (updates: Partial<UserSettings>): Promise<void> => {
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
  };

  /**
   * Record water consumption
   */
  const recordConsumption = async (amountML: number): Promise<void> => {
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
  };

  /**
   * Mark current reminder as skipped
   */
  const skipReminder = async (): Promise<void> => {
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
  };

  /**
   * Mark current reminder as completed
   */
  const completeReminder = async (): Promise<void> => {
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
  };

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
