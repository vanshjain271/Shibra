/**
 * AddressCard Component
 * 
 * Displays address with selection and action options
 * Used in address list and checkout
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Address } from '../../types/api.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Card from '../ui/Card';

export interface AddressCardProps {
  address: Address;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  showActions?: boolean;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  showActions = false,
}) => {
  const handlePress = () => {
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <Card
      variant={selected ? 'elevated' : 'outlined'}
      padding="md"
      onPress={onSelect ? handlePress : undefined}
      style={[styles.container, selected && styles.selectedContainer]}
    >
      {/* Default Badge */}
      {address.isDefault && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultText}>DEFAULT</Text>
        </View>
      )}

      {/* Name and Phone */}
      <Text style={styles.name}>{address.name}</Text>
      <Text style={styles.phone}>{address.phone}</Text>

      {/* Address Lines */}
      <View style={styles.addressContainer}>
        <Text style={styles.addressText}>{address.addressLine1}</Text>
        {address.addressLine2 && (
          <Text style={styles.addressText}>{address.addressLine2}</Text>
        )}
        <Text style={styles.addressText}>
          {address.city}, {address.state} - {address.pincode}
        </Text>
      </View>

      {/* Actions */}
      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEdit}
              accessibilityLabel="Edit address"
              accessibilityRole="button"
            >
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}

          {!address.isDefault && onSetDefault && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onSetDefault}
              accessibilityLabel="Set as default"
              accessibilityRole="button"
            >
              <Text style={styles.actionText}>Set as Default</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
              accessibilityLabel="Delete address"
              accessibilityRole="button"
            >
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Selection Radio */}
      {onSelect && (
        <View style={styles.radioContainer}>
          <View style={[styles.radio, selected && styles.radioSelected]}>
            {selected && <View style={styles.radioInner} />}
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  selectedContainer: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  defaultBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: SPACING.radius.sm,
  },
  defaultText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  phone: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  addressContainer: {
    marginBottom: SPACING.sm,
  },
  addressText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.fontSize.md * 1.5,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    marginRight: SPACING.md,
    marginBottom: SPACING.xs,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.primary,
  },
  deleteButton: {},
  deleteText: {
    color: COLORS.error,
  },
  radioContainer: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
});

export default AddressCard;
