/**
 * ChatInput - Input area component with multiple variants
 * Supports text input, button options, time picker, and location button
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ActivityLevel, ReminderFrequency } from '../models/types';

type InputVariant =
  | 'text'
  | 'number'
  | 'activity'
  | 'frequency'
  | 'time'
  | 'location';

type TimeType = 'wake' | 'sleep';

interface ChatInputProps {
  variant: InputVariant;
  placeholder?: string;
  onSubmit: (value: string | number | ActivityLevel | ReminderFrequency) => void;
  onLocationRequest?: () => void;
  timeType?: TimeType; // For time variant: 'wake' or 'sleep'
}

export function ChatInput({
  variant,
  placeholder,
  onSubmit,
  onLocationRequest,
  timeType,
}: ChatInputProps): JSX.Element {
  const [textValue, setTextValue] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Set sensible default times based on timeType
  const getDefaultTime = (): Date => {
    const now = new Date();
    if (timeType === 'wake') {
      // Default wake time: 6:30 AM
      now.setHours(6, 30, 0, 0);
    } else if (timeType === 'sleep') {
      // Default sleep time: 10:30 PM
      now.setHours(22, 30, 0, 0);
    }
    return now;
  };

  const [selectedTime, setSelectedTime] = useState(getDefaultTime());

  const handleTextSubmit = () => {
    if (textValue.trim()) {
      onSubmit(textValue.trim());
      setTextValue('');
    }
  };

  const handleNumberSubmit = () => {
    const num = parseFloat(textValue);
    if (!isNaN(num) && num > 0) {
      onSubmit(num);
      setTextValue('');
    }
  };

  const handleTimeChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (date) {
      // Only update the selected time, don't submit yet
      setSelectedTime(date);
    }
  };

  const handleTimeSubmit = () => {
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    onSubmit(timeString);
    setShowTimePicker(false);
  };

  // Render text input variant
  if (variant === 'text') {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder || 'Type your answer...'}
          placeholderTextColor="#9E9E9E"
          value={textValue}
          onChangeText={setTextValue}
          onSubmitEditing={handleTextSubmit}
          returnKeyType="send"
          autoCapitalize="words"
        />
        <TouchableOpacity
          style={[styles.sendButton, !textValue.trim() && styles.sendButtonDisabled]}
          onPress={handleTextSubmit}
          disabled={!textValue.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render number input variant
  if (variant === 'number') {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder || 'Enter number...'}
          placeholderTextColor="#9E9E9E"
          value={textValue}
          onChangeText={setTextValue}
          onSubmitEditing={handleNumberSubmit}
          keyboardType="numeric"
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, !textValue.trim() && styles.sendButtonDisabled]}
          onPress={handleNumberSubmit}
          disabled={!textValue.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render activity level buttons
  if (variant === 'activity') {
    return (
      <View style={styles.buttonGrid}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => onSubmit('none' as ActivityLevel)}
        >
          <Text style={styles.optionButtonText}>None</Text>
          <Text style={styles.optionButtonSubtext}>Sedentary lifestyle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => onSubmit('light' as ActivityLevel)}
        >
          <Text style={styles.optionButtonText}>Light</Text>
          <Text style={styles.optionButtonSubtext}>Light exercise 1-3 days/week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => onSubmit('moderate' as ActivityLevel)}
        >
          <Text style={styles.optionButtonText}>Moderate</Text>
          <Text style={styles.optionButtonSubtext}>Moderate exercise 3-5 days/week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => onSubmit('heavy' as ActivityLevel)}
        >
          <Text style={styles.optionButtonText}>Heavy</Text>
          <Text style={styles.optionButtonSubtext}>Intense exercise 6-7 days/week</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render frequency buttons
  if (variant === 'frequency') {
    return (
      <View style={styles.buttonGrid}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => onSubmit(60 as ReminderFrequency)}
        >
          <Text style={styles.optionButtonText}>Every 60 minutes</Text>
          <Text style={styles.optionButtonSubtext}>More frequent reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => onSubmit(90 as ReminderFrequency)}
        >
          <Text style={styles.optionButtonText}>Every 90 minutes</Text>
          <Text style={styles.optionButtonSubtext}>Less frequent reminders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render time picker
  if (variant === 'time') {
    const isPickerVisible = showTimePicker || Platform.OS === 'ios';
    
    return (
      <View style={styles.timePickerContainer}>
        {!isPickerVisible && (
          <TouchableOpacity
            style={styles.timePickerOpenButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.timePickerOpenButtonText}>Select Time</Text>
          </TouchableOpacity>
        )}
        {isPickerVisible && (
          <View style={styles.timePickerWrapper}>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
            <TouchableOpacity
              style={styles.timePickerSubmitButton}
              onPress={handleTimeSubmit}
            >
              <Text style={styles.timePickerSubmitButtonText}>Confirm Time</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Render location button with text input option
  if (variant === 'location') {
    return (
      <View style={styles.locationContainer}>
        <View style={styles.container}>
          <TextInput
            style={styles.textInput}
            placeholder={placeholder || 'Enter your city...'}
            placeholderTextColor="#9E9E9E"
            value={textValue}
            onChangeText={setTextValue}
            onSubmitEditing={handleTextSubmit}
            returnKeyType="send"
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[styles.sendButton, !textValue.trim() && styles.sendButtonDisabled]}
            onPress={handleTextSubmit}
            disabled={!textValue.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
        {onLocationRequest && (
          <>
            <Text style={styles.orText}>or</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={onLocationRequest}
            >
              <Text style={styles.locationButtonText}>Use My Location</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  return <View />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sendButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 70,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGrid: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 60,
  },
  optionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  optionButtonSubtext: {
    fontSize: 14,
    color: '#757575',
  },
  timePickerContainer: {
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 12,
  },
  timePickerOpenButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  timePickerOpenButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  timePickerWrapper: {
    paddingHorizontal: 12,
  },
  timePickerSubmitButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  timePickerSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  locationContainer: {
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  orText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 14,
    marginVertical: 8,
  },
  locationButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
