/**
 * Settings Row Component
 * Reusable row component for displaying settings items
 * Supports different types: text, number, picker, toggle, time
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface SettingsRowProps {
  label: string;
  value?: string | number;
  onPress?: () => void;
  type?: 'text' | 'number' | 'picker' | 'toggle' | 'time' | 'custom';
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  customRightComponent?: React.ReactNode;
  style?: ViewStyle;
  showChevron?: boolean;
}

export function SettingsRow({
  label,
  value,
  onPress,
  type = 'text',
  toggleValue = false,
  onToggleChange,
  customRightComponent,
  style,
  showChevron = false,
}: SettingsRowProps): React.ReactElement {
  const renderRightComponent = () => {
    if (customRightComponent) {
      return customRightComponent;
    }

    switch (type) {
      case 'toggle':
        return (
          <Switch
            value={toggleValue}
            onValueChange={onToggleChange}
            trackColor={{ false: '#D0D0D0', true: '#4A90E2' }}
            thumbColor="#FFFFFF"
          />
        );

      case 'picker':
      case 'time':
      case 'number':
        return (
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{value}</Text>
            {showChevron && <Text style={styles.chevron}>›</Text>}
          </View>
        );

      default:
        return value ? (
          <Text style={styles.valueText}>{value}</Text>
        ) : null;
    }
  };

  const content = (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      {renderRightComponent()}
    </View>
  );

  if (onPress && type !== 'toggle') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.touchable}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.touchable}>{content}</View>;
}

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    color: '#666666',
    marginRight: 4,
  },
  chevron: {
    fontSize: 24,
    color: '#CCCCCC',
    marginLeft: 4,
  },
});
