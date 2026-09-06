/**
 * OrderCard Component
 * 
 * Displays order summary in orders list
 * Shows order status, items count, total, and actions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OrderDetail } from '../../types/api.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Card from '../ui/Card';

export interface OrderCardProps {
  order: OrderDetail;
  onPress: () => void;
  onViewInvoice?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress, onViewInvoice }) => {
  if (!order) return null;
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return COLORS.warning;
      case 'CONFIRMED':
        return COLORS.info;
      case 'PROCESSING':
        return COLORS.info;
      case 'SHIPPED':
        return COLORS.primary;
      case 'DELIVERED':
        return COLORS.success;
      case 'CANCELLED':
        return COLORS.error;
      case 'FAILED':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = (status: string): string => {
    return status.replace(/_/g, ' ');
  };

  const formatDate = (date: string): string => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const statusColor = getStatusColor(order.status);
  const statusUpper = (order.status || '').toUpperCase().trim();
  const canViewInvoice = !!(order.invoiceUrl || statusUpper === 'DELIVERED' || statusUpper === 'PAID' || statusUpper === 'CONFIRMED' || statusUpper === 'SHIPPED');
  
  // Get first 3 item images
  const itemThumbnails = order.items.slice(0, 3).map(item => item.image || (item.product?.images && item.product.images[0])).filter(Boolean);

  return (
    <Card variant="elevated" padding="md" onPress={onPress} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      {/* Items Summary & Thumbnails Row */}
      <View style={styles.contentRow}>
        {itemThumbnails.length > 0 && (
          <View style={styles.thumbnailContainer}>
            {itemThumbnails.map((uri, idx) => (
              <FastImage 
                key={idx}
                source={{ uri }}
                style={[styles.thumbnail, { marginLeft: idx > 0 ? -15 : 0, zIndex: 10 - idx }]}
                resizeMode={FastImage.resizeMode.cover}
              />
            ))}
            {order.items.length > 3 && (
              <View style={styles.moreCount}>
                <Text style={styles.moreCountText}>+{order.items.length - 3}</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.itemsSummary}>
          <Text style={styles.itemsCount}>
            {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.paymentMode}>
            {order.payment?.mode === 'PREPAID' ? 'Prepaid' : 'Cash on Delivery'}
          </Text>
        </View>
      </View>

      {/* Total Amount */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalAmount}>₹{order.totalAmount.toFixed(2)}</Text>
      </View>

      {/* Actions */}
      {canViewInvoice && onViewInvoice && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.invoiceButton}
            onPress={(e) => {
              e.stopPropagation();
              onViewInvoice();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.invoiceButtonInner}>
              <Icon name="file-download-outline" size={18} color={COLORS.primary} />
              <Text style={styles.invoiceButtonText}>Download Invoice (PDF)</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Delivery Info (if shipped/delivered) */}
      {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && order.deliveryDate && (
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryLabel}>
            {order.status === 'DELIVERED' ? 'Delivered on' : 'Expected delivery'}
          </Text>
          <Text style={styles.deliveryDate}>{formatDate(order.deliveryDate)}</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.radius.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  itemsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  itemsCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
  },
  separator: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.xs,
  },
  paymentMode: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },
  actions: {
    marginTop: SPACING.xs,
  },
  invoiceButton: {
    backgroundColor: '#F0F9FF',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: SPACING.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  invoiceButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invoiceButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
    fontWeight: '700',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  thumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: COLORS.surface,
  },
  moreCount: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
    zIndex: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moreCountText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textSecondary,
  },
  deliveryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deliveryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
  },
  deliveryDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
  },
});

export default OrderCard;
