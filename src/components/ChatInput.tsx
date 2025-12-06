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

interface ChatInputProps {
  variant: InputVariant;
  placeholder?: string;
  onSubmit: (value: string | number | ActivityLevel | ReminderFrequency) => void;
  onLocationRequest?: () => void;
}

export function ChatInput({
  variant,
  placeholder,
  onSubmit,
  onLocationRequest,
}: ChatInputProps): JSX.Element {
  const [textValue, setTextValue] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

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

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (date) {
      setSelectedTime(date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      onSubmit(timeString);
    }
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
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.timePickerButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.timePickerButtonText}>Select Time</Text>
        </TouchableOpacity>
        {(showTimePicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
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
  timePickerButton: {
    flex: 1,
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  timePickerButtonText: {
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
