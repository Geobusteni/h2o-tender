/**
 * Persistence service using AsyncStorage
 * Handles saving and loading app data to device storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserSettings, DailyState } from '../models/types';
import { DEFAULT_DAILY_STATE } from '../models/types';
import { getTodayDate } from '../utils/hydration';

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: '@h2o_tender:settings',
  DAILY_STATE_PREFIX: '@h2o_tender:daily_state:',
  CHAT_HISTORY: '@h2o_tender:chat_history',
} as const;

/**
 * Load user settings from storage
 *
 * @returns User settings or null if none exist (user needs to complete onboarding)
 */
export async function loadSettings(): Promise<UserSettings | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (json === null) {
      // No settings saved yet, return null to trigger onboarding
      return null;
    }

    const settings = JSON.parse(json) as UserSettings;
    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    // Return null on error to be safe (user will need to go through onboarding)
    return null;
  }
}

/**
 * Save user settings to storage
 *
 * @param settings - Settings to save
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    const json = JSON.stringify(settings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, json);
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Load daily state for a specific date
 *
 * @param date - Date in "YYYY-MM-DD" format (defaults to today)
 * @returns Daily state for the specified date
 */
export async function loadDailyState(date?: string): Promise<DailyState> {
  const targetDate = date || getTodayDate();

  try {
    const key = `${STORAGE_KEYS.DAILY_STATE_PREFIX}${targetDate}`;
    const json = await AsyncStorage.getItem(key);

    if (json === null) {
      // No state for this date, return default
      return {
        ...DEFAULT_DAILY_STATE,
        date: targetDate,
      };
    }

    const state = JSON.parse(json) as DailyState;

    // Ensure backward compatibility: add waterAdditionTimestamps if missing
    if (!state.waterAdditionTimestamps) {
      state.waterAdditionTimestamps = [];
    }

    return state;
  } catch (error) {
    console.error(`Error loading daily state for ${targetDate}:`, error);
    // Return default on error
    return {
      ...DEFAULT_DAILY_STATE,
      date: targetDate,
    };
  }
}

/**
 * Save daily state for a specific date
 *
 * @param state - Daily state to save
 */
export async function saveDailyState(state: DailyState): Promise<void> {
  try {
    const key = `${STORAGE_KEYS.DAILY_STATE_PREFIX}${state.date}`;
    const json = JSON.stringify(state);
    await AsyncStorage.setItem(key, json);
  } catch (error) {
    console.error(`Error saving daily state for ${state.date}:`, error);
    throw new Error('Failed to save daily state');
  }
}

/**
 * Load chat history from storage
 *
 * @returns Array of chat messages
 */
export async function loadChatHistory(): Promise<any[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);

    if (json === null) {
      return [];
    }

    return JSON.parse(json);
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
}

/**
 * Save chat history to storage
 *
 * @param messages - Array of chat messages to save
 */
export async function saveChatHistory(messages: any[]): Promise<void> {
  try {
    const json = JSON.stringify(messages);
    await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, json);
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw new Error('Failed to save chat history');
  }
}

/**
 * Get all daily state keys from storage
 * Useful for getting historical data
 *
 * @returns Array of dates that have saved states
 */
export async function getAllDailyStateDates(): Promise<string[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const dailyStateKeys = allKeys.filter(key =>
      key.startsWith(STORAGE_KEYS.DAILY_STATE_PREFIX)
    );

    // Extract dates from keys
    const dates = dailyStateKeys.map(key =>
      key.replace(STORAGE_KEYS.DAILY_STATE_PREFIX, '')
    );

    // Sort by date (newest first)
    dates.sort().reverse();

    return dates;
  } catch (error) {
    console.error('Error getting daily state dates:', error);
    return [];
  }
}

/**
 * Delete daily state for a specific date
 *
 * @param date - Date in "YYYY-MM-DD" format
 */
export async function deleteDailyState(date: string): Promise<void> {
  try {
    const key = `${STORAGE_KEYS.DAILY_STATE_PREFIX}${date}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error deleting daily state for ${date}:`, error);
    throw new Error('Failed to delete daily state');
  }
}

/**
 * Delete old daily states to save storage space
 * Keeps only the last N days of history
 *
 * @param daysToKeep - Number of days of history to keep (default: 30)
 */
export async function cleanupOldDailyStates(daysToKeep: number = 30): Promise<void> {
  try {
    const dates = await getAllDailyStateDates();

    // Delete dates beyond the keep limit
    if (dates.length > daysToKeep) {
      const datesToDelete = dates.slice(daysToKeep);

      for (const date of datesToDelete) {
        await deleteDailyState(date);
      }

      console.log(`Cleaned up ${datesToDelete.length} old daily states`);
    }
  } catch (error) {
    console.error('Error cleaning up old daily states:', error);
  }
}

/**
 * Reset all app data
 * WARNING: This deletes all settings and history
 */
export async function resetAll(): Promise<void> {
  try {
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();

    // Filter for app-specific keys
    const appKeys = allKeys.filter(key =>
      key.startsWith('@h2o_tender:')
    );

    // Remove all app keys
    await AsyncStorage.multiRemove(appKeys);

    console.log('All app data has been reset');
  } catch (error) {
    console.error('Error resetting all data:', error);
    throw new Error('Failed to reset app data');
  }
}

/**
 * Get storage usage statistics
 * Useful for debugging and monitoring
 *
 * @returns Object with storage statistics
 */
export async function getStorageStats(): Promise<{
  totalKeys: number;
  settingsExists: boolean;
  dailyStatesCount: number;
  chatHistoryExists: boolean;
}> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter(key => key.startsWith('@h2o_tender:'));

    const settingsExists = appKeys.includes(STORAGE_KEYS.SETTINGS);
    const chatHistoryExists = appKeys.includes(STORAGE_KEYS.CHAT_HISTORY);

    const dailyStatesCount = appKeys.filter(key =>
      key.startsWith(STORAGE_KEYS.DAILY_STATE_PREFIX)
    ).length;

    return {
      totalKeys: appKeys.length,
      settingsExists,
      dailyStatesCount,
      chatHistoryExists,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalKeys: 0,
      settingsExists: false,
      dailyStatesCount: 0,
      chatHistoryExists: false,
    };
  }
}
