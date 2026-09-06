/**
 * OrderDetails Screen
 * 
 * Detailed view of a single order
 * Shows order items, status, address, and actions
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Clipboard,
  Modal,
  TextInput,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrderById, cancelOrder } from '../../store/slices/orderSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import whatsappService from '../../services/whatsapp.service';

type OrderDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OrderDetails'
>;
type OrderDetailsRouteProp = RouteProp<RootStackParamList, 'OrderDetails'>;

interface OrderDetailsProps {
  navigation: OrderDetailsNavigationProp;
  route: OrderDetailsRouteProp;
}

const OrderDetailsScreen: React.FC<OrderDetailsProps> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { selectedOrder, isLoading } = useAppSelector((state) => state.orders);
  const { orderId } = route.params;

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const CANCEL_REASONS = [
    'Ordered by mistake',
    'Found a better deal',
    'Shipping time is too long',
    'Changed my mind',
    'Other'
  ];

  useEffect(() => {
    // Clear any previous errors when mounting the details screen
    dispatch({ type: 'orders/clearError' });
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    await dispatch(fetchOrderById(orderId));
  };

  const handleCancelOrder = () => {
    setCancelModalVisible(true);
  };

  const handleCancelSubmit = async () => {
    const finalReason = cancelReason === 'Other' ? customReason : cancelReason;
    if (!finalReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }

    setCancelModalVisible(false);
    
    const resultAction = await dispatch(
      cancelOrder({ orderId, reason: finalReason })
    );
    
    if (cancelOrder.fulfilled.match(resultAction)) {
      Alert.alert('Success', 'Order cancelled successfully', [{ text: 'OK' }]);
      setCancelReason('');
      setCustomReason('');
    } else {
      Alert.alert('Error', (resultAction.payload as string) || 'Failed to cancel order', [{ text: 'OK' }]);
    }
  };

  const handleWhatsAppInquiry = () => {
    if (selectedOrder) {
      whatsappService.openOrderInquiry(selectedOrder);
    }
  };

  const handleViewInvoice = async () => {
    if (!selectedOrder) return;

    // The public-pdf endpoint generates the invoice on-the-fly from the order.
    // No pre-generation step needed — just construct the URL and open it.
    const pdfUrl = `https://api.shibra.in/api/v1/invoices/public-pdf/${orderId}`;

    Linking.openURL(pdfUrl).catch((err: any) => {
      Alert.alert('Error', 'Could not open invoice. Please try again.');
      console.error('Invoice open error:', err);
    });
  };

  const handleReorder = async () => {
    if (!selectedOrder || !selectedOrder.items || selectedOrder.items.length === 0) return;
    
    // Show loading or something if needed, but since it's quick we just dispatch
    let successCount = 0;
    for (const item of selectedOrder.items) {
      if (item.product?._id) {
        await dispatch(addToCart({ 
          productId: item.product._id, 
          quantity: item.quantity 
        }));
        successCount++;
      }
    }
    
    if (successCount > 0) {
      // Navigate to cart tab
      navigation.navigate('Cart');
    } else {
      Alert.alert('Notice', 'Products are no longer available for reorder.');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return COLORS.warning;
      case 'CONFIRMED':
      case 'PROCESSING':
        return COLORS.info;
      case 'SHIPPED':
        return COLORS.primary;
      case 'DELIVERED':
        return COLORS.success;
      case 'CANCELLED':
      case 'FAILED':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || !selectedOrder) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  const order = selectedOrder;
  const statusUpper = (order.status || '').toUpperCase().trim();
  const canCancel = ['PENDING', 'CONFIRMED'].includes(statusUpper);
  const canViewInvoice = !!(order.invoiceUrl || statusUpper === 'DELIVERED' || statusUpper === 'PAID' || statusUpper === 'CONFIRMED' || statusUpper === 'SHIPPED');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <Card style={styles.headerCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}
            >
              <Text style={styles.statusText}>
                {order.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
          {order.status === 'CANCELLED' && order.cancellationReason && (
            <View style={{ marginTop: SPACING.md, backgroundColor: '#FEF2F2', padding: SPACING.sm, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' }}>
              <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, fontFamily: TYPOGRAPHY.fontFamily.regular, fontWeight: '600', color: '#991B1B' }}>Cancellation Reason:</Text>
              <Text style={{ fontSize: TYPOGRAPHY.fontSize.md, fontFamily: TYPOGRAPHY.fontFamily.regular, color: '#B91C1C', marginTop: 4 }}>{order.cancellationReason}</Text>
            </View>
          )}
        </Card>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item, index) => (
            <Card key={index} style={styles.itemCard}>
              <View style={styles.itemContent}>
                {item.image || (item.product?.images && item.product.images.length > 0) ? (
                  <FastImage
                    source={{
                      uri: item.image || item.product.images[0],
                      priority: FastImage.priority.normal,
                    }}
                    style={styles.itemImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>No Image</Text>
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product?.name || 'Product'}</Text>
                  {item.variant && (
                    <Text style={styles.itemVariant}>
                      Variant: {item.variant.color || item.variant.name} {item.variant.value ? `- ${item.variant.value}` : ''}
                    </Text>
                  )}
                  <Text style={styles.itemPrice}>
                    ₹{item.price.toFixed(2)} × {item.quantity}
                  </Text>
                  <Text style={styles.itemTotal}>
                    Total: ₹{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Card>
            <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
            <Text style={styles.addressPhone}>{order.shippingAddress.phone}</Text>
            <Text style={styles.addressText}>{order.shippingAddress.addressLine1}</Text>
            {order.shippingAddress.addressLine2 && (
              <Text style={styles.addressText}>{order.shippingAddress.addressLine2}</Text>
            )}
            <Text style={styles.addressText}>
              {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
              {order.shippingAddress.pincode}
            </Text>
          </Card>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <Card>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Mode</Text>
              <Text style={styles.summaryValue}>
                {order.payment?.mode === 'PREPAID'
                  ? 'Prepaid'
                  : order.payment?.mode === 'UPI_QR'
                  ? 'UPI / QR'
                  : order.payment?.mode === 'COD_PARTIAL'
                  ? 'Partial COD'
                  : order.payment?.mode === 'FULL_PAYMENT'
                  ? 'Full Payment'
                  : 'Cash on Delivery'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Status</Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color:
                      order.status === 'PAID' || order.status === 'CONFIRMED' || order.status === 'DELIVERED' || order.payment?.status === 'PAID' || order.payment?.codCollected || (order.payment?.amountPaid || 0) >= (order.totalAmount || 1)
                        ? COLORS.success
                        : COLORS.warning,
                  },
                ]}
              >
                {order.status === 'PAID' || order.status === 'CONFIRMED' || order.status === 'DELIVERED' || order.payment?.status === 'PAID' || order.payment?.codCollected || (order.payment?.amountPaid || 0) >= (order.totalAmount || 1)
                  ? 'Paid'
                  : order.status === 'CANCELLED'
                  ? 'Cancelled'
                  : 'Pending'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{(order.subtotal || 0).toFixed(2)}</Text>
            </View>
            {(order.shippingCharge || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping Charge</Text>
                <Text style={styles.summaryValue}>₹{(order.shippingCharge || 0).toFixed(2)}</Text>
              </View>
            )}
            {((order.discount || 0) > 0 || (order.coupon?.discountAmount || 0) > 0) && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount {order.coupon?.code ? `(${order.coupon.code})` : ''}</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  -₹{(order.discount || order.coupon?.discountAmount || 0).toFixed(2)}
                </Text>
              </View>
            )}
            {(order.taxAmount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>₹{(order.taxAmount || 0).toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{(order.totalAmount || 0).toFixed(2)}</Text>
            </View>
            {(order.tokenReceived || 0) > 0 && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: COLORS.success }]}>Token Received</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                    -₹{(order.tokenReceived || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Balance Due</Text>
                  <Text style={[styles.totalValue, { color: COLORS.error }]}>
                    ₹{Math.max(0, (order.totalAmount || 0) - (order.tokenReceived || 0)).toFixed(2)}
                  </Text>
                </View>
              </>
            )}
          </Card>
        </View>

        {/* Tracking Information */}
        {(order.courierName || order.trackingNumber) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracking Information</Text>
            <Card>
              {order.courierName ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Courier</Text>
                  <Text style={styles.summaryValue}>{order.courierName}</Text>
                </View>
              ) : null}
              {order.trackingNumber ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>AWB / Tracking No.</Text>
                  <View style={styles.trackingRow}>
                    <Text style={styles.trackingNumber}>{order.trackingNumber}</Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => {
                        Clipboard.setString(order.trackingNumber || '');
                        Alert.alert('Copied!', 'Tracking number copied to clipboard.');
                      }}
                    >
                      <Icon name="content-copy" size={16} color={COLORS.primary} />
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
              {order.trackingUrl ? (
                <TouchableOpacity
                  style={styles.trackLinkButton}
                  onPress={() => Linking.openURL(order.trackingUrl!)}
                >
                  <Icon name="map-marker-path" size={18} color={COLORS.primary} />
                  <Text style={styles.trackLinkText}>Track your shipment</Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Reorder Entire Order"
            variant="primary"
            onPress={handleReorder}
            style={styles.actionButton}
            icon={<Icon name="cart-plus" size={20} color="#fff" />}
          />
          
          <Button
            title="WhatsApp Inquiry"
            variant="outline"
            onPress={handleWhatsAppInquiry}
            style={styles.actionButton}
          />

          {canViewInvoice && (
            <Button
              title="Download Invoice (PDF)"
              variant="outline"
              onPress={handleViewInvoice}
              style={[styles.actionButton, { borderColor: COLORS.primary }]}
              icon={<Icon name="file-download-outline" size={20} color={COLORS.primary} />}
            />
          )}

          {canCancel && (
            <Button
              title="Cancel Order"
              variant="danger"
              onPress={handleCancelOrder}
              style={styles.actionButton}
            />
          )}
        </View>
      </ScrollView>

      {/* Cancel Order Modal */}
      <Modal visible={cancelModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCancelModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Order</Text>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Please select a reason for cancellation:</Text>
            
            {CANCEL_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  cancelReason === reason && styles.reasonOptionSelected
                ]}
                onPress={() => setCancelReason(reason)}
              >
                <View style={[styles.radioCircle, cancelReason === reason && styles.radioCircleSelected]}>
                  {cancelReason === reason && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}

            {cancelReason === 'Other' && (
              <TextInput
                style={styles.customReasonInput}
                placeholder="Type your reason here..."
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={3}
              />
            )}

            <Button
              title="Submit Cancellation"
              variant="danger"
              onPress={handleCancelSubmit}
              style={styles.submitCancelBtn}
              disabled={!cancelReason || (cancelReason === 'Other' && !customReason.trim())}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  headerCard: {
    margin: SPACING.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
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
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  itemCard: {
    marginBottom: SPACING.md,
  },
  itemContent: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: SPACING.radius.md,
    marginRight: SPACING.md,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: SPACING.radius.md,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  imagePlaceholderText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  itemVariant: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemTotal: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },
  addressName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  addressPhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  addressText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.fontSize.md * 1.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },
  actionsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  actionButton: {
    marginBottom: SPACING.md,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  trackingNumber: {
    fontSize: TYPOGRAPHY.fontSize.md, fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: SPACING.sm,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight || '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    gap: 4,
  },
  copyButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm, fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.primary,
    fontWeight: '600',
  },
  trackLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  trackLinkText: {
    fontSize: TYPOGRAPHY.fontSize.md, fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg, fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.md, fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reasonOptionSelected: {
    backgroundColor: COLORS.background,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  reasonText: {
    fontSize: TYPOGRAPHY.fontSize.md, fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md, fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitCancelBtn: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  }
});

export default OrderDetailsScreen;
