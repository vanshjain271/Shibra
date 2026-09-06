/**
 * Checkout Screen
 * 
 * Complete checkout flow with address selection and payment
 * Integrates with Razorpay for payment processing
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Image,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAddresses, selectAddress } from '../../store/slices/addressSlice';
import { createOrder, initiatePayment, verifyPayment, handlePaymentFailure } from '../../store/slices/orderSlice';
import { fetchCart, clearCart, applyCoupon, removeCoupon } from '../../store/slices/cartSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import AddressCard from '../../components/address/AddressCard';
import CouponModal from '../../components/cart/CouponModal';
import razorpayService from '../../services/razorpay.service';
import { AppEventsLogger } from 'react-native-fbsdk-next';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;

interface CheckoutScreenProps {
  navigation: CheckoutScreenNavigationProp;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  
  const { cart, appliedCoupon, isValidatingCoupon } = useAppSelector((state) => state.cart);
  const { addresses, selectedAddress } = useAppSelector((state) => state.address);
  const { user } = useAppSelector((state) => state.auth);
  const { currentOrder, paymentData, isLoading } = useAppSelector((state) => state.orders);
  const { settings } = useAppSelector((state) => state.settings);

  const [couponCode, setCouponCode] = useState('');
  const [isCouponModalVisible, setIsCouponModalVisible] = useState(false);

  const [paymentMode, setPaymentMode] = useState<'PREPAID' | 'COD' | 'COD_PARTIAL' | 'UPI_QR'>('PREPAID');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({ title: '', message: '', orderId: '' });

  useEffect(() => {
    if (settings) {
      if (paymentMode === 'PREPAID' && !settings.razorpayEnabled) {
        if (settings.codEnabled) setPaymentMode('COD');
        else if (settings.advancePartialPayment) setPaymentMode('COD_PARTIAL');
      }
    }
  }, [settings]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await dispatch(fetchCart());
    await dispatch(fetchAddresses());
  };

  const handleAddressSelect = (addressId: string) => {
    const address = addresses.find((addr) => addr._id === addressId);
    if (address) {
      dispatch(selectAddress(address));
    }
  };

  const handleAddNewAddress = () => {
    navigation.navigate('AddAddress', { returnToCheckout: true });
  };

  const handleApplyCoupon = async (codeToApply: string = couponCode): Promise<boolean> => {
    if (!codeToApply.trim()) return false;
    if (!cart) return false;

    try {
      const resultAction = await dispatch(applyCoupon({ 
        code: codeToApply.trim(), 
        total: cart.subtotal 
      }));

      if (applyCoupon.fulfilled.match(resultAction)) {
        Alert.alert('Success', 'Coupon applied successfully!');
        setCouponCode('');
        return true;
      } else {
        Alert.alert('Error', resultAction.payload as string || 'Invalid coupon code');
        return false;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to apply coupon');
      return false;
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address', [{ text: 'OK' }]);
      return;
    }

    if (!cart || cart.items.length === 0) {
      Alert.alert('Error', 'Your cart is empty', [{ text: 'OK' }]);
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create order
      const createOrderResult = await dispatch(
        createOrder({
          items: cart.items.map((item) => ({
            productId: item.product._id,
            variantId: item.variant?._id,
            quantity: item.quantity,
          })),
          shippingAddress: selectedAddress._id,
          paymentMode,
          couponCode: (appliedCoupon && cart.subtotal >= Number(appliedCoupon.minOrderAmount || 0)) ? appliedCoupon.code : undefined,
        })
      );

      if (createOrder.fulfilled.match(createOrderResult)) {
        const orderId = createOrderResult.payload.order._id;
        dispatch(clearCart()); // Clear cart immediately
        
        if (paymentMode === 'COD' || paymentMode === 'UPI_QR') {
          // Log Facebook Purchase Event for COD
          try {
            AppEventsLogger.logPurchase(cart.total, 'INR', {
              order_id: orderId,
              payment_method: paymentMode
            });
          } catch (e) {
            console.log('FB Event Error:', e);
          }

          // COD or QR - Order is confirmed immediately
          if (paymentMode === 'UPI_QR') {
            navigation.navigate('PaymentQr');
          } else {
            setSuccessData({
              title: 'Order Placed!',
              message: 'Your order has been placed successfully. You can pay on delivery.',
              orderId: orderId,
            });
            setShowSuccessModal(true);
          }
        } else {
          await handlePrepaidPayment(orderId);
        }
      } else {
        Alert.alert('Error', createOrderResult.payload as string || 'Failed to create order', [
          { text: 'OK' },
        ]);
        setIsProcessing(false);
        return;
      }

    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrepaidPayment = async (orderId: string) => {
    try {
      // Step 1: Initiate payment (get Razorpay order details)
      const paymentResult = await dispatch(initiatePayment(orderId));

      if (initiatePayment.rejected.match(paymentResult)) {
        Alert.alert('Error', paymentResult.payload as string || 'Failed to initiate payment', [
          { text: 'OK' },
        ]);
        return;
      }

      const razorpayData = paymentResult.payload as any;

      // SAFETY: Check if razorpayService is actually available (e.g. in emulator without native module)
      if (!razorpayService) {
        throw new Error('Payment gateway (Razorpay) is not available in this environment');
      }

      // Step 2: Open Razorpay checkout
      const checkoutResult = await razorpayService.openCheckout({
        key: razorpayData.keyId,
        orderId: razorpayData.razorpayOrderId,
        amount: razorpayData.amount,
        currency: 'INR',
        name: 'Shibra',
        description: `Order ${orderId.slice(-8)}`,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: COLORS.primary,
        },
      });

      if (checkoutResult.success) {
        // Step 3: Verify payment
        const verifyResult = await dispatch(
          verifyPayment({
            orderId,
            razorpayOrderId: checkoutResult.data.razorpay_order_id,
            razorpayPaymentId: checkoutResult.data.razorpay_payment_id,
            razorpaySignature: checkoutResult.data.razorpay_signature,
          })
        );

        if (verifyPayment.fulfilled.match(verifyResult)) {
          // Payment successful
          
          // Log Facebook Purchase Event
          try {
            AppEventsLogger.logPurchase(razorpayData.amount / 100, 'INR', {
              order_id: orderId,
              payment_method: paymentMode
            });
          } catch (e) {
            console.log('FB Event Error:', e);
          }

          setSuccessData({
            title: 'Payment Successful!',
            message: 'Your order has been confirmed and paid securely.',
            orderId: orderId,
          });
          setShowSuccessModal(true);
        } else {
          Alert.alert('Error', 'Payment verification failed', [{ text: 'OK' }]);
        }
      } else {
        // Payment failed
        await dispatch(
          handlePaymentFailure({
            orderId,
            reason: checkoutResult.error.description,
          })
        );

        razorpayService.showPaymentError(checkoutResult.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Payment failed', [{ text: 'OK' }]);
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Button
          title="Browse Products"
          onPress={() => navigation.navigate('Main' as never)}
          style={styles.browseButton}
        />
      </View>
    );
  }

  // Helper to safely format numbers
  const formatCurrency = (val: number | undefined) => `₹${(val || 0).toFixed(2)}`;

  let discountAmount = cart.discount || 0;
  if (appliedCoupon && cart.subtotal >= Number(appliedCoupon.minOrderAmount || 0)) {
    if (appliedCoupon.type === 'PERCENTAGE') {
      discountAmount = (cart.subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscountAmount);
      }
    } else {
      discountAmount = appliedCoupon.value;
    }
  }

  const payableTotal = Math.max(0, cart.subtotal + (cart.shippingCharge || 0) + (cart.tax || 0) - discountAmount);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={handleAddNewAddress}>
              <Text style={styles.addNewText}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <Card padding="lg" style={{ backgroundColor: COLORS.white }}>
              <Text style={styles.noAddressText}>No addresses found</Text>
              <Button
                title="Add Address"
                onPress={handleAddNewAddress}
                style={styles.addButton}
              />
            </Card>
          ) : (
            addresses.map((address) => (
              <AddressCard
                key={address._id}
                address={address}
                selected={selectedAddress?._id === address._id}
                onSelect={() => handleAddressSelect(address._id)}
              />
            ))
          )}
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coupons & Offers</Text>
          {appliedCoupon && cart.subtotal >= Number(appliedCoupon.minOrderAmount || 0) ? (
            <View style={styles.appliedCouponContainer}>
              <View style={styles.couponInfo}>
                <Text style={styles.appliedCouponTitle}>
                  {appliedCoupon.code} <Text style={styles.appliedText}>applied</Text>
                </Text>
                <Text style={styles.couponDescription}>
                  {appliedCoupon.description || `You saved ${formatCurrency(cart.discount)} with this coupon!`}
                </Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.viewCouponsButton} 
              onPress={() => setIsCouponModalVisible(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="ticket-percent-outline" size={24} color={COLORS.primary} />
                <Text style={styles.viewCouponsText}>View Available Coupons</Text>
              </View>
              <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Items Section (NEW) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items in your order</Text>
          <Card style={{ backgroundColor: COLORS.white, marginTop: SPACING.sm }}>
            {cart.items.map((item, index) => {
              const product = item.product as any;
              const imageSource = product.image || (product.images && product.images.length > 0 ? product.images[0] : null);
              
              return (
                <View key={item._id} style={[styles.itemRow, index < cart.items.length - 1 && styles.itemDivider]}>
                  <View style={styles.itemImageContainer}>
                    {imageSource ? (
                      <Image 
                        source={{ uri: imageSource }} 
                        style={styles.itemImage} 
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.itemImagePlaceholder}>
                        <Text style={styles.itemImagePlaceholderText}>YQ</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{product.name}</Text>
                    {item.variant && (
                      <View>
                        <Text style={styles.itemVariant}>{item.variant.name || item.product.name}</Text>
                        {!!item.variant.color && item.variant.color !== item.variant.name && (
                          <Text style={styles.variantColorText}>Color: {item.variant.color}</Text>
                        )}
                      </View>
                    )}
                    <View style={styles.itemPriceRow}>
                      <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                      <Text style={styles.itemPrice}>{formatCurrency(item.price)} <Text style={styles.perUnitText}>/ unit</Text></Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <Card style={{ backgroundColor: COLORS.white }}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({cart.items.length})</Text>
              <Text style={styles.summaryValue}>{formatCurrency(cart.subtotal)}</Text>
            </View>
            
            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatCurrency(discountAmount)}
                </Text>
              </View>
            )}

            {(cart.tax || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (GST)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(cart.tax)}</Text>
              </View>
            )}

            {(cart.shippingCharge || 0) >= 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping Charge</Text>
                <Text style={styles.summaryValue}>
                  {cart.shippingCharge === 0 ? 'FREE' : formatCurrency(cart.shippingCharge)}
                </Text>
              </View>
            )}

            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatCurrency(payableTotal)}</Text>
            </View>
          </Card>
        </View>
        {/* Payment Mode Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.paymentButtonRow}>
            {/* Prepaid Option */}
            {settings?.razorpayEnabled && (
              <TouchableOpacity
                style={[
                  styles.paymentTile,
                  paymentMode === 'PREPAID' && styles.paymentTileSelected
                ]}
                onPress={() => setPaymentMode('PREPAID')}
                activeOpacity={0.7}
              >
                <Icon 
                  name="credit-card-outline" 
                  size={28} 
                  color={paymentMode === 'PREPAID' ? COLORS.white : COLORS.primary} 
                />
                <Text style={[
                  styles.paymentTileTitle,
                  paymentMode === 'PREPAID' && styles.paymentTileTitleSelected
                ]}>Prepaid</Text>
              </TouchableOpacity>
            )}

            {/* UPI QR Option (Show only if QR code exists in settings) */}
            {settings?.paymentQrCode ? (
              <TouchableOpacity
                style={[
                  styles.paymentTile,
                  paymentMode === 'UPI_QR' && styles.paymentTileSelected,
                ]}
                onPress={() => setPaymentMode('UPI_QR')}
                activeOpacity={0.7}
              >
                <Icon 
                  name="qrcode-scan" 
                  size={28} 
                  color={paymentMode === 'UPI_QR' ? COLORS.white : COLORS.primary} 
                />
                <Text style={[
                  styles.paymentTileTitle,
                  paymentMode === 'UPI_QR' && styles.paymentTileTitleSelected
                ]}>UPI QR</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {paymentMode === 'COD' && (
            <View style={styles.paymentMsgBox}>
              <Icon name="check-circle" size={18} color={COLORS.success} />
              <Text style={styles.paymentMsgText}>Pay with cash or UPI when order reaches your door.</Text>
            </View>
          )}

          {paymentMode === 'UPI_QR' && (
            <View style={[styles.paymentMsgBox, { borderColor: '#BEE3F8', backgroundColor: '#E6F7FE' }]}>
              <Icon name="information-outline" size={18} color={COLORS.primary} />
              <Text style={[styles.paymentMsgText, { color: COLORS.primary }]}>
                Scan QR and share payment screenshot on WhatsApp after placing order.
              </Text>
            </View>
          )}

          {!settings?.razorpayEnabled && !settings?.codEnabled && !settings?.paymentQrCode && (
             <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>No payment methods currently available.</Text>
          )}
        </View>

        <CouponModal
          visible={isCouponModalVisible}
          onClose={() => setIsCouponModalVisible(false)}
          cartTotal={Number(cart?.subtotal || 0)}
          onApplyCoupon={handleApplyCoupon}
          appliedCouponCode={(appliedCoupon && cart.subtotal >= Number(appliedCoupon.minOrderAmount || 0)) ? appliedCoupon.code : undefined}
        />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalValue}>{formatCurrency(payableTotal)}</Text>
        </View>
        <Button
          title={isProcessing ? 'Processing...' : 'Place Order'}
          variant="primary"
          size="large"
          onPress={handlePlaceOrder}
          loading={isProcessing || isLoading}
          disabled={!selectedAddress || isProcessing || isLoading}
          style={[styles.placeOrderButton, { backgroundColor: '#4DC8D1' }]}
        />
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Icon name="check-circle" size={80} color={COLORS.success} />
            </View>
            <Text style={styles.successTitle}>{successData.title}</Text>
            <Text style={styles.successMessage}>{successData.message}</Text>
            <Button 
              title="View Order Details" 
              variant="primary" 
              fullWidth 
              onPress={() => {
                setShowSuccessModal(false);
                dispatch(clearCart());
                navigation.reset({
                  index: 0,
                  routes: [
                    { name: 'Main' },
                    { name: 'OrderDetails', params: { orderId: successData.orderId } },
                  ],
                });
              }}
              style={styles.successButton}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  browseButton: {
    minWidth: 200,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  addNewText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.primary,
  },
  noAddressText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  addButton: {
    marginTop: SPACING.sm,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: SPACING.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
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
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
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
  discountValue: {
    color: COLORS.success,
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
    color: '#4DC8D1',
  },
  paymentButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.md,
  },
  paymentTile: {
    flex: 1,
    height: 100,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  paymentTileSelected: {
    borderColor: '#4DC8D1',
    backgroundColor: '#4DC8D1',
  },
  paymentTileDisabled: {
    opacity: 0.5,
    backgroundColor: '#F8FAFC',
  },
  paymentTileTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  paymentTileTitleSelected: {
    color: COLORS.white,
  },
  paymentTileBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.accent,
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  paymentMsgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7FE',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  paymentMsgText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  bottomTotalLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
  },
  bottomTotalValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },
  placeOrderButton: {},
    viewCouponsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
  },
  viewCouponsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  couponInputContainer: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.white,
    borderRadius: SPACING.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
  },
  couponInput: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
    height: '100%',
  },
  applyButton: {
    width: 100,
    height: 50,
    minHeight: 50,
  },
  applyButtonText: {
    fontSize: 14,
  },
  appliedCouponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7FE', // Light blue
    padding: SPACING.md,
    borderRadius: SPACING.radius.md,
    borderWidth: 1,
    borderColor: '#BEE3F8', // Blue border
    marginTop: SPACING.sm,
  },
  couponInfo: {
    flex: 1,
  },
  appliedCouponTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  appliedText: {
    color: COLORS.success,
    fontSize: 12,
  },
  couponDescription: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  removeCouponText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.error,
    marginLeft: SPACING.md,
  },
  // New Item Styles
  itemRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: SPACING.radius.sm,
    backgroundColor: COLORS.background,
    marginRight: SPACING.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  itemVariant: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  variantColorText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    marginRight: SPACING.md,
    borderRadius: SPACING.radius.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholderText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  perUnitText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  itemQty: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  successModalContent: { backgroundColor: COLORS.white, borderRadius: 24, padding: SPACING.xl, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  successIconContainer: { marginBottom: SPACING.lg, backgroundColor: COLORS.success + '15', borderRadius: 60, padding: 20 },
  successTitle: { fontSize: 24, fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm, textAlign: 'center' },
  successMessage: { fontSize: 16, fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 24 },
  successButton: { width: '100%' },
});

export default CheckoutScreen;
