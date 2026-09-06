/**
 * Card Component
 * 
 * Reusable card container with elevation and press handlers
 * Production-ready with proper styling
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

export interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
  padding?: keyof typeof SPACING | 'none';
}

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const paddingValue = padding === 'none' ? 0 : SPACING[padding as keyof typeof SPACING];
  const variantStyle = styles[`card_${variant}` as keyof typeof styles];
  const cardStyles = [
    styles.card,
    variantStyle,
    { padding: typeof paddingValue === 'number' ? paddingValue : 0 },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SPACING.radius.lg,
    backgroundColor: COLORS.white,
  },
  card_default: {
    backgroundColor: COLORS.white,
  },
  card_outlined: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  card_elevated: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card_flat: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});

export default Card;
