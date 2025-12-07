/**
 * Modal for adding custom water amount
 * Allows user to input a specific milliliter value
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (amountML: number) => void;
}

/**
 * QuickAddModal Component
 * Modal dialog for entering custom water consumption amount
 */
export function QuickAddModal({
  visible,
  onClose,
  onAdd,
}: QuickAddModalProps): React.ReactElement {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  /**
   * Handle add button press
   * Validates input and calls onAdd callback
   */
  const handleAdd = () => {
    const numAmount = parseInt(amount, 10);

    // Validate input
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    if (numAmount > 5000) {
      setError('Amount too large (max 5000 ml)');
      return;
    }

    // Clear state and close modal
    setAmount('');
    setError('');
    onAdd(numAmount);
    onClose();
  };

  /**
   * Handle cancel button press
   * Resets state and closes modal
   */
  const handleCancel = () => {
    setAmount('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.title}>Add Custom Amount</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  setError('');
                }}
                placeholder="Enter amount (ml)"
                placeholderTextColor="#999"
                keyboardType="numeric"
                autoFocus
                maxLength={4}
              />
              <Text style={styles.unit}>ml</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={handleAdd}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#333',
  },
  inputError: {
    borderColor: '#E74C3C',
  },
  unit: {
    fontSize: 18,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#4A90E2',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
