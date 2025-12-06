/**
 * Settings Screen
 * Allows users to edit their hydration preferences and app settings
 * All changes recalculate dailyGoalML in real-time and persist immediately
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { SettingsRow } from '../components/SettingsRow';
import { TimePicker } from '../components/TimePicker';
import { SegmentedControl } from '../components/SegmentedControl';
import { calculateDailyGoal, computeReminderSchedule } from '../utils/hydration';
import { NotificationService } from '../services/notifications';
import { resetAll } from '../services/persistence';
import type { ActivityLevel, ClimateType, ReminderFrequency } from '../models/types';

interface SettingsScreenProps {
  navigation?: any;
}

export function SettingsScreen({ navigation }: SettingsScreenProps): JSX.Element {
  const { settings, updateSettings } = useApp();

  // Local state for immediate UI updates
  const [weight, setWeight] = useState(settings?.weight || 70);
  const [age, setAge] = useState(settings?.age);
  const [activity, setActivity] = useState<ActivityLevel>(settings?.activity || 'light');
  const [wakeTime, setWakeTime] = useState(settings?.wakeTime || '07:00');
  const [sleepTime, setSleepTime] = useState(settings?.sleepTime || '22:00');
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>(
    settings?.reminderFrequency || 90
  );
  const [climate, setClimate] = useState<ClimateType>(settings?.climate || 'mild');
  const [notificationSound, setNotificationSound] = useState(true);

  // Modal states
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showClimateModal, setShowClimateModal] = useState(false);

  // Temp input values for modals
  const [tempWeight, setTempWeight] = useState('');
  const [tempAge, setTempAge] = useState('');

  // Calculate current daily goal
  const currentGoal = calculateDailyGoal(weight, climate, activity);

  // Update local state when settings change
  useEffect(() => {
    if (settings) {
      setWeight(settings.weight);
      setAge(settings.age);
      setActivity(settings.activity);
      setWakeTime(settings.wakeTime);
      setSleepTime(settings.sleepTime);
      setReminderFrequency(settings.reminderFrequency);
      setClimate(settings.climate);
    }
  }, [settings]);

  // Handle weight change
  const handleWeightChange = async (newWeight: number) => {
    setWeight(newWeight);
    await updateSettings({ weight: newWeight });
  };

  // Handle age change
  const handleAgeChange = async (newAge: number | undefined) => {
    setAge(newAge);
    await updateSettings({ age: newAge });
  };

  // Handle activity change
  const handleActivityChange = async (newActivity: ActivityLevel) => {
    setActivity(newActivity);
    await updateSettings({ activity: newActivity });
  };

  // Handle wake time change
  const handleWakeTimeChange = async (newTime: string) => {
    setWakeTime(newTime);
    await updateSettings({ wakeTime: newTime });
    await rescheduleNotifications(newTime, sleepTime, reminderFrequency);
  };

  // Handle sleep time change
  const handleSleepTimeChange = async (newTime: string) => {
    setSleepTime(newTime);
    await updateSettings({ sleepTime: newTime });
    await rescheduleNotifications(wakeTime, newTime, reminderFrequency);
  };

  // Handle reminder frequency change
  const handleReminderFrequencyChange = async (index: number) => {
    const newFrequency = (index === 0 ? 60 : 90) as ReminderFrequency;
    setReminderFrequency(newFrequency);
    await updateSettings({ reminderFrequency: newFrequency });
    await rescheduleNotifications(wakeTime, sleepTime, newFrequency);
  };

  // Handle climate change
  const handleClimateChange = async (newClimate: ClimateType) => {
    setClimate(newClimate);
    await updateSettings({ climate: newClimate });
  };

  // Reschedule notifications
  const rescheduleNotifications = async (
    wake: string,
    sleep: string,
    frequency: ReminderFrequency
  ) => {
    try {
      const goal = calculateDailyGoal(weight, climate, activity);
      const schedule = computeReminderSchedule(wake, sleep, frequency, goal);

      // Convert to notification format
      const notificationSchedule = schedule.map(reminder => {
        const [hour, minute] = reminder.time.split(':').map(Number);
        return {
          hour,
          minute,
          mlAmount: reminder.amountML,
        };
      });

      await NotificationService.rescheduleReminders(
        notificationSchedule,
        wake,
        sleep
      );
    } catch (error) {
      console.error('Error rescheduling notifications:', error);
    }
  };

  // Show weight input modal
  const showWeightInput = () => {
    setTempWeight(weight.toString());
    setShowWeightModal(true);
  };

  // Save weight from modal
  const saveWeight = () => {
    const newWeight = parseFloat(tempWeight);
    if (!isNaN(newWeight) && newWeight > 0 && newWeight < 500) {
      handleWeightChange(newWeight);
      setShowWeightModal(false);
    } else {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 1 and 500 kg');
    }
  };

  // Show age input modal
  const showAgeInput = () => {
    setTempAge(age?.toString() || '');
    setShowAgeModal(true);
  };

  // Save age from modal
  const saveAge = () => {
    if (tempAge === '') {
      handleAgeChange(undefined);
      setShowAgeModal(false);
      return;
    }

    const newAge = parseInt(tempAge, 10);
    if (!isNaN(newAge) && newAge >= 1 && newAge <= 120) {
      handleAgeChange(newAge);
      setShowAgeModal(false);
    } else {
      Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 120 years');
    }
  };

  // Show activity picker
  const showActivityPicker = () => {
    setShowActivityModal(true);
  };

  // Show climate picker
  const showClimatePicker = () => {
    setShowClimateModal(true);
  };

  // Rerun AI onboarding
  const handleRerunOnboarding = () => {
    Alert.alert(
      'Rerun Onboarding',
      'This will take you back to the AI onboarding chat. Your current settings will be preserved until you complete onboarding.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await updateSettings({ onboardingComplete: false });
            navigation?.navigate('Onboarding');
          },
        },
      ]
    );
  };

  // Reset all data
  const handleResetAll = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your settings, history, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.cancelAllReminders();
              await resetAll();
              Alert.alert(
                'Data Reset',
                'All data has been cleared. The app will now restart.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate to onboarding or restart app
                      navigation?.navigate('Onboarding');
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Support development
  const handleSupportDevelopment = () => {
    const donationUrl = 'https://buymeacoffee.com/h2otender'; // Example URL
    Linking.openURL(donationUrl).catch(err =>
      console.error('Error opening donation link:', err)
    );
  };

  // Activity level labels
  const activityLabels: Record<ActivityLevel, string> = {
    none: 'None',
    light: 'Light',
    moderate: 'Moderate',
    heavy: 'Heavy',
  };

  // Climate labels
  const climateLabels: Record<ClimateType, string> = {
    cold: 'Cold',
    mild: 'Mild',
    hot: 'Hot',
    veryHot: 'Very Hot',
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Goal Display */}
        <View style={styles.goalSection}>
          <Text style={styles.goalLabel}>Daily Goal</Text>
          <Text style={styles.goalValue}>{currentGoal} ml</Text>
          <Text style={styles.goalSubtext}>
            {(currentGoal / 1000).toFixed(1)} liters
          </Text>
        </View>

        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <SettingsRow
            label="Weight"
            value={`${weight} kg`}
            type="number"
            onPress={showWeightInput}
            showChevron
          />

          <SettingsRow
            label="Age"
            value={age ? `${age} years` : 'Not set'}
            type="number"
            onPress={showAgeInput}
            showChevron
          />

          <SettingsRow
            label="Activity Level"
            value={activityLabels[activity]}
            type="picker"
            onPress={showActivityPicker}
            showChevron
          />

          <SettingsRow
            label="Climate"
            value={climateLabels[climate]}
            type="picker"
            onPress={showClimatePicker}
            showChevron
          />
        </View>

        {/* Schedule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Schedule</Text>

          <SettingsRow
            label="Wake Time"
            type="custom"
            customRightComponent={
              <TimePicker
                value={wakeTime}
                onChange={handleWakeTimeChange}
                label="Wake Time"
              />
            }
          />

          <SettingsRow
            label="Sleep Time"
            type="custom"
            customRightComponent={
              <TimePicker
                value={sleepTime}
                onChange={handleSleepTimeChange}
                label="Sleep Time"
              />
            }
          />

          <SettingsRow
            label="Reminder Frequency"
            type="custom"
            customRightComponent={
              <SegmentedControl
                options={['60 min', '90 min']}
                selectedIndex={reminderFrequency === 60 ? 0 : 1}
                onChange={handleReminderFrequencyChange}
              />
            }
          />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <SettingsRow
            label="Notification Sound"
            type="toggle"
            toggleValue={notificationSound}
            onToggleChange={setNotificationSound}
          />
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRerunOnboarding}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Rerun AI Onboarding</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleResetAll}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              Reset All Data
            </Text>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleSupportDevelopment}
            activeOpacity={0.7}
          >
            <Text style={styles.supportButtonText}>Support Development</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Weight Input Modal */}
      <Modal
        visible={showWeightModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Weight</Text>
            <TextInput
              style={styles.modalInput}
              value={tempWeight}
              onChangeText={setTempWeight}
              keyboardType="decimal-pad"
              placeholder="Weight in kg"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowWeightModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveWeight}
              >
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Age Input Modal */}
      <Modal
        visible={showAgeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAgeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Age</Text>
            <TextInput
              style={styles.modalInput}
              value={tempAge}
              onChangeText={setTempAge}
              keyboardType="number-pad"
              placeholder="Age in years (optional)"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAgeModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveAge}
              >
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Activity Picker Modal */}
      <Modal
        visible={showActivityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Activity Level</Text>
            {(['none', 'light', 'moderate', 'heavy'] as ActivityLevel[]).map(
              (level) => (
                <TouchableOpacity
                  key={level}
                  style={styles.pickerOption}
                  onPress={() => {
                    handleActivityChange(level);
                    setShowActivityModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      activity === level && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {activityLabels[level]}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </Modal>

      {/* Climate Picker Modal */}
      <Modal
        visible={showClimateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClimateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Climate</Text>
            {(['cold', 'mild', 'hot', 'veryHot'] as ClimateType[]).map(
              (climateType) => (
                <TouchableOpacity
                  key={climateType}
                  style={styles.pickerOption}
                  onPress={() => {
                    handleClimateChange(climateType);
                    setShowClimateModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      climate === climateType && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {climateLabels[climateType]}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  goalSection: {
    backgroundColor: '#4A90E2',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  goalValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  goalSubtext: {
    fontSize: 18,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F5F5F5',
    textTransform: 'uppercase',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A90E2',
    textAlign: 'center',
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerButtonText: {
    color: '#E74C3C',
  },
  supportButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  modalButtonCancel: {
    backgroundColor: '#F0F0F0',
  },
  modalButtonSave: {
    backgroundColor: '#4A90E2',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  pickerOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  pickerOptionTextSelected: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});
