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
import { getCurrentLocation } from '../utils/location';
import { calculateDailyGoal } from '../utils/hydration';
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

interface OnboardingData {
  locationName?: string;
  climate?: ClimateType;
  weight?: number;
  age?: number;
  activity?: ActivityLevel;
  wakeTime?: string;
  sleepTime?: string;
  reminderFrequency?: ReminderFrequency;
}

export function AIOnboardingScreen({ navigation }: AIOnboardingScreenProps): JSX.Element {
  const { updateSettings } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.WELCOME);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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

  // Handle location text input
  const handleLocationText = async (locationText: string) => {
    addUserMessage(locationText);
    setIsProcessing(true);

    try {
      await simulateTyping(1500);

      // For text input, use default mild climate with the provided location
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
        addAIMessage("What is your weight in kg?");
      }, 1500);
    } catch (error) {
      Alert.alert('Error', 'Failed to process location. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle location button press
  const handleLocationRequest = async () => {
    addUserMessage("Using my current location");
    setIsProcessing(true);

    try {
      await simulateTyping(1000);
      addAIMessage("Getting your location...");

      // Get device location
      const coords = await getCurrentLocation();

      await simulateTyping(1500);

      // Get climate data from AI service
      const climateData = await AIService.getClimateForLocation(
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
          addAIMessage("What is your weight in kg?");
        }, 1500);
      } else {
        throw new Error('Unable to determine climate data');
      }
    } catch (error) {
      console.error('Location error:', error);
      addAIMessage(
        "I couldn't get your location. You can type your city name instead, or I'll use default settings."
      );

      // Fall back to text input
      setTimeout(() => {
        setOnboardingData((prev) => ({
          ...prev,
          climate: 'mild',
        }));
        setCurrentStep(OnboardingStep.ASK_WEIGHT);
        addAIMessage("What is your weight in kg?");
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle weight input
  const handleWeight = async (weight: number) => {
    addUserMessage(`${weight} kg`);
    setOnboardingData((prev) => ({ ...prev, weight }));

    await simulateTyping(800);
    setCurrentStep(OnboardingStep.ASK_AGE);
    addAIMessage("What is your age?");
  };

  // Handle age input
  const handleAge = async (age: number) => {
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

    const summary = `Perfect! Based on your profile, here's your personalized hydration plan:\n\n` +
      `Base: ${baseCalc} ml (${onboardingData.weight} kg × 32 ml/kg)\n` +
      `Activity bonus: ${activityBonus >= 0 ? '+' : ''}${activityBonus} ml (${onboardingData.activity} activity)\n` +
      `Climate adjustment: ${climateBonus >= 0 ? '+' : ''}${climateBonus} ml (${onboardingData.climate} climate)\n\n` +
      `Daily Goal: ${dailyGoalML} ml\n\n` +
      `I'll remind you every ${frequency} minutes between ${onboardingData.wakeTime} and ${onboardingData.sleepTime}.`;

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

      // Save settings to context
      await updateSettings({
        weight: onboardingData.weight!,
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
            onLocationRequest={handleLocationRequest}
          />
        );

      case OnboardingStep.ASK_WEIGHT:
        return (
          <ChatInput
            variant="number"
            placeholder="Enter weight in kg..."
            onSubmit={handleWeight}
          />
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
            onSubmit={(value) => handleWakeTime(value as string)}
          />
        );

      case OnboardingStep.ASK_SLEEP_TIME:
        return (
          <ChatInput
            variant="time"
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
});
