/**
 * Button Component
 * 
 * Reusable button with variants, sizes, and loading states
 * Production-ready with proper accessibility
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  StyleProp,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  textStyle?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle: customTextStyle,
  onPress,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const buttonStyle: StyleProp<ViewStyle> = [
    styles.button,
    styles[`button_${variant}` as keyof typeof styles] as ViewStyle,
    styles[`button_${size}` as keyof typeof styles] as ViewStyle,
    fullWidth ? styles.buttonFullWidth : null,
    isDisabled ? styles.buttonDisabled : null,
    style,
  ];

  const textStyle: StyleProp<TextStyle> = [
    styles.buttonText,
    styles[`buttonText_${variant}` as keyof typeof styles] as TextStyle,
    styles[`buttonText_${size}` as keyof typeof styles] as TextStyle,
    isDisabled ? styles.buttonTextDisabled : null,
    customTextStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? COLORS.white : COLORS.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <>{icon}</>}
          <Text style={textStyle}>{title}</Text>
          {icon && iconPosition === 'right' && <>{icon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SPACING.radius.lg,
    paddingHorizontal: SPACING.lg,
    minHeight: 52,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Variants
  button_primary: {
    backgroundColor: COLORS.primary,
  },
  button_secondary: {
    backgroundColor: COLORS.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_danger: {
    backgroundColor: COLORS.error,
  },

  // Sizes
  button_small: {
    paddingVertical: SPACING.xs,
    minHeight: 40,
    borderRadius: SPACING.radius.md,
  },
  button_medium: {
    paddingVertical: SPACING.sm,
    minHeight: 52,
    borderRadius: SPACING.radius.lg,
  },
  button_large: {
    paddingVertical: SPACING.md,
    minHeight: 60,
    borderRadius: SPACING.radius.xl,
  },

  // Text styles
  buttonText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },

  // Text variants
  buttonText_primary: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  buttonText_secondary: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  buttonText_outline: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  buttonText_ghost: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  buttonText_danger: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
  },

  // Text sizes
  buttonText_small: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  buttonText_medium: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  buttonText_large: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
});

export default Button;
