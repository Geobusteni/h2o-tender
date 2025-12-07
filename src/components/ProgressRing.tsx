/**
 * Circular progress ring component
 * Displays hydration progress as an animated circular indicator
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressRingProps {
  progress: number; // 0-1 value representing progress
  size?: number; // Diameter of the circle
  strokeWidth?: number; // Width of the progress ring
  color?: string; // Color of the progress ring
  backgroundColor?: string; // Color of the background ring
}

/**
 * ProgressRing Component
 * Renders a circular progress indicator with percentage text in center
 */
export function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 16,
  color = '#4A90E2',
  backgroundColor = '#E0E0E0',
}: ProgressRingProps): React.ReactElement {
  // Calculate circle properties
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Calculate stroke offset for progress
  const strokeDashoffset = circumference * (1 - clampedProgress);

  // Calculate percentage for display
  const percentage = Math.round(clampedProgress * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Center text showing percentage */}
      <View style={styles.textContainer}>
        <Text style={styles.percentageText}>{percentage}%</Text>
        <Text style={styles.labelText}>Complete</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
  },
  labelText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
