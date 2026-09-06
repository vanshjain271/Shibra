import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation.types';
import { CartItem as CartItemType } from '../../types/api.types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  applyCoupon,
  clearError,
  removeCoupon,
} from '../../store/slices/cartSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { RootState } from '../../store';
import CouponModal from '../../components/cart/CouponModal';
import { couponService } from '../../services/coupon.service';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import CartItemComponent from '../../components/cart/CartItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CartNavProp = NativeStackNavigationProp<RootStackParamList, 'Cart'>;

interface CartScreenProps {
  navigation: CartNavProp;
}

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { cart, isLoading, appliedCoupon, isValidatingCoupon, error: cartError } = useAppSelector((state) => state.cart);
  const { settings } = useAppSelector((state) => state.settings);

  const [refreshing, setRefreshing] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [couponCode, setCouponCode] = useState('');
  const [isCouponModalVisible, setIsCouponModalVisible] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  // Show errors from coupon validation
  useEffect(() => {
    if (cartError) {
      Alert.alert('Error', cartError, [{ text: 'OK', onPress: () => dispatch(clearError()) }]);
    }
  }, [cartError]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    await dispatch(fetchCart());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCart();
    setRefreshing(false);
  };

  // Load available coupons for teaser
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const coupons = await couponService.getActiveCoupons();
        setAvailableCoupons(coupons);
      } catch (err) {
        console.log('Failed to fetch coupons for teaser');
      }
    };
    fetchCoupons();
  }, []);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await dispatch(updateCartItem({ itemId, quantity }));
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleApplyCoupon = async (codeToApply: string = couponCode): Promise<boolean> => {
    if (!codeToApply.trim()) return false;
    try {
      await dispatch(applyCoupon({ code: codeToApply.trim(), total: Number(cart?.subtotal || 0) })).unwrap();
      setCouponCode('');
      return true;
    } catch (error: any) {
      Alert.alert('Error', error || 'Invalid coupon code');
      return false;
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => dispatch(removeFromCart(itemId)),
      },
    ]);
  };

  if (isLoading && !cart) {
    return (
      <View style={styles.container}>
        <LoadingSkeleton type="cart" count={3} />
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <EmptyState
          icon="🛒"
          title="Your Cart is Empty"
          description="Add some products to your cart to get started"
          actionLabel="Browse Products"
          onAction={() => navigation.navigate('Main', { screen: 'Home' } as any)}
        />
      </SafeAreaView>
    );
  }

  const minAmount = Number(settings?.minOrderAmount || 3000);
  const subtotal = Number(cart.subtotal || 0);
  const isBelowMin = subtotal < minAmount;

  const totalSavings = cart.items.reduce((sum, item) => {
    const product = item.product as any;
    if (product && product.mrp > product.salePrice) {
      return sum + (product.mrp - product.salePrice) * item.quantity;
    }
    return sum;
  }, 0);

  const deliveryThreshold = settings?.freeDeliveryThreshold || 5000;
  const deliveryCharge = subtotal >= deliveryThreshold ? 0 : (settings?.deliveryFee || 299);
  const freeShipProgress = Math.max(0, deliveryThreshold - subtotal);
  
  let discountAmount = 0;
  if (appliedCoupon && subtotal >= Number(appliedCoupon.minOrderAmount || 0)) {
    if (appliedCoupon.type === 'PERCENTAGE') {
      discountAmount = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscountAmount);
      }
    } else {
      discountAmount = appliedCoupon.value;
    }
  }
  const payable = Math.max(0, subtotal + deliveryCharge - discountAmount);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {isBelowMin && (
          <View style={styles.warningBanner}>
            <View style={styles.warningIconCircle}>
              <Icon name="alert-outline" size={24} color="#DC2626" />
            </View>
            <Text style={styles.warningText}>
              Sorry!, We are taking Delivery Orders above <Text style={styles.boldText}>₹{minAmount.toFixed(2)}</Text>
            </Text>
          </View>
        )}

        <View style={styles.itemSection}>
          <Text style={styles.sectionHeading}>Item ({cart.items.length})</Text>
          {cart.items.map((item) => (
            <CartItemComponent
              key={item._id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
              onPressProduct={(productId: string) => navigation.navigate('ProductDetails', { productId })}
              loading={updatingItems.has(item._id)}
            />
          ))}
        </View>

        <View style={styles.couponSection}>
          <Text style={styles.sectionHeading}>Offers & Coupons</Text>
          {appliedCoupon && subtotal >= Number(appliedCoupon.minOrderAmount || 0) ? (
            <View style={styles.appliedCouponCard}>
              <View style={styles.appliedCouponLeft}>
                <Icon name="check-circle" size={24} color={COLORS.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.appliedCouponCode}>{appliedCoupon.code}</Text>
                  <Text style={styles.appliedCouponDesc}>
                    {appliedCoupon.type === 'PERCENTAGE' ? `${appliedCoupon.value}% OFF` : `₹${appliedCoupon.value} OFF`} applied
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon} style={{ padding: 4 }}>
                <Icon name="trash-can-outline" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {availableCoupons && availableCoupons.length > 0 && (
                (() => {
                  // Find the closest coupon the user is eligible for or close to eligible for
                  const sorted = [...availableCoupons].sort((a, b) => a.minOrderAmount - b.minOrderAmount);
                  const applicable = sorted.filter(c => subtotal >= c.minOrderAmount);
                  const notApplicable = sorted.filter(c => subtotal < c.minOrderAmount);
                  const teaserCoupon = applicable.length > 0 ? applicable[applicable.length - 1] : notApplicable[0];
                  
                  if (teaserCoupon) {
                    const isApplicable = subtotal >= teaserCoupon.minOrderAmount;
                    const amountNeeded = teaserCoupon.minOrderAmount - subtotal;
                    const discountStr = teaserCoupon.type === 'PERCENTAGE' ? `${teaserCoupon.value}% OFF` : `₹${teaserCoupon.value} OFF`;
                    return (
                      <View style={{ marginBottom: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: isApplicable ? '#ECFDF5' : '#FFFBEB', borderRadius: 8, borderWidth: 1, borderColor: isApplicable ? '#10B981' : '#FBBF24', flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name={isApplicable ? "check-circle" : "information"} size={20} color={isApplicable ? "#10B981" : "#F59E0B"} />
                        <Text style={{ marginLeft: 8, flex: 1, fontSize: 13, color: '#334155', fontWeight: '500' }}>
                          {isApplicable 
                            ? `You can save ${discountStr} with code ${teaserCoupon.code}!` 
                            : `Add items worth ₹${amountNeeded.toLocaleString('en-IN')} more to get ${discountStr} with ${teaserCoupon.code}`}
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()
              )}
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
            </View>
          )}
        </View>
        
        <CouponModal
          visible={isCouponModalVisible}
          onClose={() => setIsCouponModalVisible(false)}
          cartTotal={Number(cart?.subtotal || 0)}
          onApplyCoupon={handleApplyCoupon}
          appliedCouponCode={(appliedCoupon && subtotal >= Number(appliedCoupon.minOrderAmount || 0)) ? appliedCoupon.code : undefined}
        />
        <View style={styles.divider} />

        <View style={styles.billDetailsSection}>
          <Text style={styles.sectionHeading}>Bill Details</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Sub Total</Text>
              <Text style={styles.billValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.rowDivider} />
            
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tax</Text>
              <Text style={styles.billValue}>₹0</Text>
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.billRow}>
              <View>
                <Text style={styles.billLabel}>Delivery Charge</Text>
                {freeShipProgress > 0 && (
                  <Text style={styles.deliverySublabel}>
                    Shop for ₹{freeShipProgress.toFixed(2)} more for free delivery
                  </Text>
                )}
              </View>
              <Text style={styles.billValue}>₹{deliveryCharge}</Text>
            </View>
            <View style={styles.rowDivider} />

            {appliedCoupon && subtotal >= Number(appliedCoupon.minOrderAmount || 0) && (
              <>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Discount ({appliedCoupon.code})</Text>
                  <Text style={[styles.billValue, { color: COLORS.primary }]}>- ₹{discountAmount.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.rowDivider} />
              </>
            )}

            <View style={[styles.billRow, { marginBottom: 0 }]}>
              <Text style={styles.payableLabel}>Payable</Text>
              <Text style={styles.payableValue}>
                ₹{payable.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {totalSavings > 0 && (
          <View style={styles.savingsBanner}>
            <View style={styles.savingsIconCircle}>
              <Icon name="check" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.savingsText}>
              ₹{Math.round(totalSavings).toLocaleString('en-IN')} saved so far on this order
            </Text>
          </View>
        )}

        {settings?.cartNote ? (
          <View style={styles.cartNoteContainer}>
            <View style={styles.cartNoteHeader}>
              <Icon name="shield-check" size={24} color="#D97706" />
              <Text style={styles.cartNoteTitle}>IMPORTANT NOTICE</Text>
            </View>
            <View style={styles.cartNoteDivider} />
            <Text style={styles.cartNoteText}>
              {settings.cartNote.replace(/✦\s*IMPORTANT NOTICE\s*✦/gi, '').trim()}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={[styles.footerBtn, styles.addMoreBtn]}
            onPress={() => navigation.navigate('Main', { screen: 'Home' } as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.footerBtnText}>Add More</Text>
          </TouchableOpacity>

          {!isBelowMin && (
            <TouchableOpacity
              style={[styles.footerBtn, styles.checkoutBtn]}
              onPress={() => navigation.navigate('Checkout')}
              activeOpacity={0.8}
            >
              <Text style={[styles.footerBtnText, styles.checkoutBtnText]}>Checkout</Text>
              <Icon name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  warningBanner: {
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
  },
  warningIconCircle: {
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  boldText: {
    fontWeight: '700',
  },
  savingsBanner: {
    backgroundColor: COLORS.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  savingsIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  savingsText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  itemSection: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: 16,
  },
  couponSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
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
  couponInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  couponInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
  },
  applyBtn: {
    height: 48,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  applyBtnText: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 15,
  },
  appliedCouponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primarySoft,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  appliedCouponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedCouponCode: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },
  appliedCouponDesc: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  removeCouponText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  billDetailsSection: {
    padding: 16,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  billLabel: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  deliverySublabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  billValue: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  payableLabel: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  payableValue: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkoutBtn: {
    backgroundColor: '#4DC8D1', // Brand Light Blue
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
  },
  cartNoteContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cartNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cartNoteTitle: {
    fontSize: 16,
    color: '#D97706',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  cartNoteDivider: {
    height: 1,
    backgroundColor: '#FDE68A',
    marginBottom: 12,
  },
  cartNoteText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 24,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
});

export default CartScreen;