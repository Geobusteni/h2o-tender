/**
 * DonationModal Component
 * Modal for in-app purchase donations to support development
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

interface DonationModalProps {
  visible: boolean;
  onClose: () => void;
}

type DonationTier = 'small' | 'medium' | 'large';

interface DonationOption {
  id: DonationTier;
  label: string;
  price: string;
  description: string;
}

const DONATION_OPTIONS: DonationOption[] = [
  {
    id: 'small',
    label: 'Small Coffee',
    price: '$1.99',
    description: 'Buy me a small coffee',
  },
  {
    id: 'medium',
    label: 'Medium Coffee',
    price: '$4.99',
    description: 'Buy me a medium coffee',
  },
  {
    id: 'large',
    label: 'Large Coffee',
    price: '$9.99',
    description: 'Buy me a large coffee',
  },
];

/**
 * DonationModal Component
 * Shows donation tiers and handles IAP flow
 */
export function DonationModal({
  visible,
  onClose,
}: DonationModalProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<DonationTier | null>(null);

  /**
   * Handle donation tier selection
   */
  const handleDonation = async (tier: DonationTier) => {
    setSelectedTier(tier);
    setIsLoading(true);

    try {
      // TODO: Implement IAP service integration
      // For now, show a thank you message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      Alert.alert(
        'Thank You!',
        'Thank you for your support! This feature is coming soon with full in-app purchase integration.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsLoading(false);
              setSelectedTier(null);
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Donation error:', error);

      Alert.alert(
        'Purchase Failed',
        'Sorry, we could not process your donation at this time. Please try again later.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsLoading(false);
              setSelectedTier(null);
            },
          },
        ]
      );
    }
  };

  /**
   * Handle close button
   */
  const handleClose = () => {
    if (!isLoading) {
      setSelectedTier(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Support H2O Tender</Text>
            <Text style={styles.subtitle}>
              Help keep this app free and improving
            </Text>
          </View>

          {/* Donation Options */}
          <View style={styles.optionsContainer}>
            {DONATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.donationButton,
                  selectedTier === option.id && styles.donationButtonSelected,
                ]}
                onPress={() => handleDonation(option.id)}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <View style={styles.donationContent}>
                  <Text style={styles.donationLabel}>{option.label}</Text>
                  <Text style={styles.donationDescription}>
                    {option.description}
                  </Text>
                </View>
                <Text style={styles.donationPrice}>{option.price}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, isLoading && styles.closeButtonDisabled]}
            onPress={handleClose}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>
              {isLoading ? 'Please wait...' : 'Maybe Later'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  donationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  donationButtonSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E8F4FD',
  },
  donationContent: {
    flex: 1,
  },
  donationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  donationDescription: {
    fontSize: 13,
    color: '#666',
  },
  donationPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginLeft: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
