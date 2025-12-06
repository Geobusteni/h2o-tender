/**
 * ChatBubble - Message bubble component for chat interface
 * Displays messages with different styling for AI vs user messages
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ChatMessage } from '../models/types';

interface ChatBubbleProps {
  message: ChatMessage;
  isAI: boolean;
}

export function ChatBubble({ message, isAI }: ChatBubbleProps): JSX.Element {
  return (
    <View style={[styles.container, isAI ? styles.aiContainer : styles.userContainer]}>
      <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
        <Text style={[styles.text, isAI ? styles.aiText : styles.userText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  aiBubble: {
    backgroundColor: '#E3F2FD',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#E0E0E0',
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiText: {
    color: '#0D47A1',
  },
  userText: {
    color: '#212121',
  },
});
