/**
 * Card component displaying the next scheduled reminder
 * Shows time and suggested water amount with skip option
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface NextReminderCardProps {
  time: string; // Time in "HH:MM" format
  amountML: number; // Suggested water amount in ml
  onSkip: () => void; // Callback when skip button pressed
}

/**
 * NextReminderCard Component
 * Displays upcoming reminder information with skip functionality
 */
export function NextReminderCard({
  time,
  amountML,
  onSkip,
}: NextReminderCardProps): React.ReactElement {
  /**
   * Handle skip button press with confirmation
   */
  const handleSkip = () => {
    Alert.alert(
      'Skip Reminder',
      `Are you sure you want to skip the ${time} reminder? The ${amountML} ml will be redistributed to your remaining reminders.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: onSkip,
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.label}>Next Reminder</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.infoContainer}>
          <Text style={styles.timeText}>{time}</Text>
          <Text style={styles.amountText}>Drink ~{amountML} ml</Text>
        </View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },
  skipButton: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
    minWidth: 80,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#F57C00',
    fontSize: 14,
    fontWeight: '600',
  },
});
