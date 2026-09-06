/**
 * Input Component
 * 
 * Reusable text input with validation, labels, and error states
 * Production-ready with proper accessibility
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
  StyleProp,
  TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  required?: boolean;
  secureTextEntry?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  required = false,
  secureTextEntry = false,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const hasError = !!error;

  const containerStyles: StyleProp<ViewStyle> = [styles.container, containerStyle];

  const inputContainerStyles: StyleProp<ViewStyle> = [
    styles.inputContainer,
    isFocused ? styles.inputContainerFocused : null,
    hasError ? styles.inputContainerError : null,
  ];

  const inputStyles: StyleProp<TextStyle> = [
    styles.input,
    leftIcon ? styles.inputWithLeftIcon : null,
    rightIcon ? styles.inputWithRightIcon : null,
    style,
  ];

  return (
    <View style={containerStyles}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <View style={inputContainerStyles}>
        {/* Left Icon */}
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        {/* Text Input */}
        <TextInput
          style={inputStyles}
          placeholderTextColor={COLORS.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          {...props}
        />

        {/* Right Icon or Show/Hide Password Toggle */}
        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={() => setIsSecure(!isSecure)}
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
            accessibilityRole="button"
          >
            <Text style={styles.eyeIcon}>{isSecure ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        ) : (
          rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>
        )}
      </View>

      {/* Error Message */}
      {hasError && <Text style={styles.errorText}>{error}</Text>}

      {/* Helper Text */}
      {!hasError && helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  buttonText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    textAlign: 'center',
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SPACING.radius.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 56,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  inputWithLeftIcon: {
    marginLeft: SPACING.xs,
  },
  inputWithRightIcon: {
    marginRight: SPACING.xs,
  },
  leftIconContainer: {
    marginRight: SPACING.xs,
  },
  rightIconContainer: {
    marginLeft: SPACING.xs,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

export default Input;
