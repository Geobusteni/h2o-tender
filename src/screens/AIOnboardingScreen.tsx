/**
 * AIOnboardingScreen - Full chat onboarding flow
 * Guides users through setup with a conversational AI assistant
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { TypingIndicator } from '../components/TypingIndicator';
import { useApp } from '../context/AppContext';
import { AIService } from '../services/ai';
import { NotificationService } from '../services/notifications';
import { getCurrentLocation } from '../utils/location';
import { calculateDailyGoal, computeReminderSchedule, formatMilliliters } from '../utils/hydration';
import type {
  ChatMessage,
  ActivityLevel,
  ReminderFrequency,
  ClimateType,
} from '../models/types';

type RootStackParamList = {
  AIOnboarding: undefined;
  Home: undefined;
};

type AIOnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AIOnboarding'>;
};

// Onboarding steps
enum OnboardingStep {
  WELCOME = 0,
  ASK_LOCATION = 1,
  LOCATION_RESPONSE = 2,
  ASK_WEIGHT = 3,
  ASK_AGE = 4,
  ASK_ACTIVITY = 5,
  ASK_WAKE_TIME = 6,
  ASK_SLEEP_TIME = 7,
  ASK_FREQUENCY = 8,
  SUMMARY = 9,
  COMPLETE = 10,
}

type WeightUnit = 'kg' | 'lbs';

interface OnboardingData {
  locationName?: string;
  climate?: ClimateType;
  weight?: number;
  weightUnit?: WeightUnit;
  age?: number;
  activity?: ActivityLevel;
  wakeTime?: string;
  sleepTime?: string;
  reminderFrequency?: ReminderFrequency;
}

export function AIOnboardingScreen({ navigation }: AIOnboardingScreenProps): React.ReactElement {
  const { settings, updateSettings } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.WELCOME);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deviceLocationFailed, setDeviceLocationFailed] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const flatListRef = useRef<FlatList>(null);

  // Check if user is retaking onboarding (has existing settings)
  const isRetake = settings?.onboardingComplete === false && settings?.weight !== undefined;

  // Handle cancel during retake
  const handleCancelRetake = async () => {
    Alert.alert(
      'Cancel Onboarding',
      'Are you sure you want to cancel? Your previous settings will be restored.',
      [
        { text: 'Continue Onboarding', style: 'cancel' },
        {
          text: 'Cancel & Go Back',
          style: 'destructive',
          onPress: async () => {
            // Restore onboardingComplete flag to return to home
            await updateSettings({ onboardingComplete: true });
            navigation.replace('Home');
          },
        },
      ]
    );
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Use requestAnimationFrame for more reliable scrolling
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
    }
  }, [messages]);

  // Also scroll when typing indicator changes
  useEffect(() => {
    if (isTyping) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
      });
    }
  }, [isTyping]);

  // Start onboarding with welcome message
  useEffect(() => {
    addAIMessage(
      "Hi! I'm your Hydration Assistant. I'm here to personalize your hydration reminders. I'll ask a few quick questions and customize everything for you. Ready to begin?"
    );
    setTimeout(() => {
      setCurrentStep(OnboardingStep.ASK_LOCATION);
      addAIMessage("Where do you live?");
    }, 1500);
  }, []);

  // Add AI message to chat
  const addAIMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
  };

  // Add user message to chat
  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
  };

  // Simulate AI typing delay
  const simulateTyping = async (duration: number = 1000) => {
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, duration));
    setIsTyping(false);
  };

  // Handle location text input (manual entry)
  const handleLocationText = async (value: string | number) => {
    const locationText = String(value);
    addUserMessage(locationText);
    setIsProcessing(true);

    try {
      await simulateTyping(1500);
      addAIMessage("Getting climate information for your location...");

      // ALWAYS try AI service for manual entry (no network check)
      const climateData = await AIService.getClimateForCityName(locationText);

      if (climateData) {
        setOnboardingData((prev) => ({
          ...prev,
          locationName: climateData.city,
          climate: climateData.climate,
        }));

        addAIMessage(
          `Perfect! You're in ${climateData.city}. ${climateData.explanation}`
        );

        setTimeout(() => {
          setCurrentStep(OnboardingStep.ASK_WEIGHT);
          // Message will be updated based on unit selection
          addAIMessage("What is your weight?");
        }, 1500);
      } else {
        // Fallback to default if AI fails
        setOnboardingData((prev) => ({
          ...prev,
          locationName: locationText,
          climate: 'mild',
        }));

        addAIMessage(
          `Great! I've set your location to ${locationText}. I'll use a moderate climate setting for your hydration calculations.`
        );

        setTimeout(() => {
          setCurrentStep(OnboardingStep.ASK_WEIGHT);
          // Message will be updated based on unit selection
          addAIMessage("What is your weight?");
        }, 1500);
      }
    } catch (error) {
      console.error('Error processing location:', error);
      Alert.alert('Error', 'Failed to process location. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle location button press (device location)
  const handleLocationRequest = async () => {
    addUserMessage("Using my current location");
    setIsProcessing(true);

    try {
      await simulateTyping(1000);
      addAIMessage("Getting your location...");

      // Get device location
      const coords = await getCurrentLocation();

      await simulateTyping(1500);

      // Get climate data with network check (only for device location)
      // This will check network FIRST and return null if network is unavailable
      const climateData = await AIService.getClimateForLocationWithNetworkCheck(
        coords.latitude,
        coords.longitude
      );

      if (climateData) {
        setOnboardingData((prev) => ({
          ...prev,
          locationName: climateData.city,
          climate: climateData.climate,
        }));

        addAIMessage(
          `Perfect! You're in ${climateData.city}. ${climateData.explanation}`
        );

        setTimeout(() => {
          setCurrentStep(OnboardingStep.ASK_WEIGHT);
          // Message will be updated based on unit selection
          addAIMessage("What is your weight?");
        }, 1500);
      } else {
        // Network check failed - require manual entry
        throw new Error('NETWORK_UNAVAILABLE');
      }
    } catch (error) {
      console.error('Location error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Mark device location as failed - hide the button
      setDeviceLocationFailed(true);
      
      // Network unavailable or location fetch failed - require manual entry
      if (errorMessage.includes('Network') || errorMessage.includes('NETWORK_UNAVAILABLE')) {
        addAIMessage(
          "I can't connect to the network to fetch your location. Please enter your city name manually."
        );
      } else {
        // Other errors (permission denied, etc.)
        addAIMessage(
          "I couldn't get your location from your device. Please enter your city name manually."
        );
      }
      
      // Switch to text input mode for location - REQUIRED
      // Location button will be hidden now
      setTimeout(() => {
        setCurrentStep(OnboardingStep.ASK_LOCATION);
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle weight unit selection
  const handleWeightUnitSelect = (unit: WeightUnit) => {
    setWeightUnit(unit);
    // Update the AI message to reflect unit system
    if (messages.length > 0 && currentStep === OnboardingStep.ASK_WEIGHT) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content.includes('weight')) {
        // Update the last message to show the unit system
        const updatedMessages = [...messages];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          content: unit === 'lbs' 
            ? "What is your weight? (Imperial system will be used throughout)"
            : "What is your weight? (Metric system will be used throughout)",
        };
        setMessages(updatedMessages);
      }
    }
  };

  // Handle weight input
  const handleWeight = async (value: string | number) => {
    let weight = typeof value === 'number' ? value : parseFloat(value);
    
    // Convert to kg if user entered lbs (store everything in kg internally)
    if (weightUnit === 'lbs') {
      weight = weight * 0.453592; // Convert lbs to kg
    }
    
    const displayWeight = weightUnit === 'lbs' 
      ? (typeof value === 'number' ? value : parseFloat(value))
      : weight;
    
    addUserMessage(`${displayWeight} ${weightUnit}`);
    setOnboardingData((prev) => ({ ...prev, weight, weightUnit }));

    await simulateTyping(800);
    setCurrentStep(OnboardingStep.ASK_AGE);
    // Age is unit-agnostic, but we can mention the system
    const ageMessage = weightUnit === 'lbs'
      ? "What is your age? (Continuing with imperial system)"
      : "What is your age? (Continuing with metric system)";
    addAIMessage(ageMessage);
  };

  // Handle age input
  const handleAge = async (value: string | number) => {
    const age = typeof value === 'number' ? value : parseInt(value, 10);
    addUserMessage(`${age} years old`);
    setOnboardingData((prev) => ({ ...prev, age }));

    await simulateTyping(800);
    setCurrentStep(OnboardingStep.ASK_ACTIVITY);
    addAIMessage("How active are you on a typical day?");
  };

  // Handle activity level selection
  const handleActivity = async (activity: ActivityLevel) => {
    const activityLabels: Record<ActivityLevel, string> = {
      none: 'None - Sedentary lifestyle',
      light: 'Light - Light exercise 1-3 days/week',
      moderate: 'Moderate - Moderate exercise 3-5 days/week',
      heavy: 'Heavy - Intense exercise 6-7 days/week',
    };

    addUserMessage(activityLabels[activity]);
    setOnboardingData((prev) => ({ ...prev, activity }));

    await simulateTyping(800);
    setCurrentStep(OnboardingStep.ASK_WAKE_TIME);
    addAIMessage("When do you usually wake up?");
  };

  // Handle wake time selection
  const handleWakeTime = async (wakeTime: string) => {
    addUserMessage(`I wake up at ${wakeTime}`);
    setOnboardingData((prev) => ({ ...prev, wakeTime }));

    await simulateTyping(800);
    setCurrentStep(OnboardingStep.ASK_SLEEP_TIME);
    addAIMessage("When do you usually go to bed?");
  };

  // Handle sleep time selection
  const handleSleepTime = async (sleepTime: string) => {
    addUserMessage(`I go to bed at ${sleepTime}`);
    setOnboardingData((prev) => ({ ...prev, sleepTime }));

    await simulateTyping(800);
    setCurrentStep(OnboardingStep.ASK_FREQUENCY);
    addAIMessage("How often would you like reminders?");
  };

  // Handle reminder frequency selection
  const handleFrequency = async (frequency: ReminderFrequency) => {
    const frequencyLabel = frequency === 60 ? 'Every 60 minutes' : 'Every 90 minutes';
    addUserMessage(frequencyLabel);
    setOnboardingData((prev) => ({ ...prev, reminderFrequency: frequency }));

    await simulateTyping(1500);
    setCurrentStep(OnboardingStep.SUMMARY);

    // Calculate daily goal
    const dailyGoalML = calculateDailyGoal(
      onboardingData.weight!,
      onboardingData.climate!,
      onboardingData.activity!
    );

    // Generate summary
    const activityBonus = {
      none: 0,
      light: 200,
      moderate: 500,
      heavy: 800,
    }[onboardingData.activity!];

    const climateBonus = {
      cold: -200,
      mild: 0,
      hot: 300,
      veryHot: 500,
    }[onboardingData.climate!];

    const baseCalc = onboardingData.weight! * 32;

    // Calculate reminder schedule to show per-interval amounts
    const reminderSchedule = computeReminderSchedule(
      onboardingData.wakeTime!,
      onboardingData.sleepTime!,
      frequency,
      dailyGoalML
    );

    // Format per-interval information based on selected unit system
    const isImperial = onboardingData.weightUnit === 'lbs';
    
    const formatAmount = (ml: number): string => {
      if (isImperial) {
        const flOz = ml * 0.033814; // Convert ml to fl oz
        if (flOz >= 1) {
          return `${flOz.toFixed(1)} fl oz`;
        }
        return `${flOz.toFixed(2)} fl oz`;
      }
      return formatMilliliters(ml);
    };

    const formatDailyGoal = (ml: number): string => {
      if (isImperial) {
        const flOz = ml * 0.033814;
        if (flOz >= 128) {
          const gallons = flOz / 128;
          return `${gallons.toFixed(2)} gallons (${Math.round(flOz)} fl oz)`;
        }
        return `${Math.round(flOz)} fl oz`;
      }
      return formatMilliliters(ml);
    };

    const formatBaseCalc = (ml: number, weightKg: number): string => {
      if (isImperial) {
        const weightLbs = weightKg / 0.453592;
        return `${formatAmount(ml)} (${weightLbs.toFixed(1)} lbs × 32 ml/kg)`;
      }
      return `${ml} ml (${weightKg.toFixed(1)} kg × 32 ml/kg)`;
    };

    // Build summary with per-interval amounts using consistent unit system
    let summary = `Perfect! Based on your profile, here's your personalized hydration plan:\n\n`;
    
    // Use consistent unit system throughout
    summary += `Base: ${formatBaseCalc(baseCalc, onboardingData.weight!)}\n`;
    summary += `Activity bonus: ${activityBonus >= 0 ? '+' : ''}${formatAmount(activityBonus)} (${onboardingData.activity} activity)\n`;
    summary += `Climate adjustment: ${climateBonus >= 0 ? '+' : ''}${formatAmount(climateBonus)} (${onboardingData.climate} climate)\n\n`;
    summary += `Daily Goal: ${formatDailyGoal(dailyGoalML)}\n\n`;

    summary += `I'll remind you every ${frequency} minutes between ${onboardingData.wakeTime} and ${onboardingData.sleepTime}.\n\n`;
    
    if (reminderSchedule.length > 0) {
      summary += `Here's your reminder schedule:\n`;
      reminderSchedule.forEach((reminder) => {
        summary += `• ${reminder.time}: ${formatAmount(reminder.amountML)}\n`;
      });
    }

    addAIMessage(summary);

    setTimeout(() => {
      setCurrentStep(OnboardingStep.COMPLETE);
    }, 2000);
  };

  // Complete onboarding and save settings
  const handleComplete = async () => {
    setIsProcessing(true);

    try {
      // Calculate final daily goal
      const dailyGoalML = calculateDailyGoal(
        onboardingData.weight!,
        onboardingData.climate!,
        onboardingData.activity!
      );

      // Calculate reminder schedule
      const reminderSchedule = computeReminderSchedule(
        onboardingData.wakeTime!,
        onboardingData.sleepTime!,
        onboardingData.reminderFrequency!,
        dailyGoalML
      );

      // Save settings to context
      await updateSettings({
        weight: onboardingData.weight!,
        weightUnit: onboardingData.weightUnit || 'kg',
        age: onboardingData.age!,
        activity: onboardingData.activity!,
        climate: onboardingData.climate!,
        wakeTime: onboardingData.wakeTime!,
        sleepTime: onboardingData.sleepTime!,
        reminderFrequency: onboardingData.reminderFrequency!,
        dailyGoalML,
        locationName: onboardingData.locationName,
        aiProfileSummary: `${onboardingData.age} years old, ${onboardingData.weight}kg, ${onboardingData.activity} activity, ${onboardingData.climate} climate`,
        onboardingComplete: true,
      });

      // Schedule notifications
      const notificationSchedule = reminderSchedule.map((reminder) => {
        const [hour, minute] = reminder.time.split(':').map(Number);
        return {
          hour,
          minute,
          mlAmount: reminder.amountML,
        };
      });

      await NotificationService.scheduleReminders(
        notificationSchedule,
        onboardingData.wakeTime!,
        onboardingData.sleepTime!
      );

      console.log(`Scheduled ${notificationSchedule.length} hydration reminders`);

      // Navigate to home screen
      navigation.replace('Home');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render input based on current step
  const renderInput = () => {
    if (isProcessing) {
      return (
        <View style={styles.inputContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
        </View>
      );
    }

    switch (currentStep) {
      case OnboardingStep.ASK_LOCATION:
        return (
          <ChatInput
            variant="location"
            placeholder="Enter your city..."
            onSubmit={handleLocationText}
            onLocationRequest={deviceLocationFailed ? undefined : handleLocationRequest}
          />
        );

      case OnboardingStep.ASK_WEIGHT:
        return (
          <>
            <View style={styles.weightUnitSelector}>
              <TouchableOpacity
                style={[
                  styles.weightUnitButton,
                  weightUnit === 'kg' && styles.weightUnitButtonActive
                ]}
                onPress={() => handleWeightUnitSelect('kg')}
              >
                <Text style={[
                  styles.weightUnitButtonText,
                  weightUnit === 'kg' && styles.weightUnitButtonTextActive
                ]}>
                  Kilograms (kg)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.weightUnitButton,
                  weightUnit === 'lbs' && styles.weightUnitButtonActive
                ]}
                onPress={() => handleWeightUnitSelect('lbs')}
              >
                <Text style={[
                  styles.weightUnitButtonText,
                  weightUnit === 'lbs' && styles.weightUnitButtonTextActive
                ]}>
                  Pounds (lbs)
                </Text>
              </TouchableOpacity>
            </View>
            <ChatInput
              variant="number"
              placeholder={`Enter weight in ${weightUnit}...`}
              onSubmit={handleWeight}
            />
          </>
        );

      case OnboardingStep.ASK_AGE:
        return (
          <ChatInput
            variant="number"
            placeholder="Enter your age..."
            onSubmit={handleAge}
          />
        );

      case OnboardingStep.ASK_ACTIVITY:
        return (
          <ChatInput
            variant="activity"
            onSubmit={(value) => handleActivity(value as ActivityLevel)}
          />
        );

      case OnboardingStep.ASK_WAKE_TIME:
        return (
          <ChatInput
            variant="time"
            timeType="wake"
            onSubmit={(value) => handleWakeTime(value as string)}
          />
        );

      case OnboardingStep.ASK_SLEEP_TIME:
        return (
          <ChatInput
            variant="time"
            timeType="sleep"
            onSubmit={(value) => handleSleepTime(value as string)}
          />
        );

      case OnboardingStep.ASK_FREQUENCY:
        return (
          <ChatInput
            variant="frequency"
            onSubmit={(value) => handleFrequency(value as ReminderFrequency)}
          />
        );

      case OnboardingStep.COMPLETE:
        return (
          <View style={styles.completeContainer}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
              disabled={isProcessing}
            >
              <Text style={styles.completeButtonText}>
                Let's get started!
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isRetake && (
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRetake}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Retaking Onboarding</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble message={item} isAI={item.role === 'assistant'} />
          )}
          contentContainerStyle={styles.messageList}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />
        {renderInput()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  keyboardAvoid: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 16,
  },
  inputContainer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  completeContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  weightUnitSelector: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  weightUnitButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  weightUnitButtonActive: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F2FD',
  },
  weightUnitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#757575',
  },
  weightUnitButtonTextActive: {
    color: '#1976D2',
    fontWeight: '600',
  },
});
