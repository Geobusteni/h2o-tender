/**
 * Time Picker Component
 * Cross-platform time selection wrapper
 * Returns time as "HH:MM" string format
 */

import React, { useState } from 'react';
import {
  Platform,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TimePickerProps {
  value: string; // Time in "HH:MM" format
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({
  value,
  onChange,
  label,
}: TimePickerProps): React.ReactElement {
  const [showPicker, setShowPicker] = useState(false);

  // Convert "HH:MM" string to Date object
  const timeToDate = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  // Convert Date object to "HH:MM" string
  const dateToTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleChange = (_event: any, selectedDate?: Date) => {
    // On Android, always hide picker after selection
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      const timeString = dateToTime(selectedDate);
      onChange(timeString);
    }
  };

  const handlePress = () => {
    setShowPicker(true);
  };

  const handleClose = () => {
    setShowPicker(false);
  };

  const currentDate = timeToDate(value);

  // iOS uses modal with done button
  if (Platform.OS === 'ios') {
    return (
      <>
        <TouchableOpacity
          style={styles.touchable}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Text style={styles.valueText}>{value}</Text>
        </TouchableOpacity>

        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleClose}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label || 'Select Time'}</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Text style={styles.doneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={currentDate}
                mode="time"
                display="spinner"
                onChange={handleChange}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Android uses inline picker
  return (
    <>
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.valueText}>{value}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={currentDate}
          mode="time"
          display="default"
          onChange={handleChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  touchable: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  picker: {
    width: '100%',
    height: 200,
  },
});
