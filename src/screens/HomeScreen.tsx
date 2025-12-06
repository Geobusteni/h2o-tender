/**
 * HomeScreen - Main dashboard for H2O Tender
 * Displays daily hydration progress, quick-add buttons, and next reminder info
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { ProgressRing } from '../components/ProgressRing';
import { QuickAddModal } from '../components/QuickAddModal';
import { NextReminderCard } from '../components/NextReminderCard';
import {
  computeReminderSchedule,
  redistributeOnSkip,
  getCurrentTime,
  formatMilliliters,
} from '../utils/hydration';
import type { ScheduledReminder } from '../models/types';

interface HomeScreenProps {
  navigation?: any; // Navigation prop for navigating to Settings
}

/**
 * HomeScreen Component
 * Main dashboard showing hydration progress and controls
 */
export function HomeScreen({ navigation }: HomeScreenProps): JSX.Element {
  const {
    settings,
    dailyState,
    isLoading,
    recordConsumption,
    skipReminder,
  } = useApp();

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [nextReminder, setNextReminder] = useState<ScheduledReminder | null>(null);

  /**
   * Calculate and set the next reminder
   */
  useEffect(() => {
    if (!settings || !dailyState) return;

    // Compute full reminder schedule
    const schedule = computeReminderSchedule(
      settings.wakeTime,
      settings.sleepTime,
      settings.reminderFrequency,
      settings.dailyGoalML
    );

    // Find next reminder based on current time
    const currentTime = getCurrentTime();
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    // Find first reminder that hasn't passed yet
    const upcoming = schedule.find((reminder) => {
      const [reminderHour, reminderMinute] = reminder.time.split(':').map(Number);
      const reminderMinutes = reminderHour * 60 + reminderMinute;
      return reminderMinutes > currentMinutes;
    });

    setNextReminder(upcoming || null);
  }, [settings, dailyState]);

  /**
   * Handle quick-add button press
   */
  const handleQuickAdd = async (amountML: number) => {
    try {
      await recordConsumption(amountML);
    } catch (error) {
      Alert.alert('Error', 'Failed to record water consumption');
    }
  };

  /**
   * Handle custom amount addition
   */
  const handleCustomAdd = async (amountML: number) => {
    try {
      await recordConsumption(amountML);
    } catch (error) {
      Alert.alert('Error', 'Failed to record water consumption');
    }
  };

  /**
   * Handle skip reminder with redistribution
   */
  const handleSkipReminder = async () => {
    if (!settings || !dailyState) return;

    try {
      // Calculate total reminders for the day
      const schedule = computeReminderSchedule(
        settings.wakeTime,
        settings.sleepTime,
        settings.reminderFrequency,
        settings.dailyGoalML
      );

      const totalReminders = schedule.length;
      const remindersCompleted = dailyState.remindersCompleted;
      const remindersSkipped = dailyState.remindersSkipped;
      const remindersLeft = totalReminders - remindersCompleted - remindersSkipped - 1;

      // Calculate new amount per reminder
      const newAmountPerReminder = redistributeOnSkip(
        settings.dailyGoalML,
        dailyState.consumedML,
        remindersLeft
      );

      // Skip the reminder
      await skipReminder();

      // Show feedback
      if (remindersLeft > 0) {
        Alert.alert(
          'Reminder Skipped',
          `Future reminders updated to ~${newAmountPerReminder} ml each`
        );
      } else {
        Alert.alert(
          'Reminder Skipped',
          'This was your last reminder for today'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to skip reminder');
    }
  };

  /**
   * Show AI profile explanation
   */
  const handleShowExplanation = () => {
    if (!settings) return;

    Alert.alert(
      'Your Hydration Plan',
      settings.aiProfileSummary || 'No profile summary available.',
      [{ text: 'OK' }]
    );
  };

  /**
   * Open donation link
   */
  const handleDonation = () => {
    Alert.alert(
      'Support Development',
      'Thank you for considering supporting H2O Tender! This feature will open a donation page.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Link',
          onPress: () => {
            // Replace with actual donation URL
            Linking.openURL('https://example.com/donate');
          },
        },
      ]
    );
  };

  /**
   * Navigate to settings
   */
  const handleSettingsPress = () => {
    if (navigation) {
      navigation.navigate('Settings');
    }
  };

  // Loading state
  if (isLoading || !settings || !dailyState) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Calculate progress
  const progress = dailyState.consumedML / settings.dailyGoalML;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerItem}>
            <Text style={styles.headerLabel}>Today's Goal</Text>
            <Text style={styles.headerValue}>{formatMilliliters(settings.dailyGoalML)}</Text>
          </View>

          {/* Settings Icon */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Consumed</Text>
            <Text style={[styles.statValue, styles.consumedValue]}>
              {formatMilliliters(dailyState.consumedML)}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[styles.statValue, styles.remainingValue]}>
              {formatMilliliters(dailyState.remainingML)}
            </Text>
          </View>
        </View>
      </View>

      {/* Circular Progress Ring */}
      <View style={styles.progressContainer}>
        <ProgressRing
          progress={progress}
          size={220}
          strokeWidth={18}
          color="#4A90E2"
          backgroundColor="#E8F4FD"
        />
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickAddSection}>
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => handleQuickAdd(100)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickAddButtonText}>+100 ml</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => handleQuickAdd(200)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickAddButtonText}>+200 ml</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAddButton, styles.customButton]}
            onPress={() => setShowCustomModal(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickAddButtonText, styles.customButtonText]}>
              +Custom
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Next Reminder */}
      {nextReminder && (
        <View style={styles.reminderSection}>
          <NextReminderCard
            time={nextReminder.time}
            amountML={nextReminder.amountML}
            onSkip={handleSkipReminder}
          />
        </View>
      )}

      {/* AI Summary Section */}
      {settings.aiProfileSummary && (
        <View style={styles.aiSection}>
          <Text style={styles.aiSummary} numberOfLines={3}>
            {settings.aiProfileSummary}
          </Text>
          <TouchableOpacity
            style={styles.explainButton}
            onPress={handleShowExplanation}
            activeOpacity={0.7}
          >
            <Text style={styles.explainButtonText}>Explain my plan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Support Development */}
      <TouchableOpacity
        style={styles.donationButton}
        onPress={handleDonation}
        activeOpacity={0.7}
      >
        <Text style={styles.donationButtonText}>Support Development</Text>
      </TouchableOpacity>

      {/* Custom Amount Modal */}
      <QuickAddModal
        visible={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onAdd={handleCustomAdd}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerItem: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  headerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 28,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  consumedValue: {
    color: '#4A90E2',
  },
  remainingValue: {
    color: '#FF6B6B',
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  quickAddSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  quickAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  customButton: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
  },
  customButtonText: {
    color: 'white',
  },
  reminderSection: {
    marginBottom: 24,
  },
  aiSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  aiSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  explainButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#E8F4FD',
  },
  explainButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  donationButton: {
    backgroundColor: '#FFD93D',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  donationButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
