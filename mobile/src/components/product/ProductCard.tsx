/**
 * ProductCard — Square grid card with inline +/- quantity control
 *
 * UX:
 *  - Tap "ADD" → immediately shows [ − 1 + ] counter (no alert)
 *  - Tap + / − to update quantity on backend silently
 *  - Tap − when qty=1 removes item from cart
 *  - Out of stock shows greyed overlay
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Keyboard,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Product } from '../../types/api.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToCart, updateCartItem, removeFromCart, optimisticUpdateItem } from '../../store/slices/cartSlice';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 2 - SPACING.md) / 2;

export interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  if (!product) return null;

  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart.cart);
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [localQty, setLocalQty] = useState('0');
  const [isFocused, setIsFocused] = useState(false);

  // Find this product in the current cart
  const cartItem = cart?.items?.find(
    (item) => item.product?._id === product._id
  );
  const cartQty = cartItem?.quantity ?? 0;
  const cartItemId = cartItem?._id;

  const inStock = (product.stock || 0) > 0;
  const hasDiscount = (product.discountPercentage || 0) > 0;
  const discountPercentage = product.discountPercentage || 0;

  // Sync local quantity with cart quantity whenever cart changes
  // but ONLY if the user isn't currently typing (focused)
  React.useEffect(() => {
    if (!isFocused) {
      setLocalQty(String(cartQty));
    }
  }, [cartQty, isFocused]);

  const handleAdd = async () => {
    if (!inStock || adding) return;
    setAdding(true);
    try {
      await dispatch(
        addToCart({ productId: product._id, quantity: product.minOrderQty || 1 })
      ).unwrap();
    } catch {
      // silently fail — user sees no stock overlay
    } finally {
      setAdding(false);
    }
  };

  const handleIncrease = () => {
    if (!cartItemId) return;
    const step = product.minOrderQty || 1;
    // Optimistic update: show new count instantly
    dispatch(optimisticUpdateItem({ itemId: cartItemId, delta: step }));
    // Background sync with server
    dispatch(updateCartItem({ itemId: cartItemId, quantity: cartQty + step })).catch(() => {
      // On error, revert by fetching fresh cart
    });
  };

  const handleDecrease = () => {
    if (!cartItemId) return;
    const step = product.minOrderQty || 1;
    // Optimistic update: show new count instantly
    dispatch(optimisticUpdateItem({ itemId: cartItemId, delta: -step }));
    // Background sync with server
    if (cartQty <= step) {
      dispatch(removeFromCart(cartItemId)).catch(() => {});
    } else {
      dispatch(updateCartItem({ itemId: cartItemId, quantity: cartQty - step })).catch(() => {});
    }
  };

  const handleQtySubmit = async () => {
    Keyboard.dismiss();
    setIsFocused(false);
    let newQty = parseInt(localQty, 10);
    
    if (isNaN(newQty)) {
      setLocalQty(String(cartQty));
      return;
    }

    const step = product.minOrderQty || 1;
    
    if (newQty < step) {
      if (newQty === 0 && cartItemId) {
        await dispatch(removeFromCart(cartItemId)).unwrap();
        return;
      }
      newQty = step;
    } else {
      // Snap to nearest multiple
      const remainder = newQty % step;
      if (remainder !== 0) {
        newQty = Math.round(newQty / step) * step;
        if (newQty === 0) newQty = step;
      }
    }

    if (newQty === cartQty) {
      setLocalQty(String(cartQty));
      return;
    }

    if (cartItemId) {
      setUpdating(true);
      try {
        await dispatch(updateCartItem({ itemId: cartItemId, quantity: newQty })).unwrap();
      } catch {
        setLocalQty(String(cartQty));
      } finally {
        setUpdating(false);
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={styles.container}
    >
      {/* ── Image ── */}
      <View style={styles.imageContainer}>
        {product.images?.length > 0 ? (
          <FastImage
            source={{ uri: product.images[0], priority: FastImage.priority.high }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.contain}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>YQ</Text>
          </View>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
          </View>
        )}

        {/* Out of stock overlay */}
        {!inStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      {/* ── Info ── */}
      <View style={styles.infoContainer}>
        {/* Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            {/* Price row */}
            <View style={styles.priceRow}>
              <Text style={styles.salePrice}>₹{product.salePrice.toLocaleString('en-IN')}</Text>
              {hasDiscount && (
                <Text style={styles.mrpPrice}>₹{product.mrp.toLocaleString('en-IN')}</Text>
              )}
            </View>

            {/* MOQ Tracking Row */}
            <View style={styles.moqRow}>
              <Icon name="package-variant-closed" size={12} color={COLORS.textSecondary} />
              <Text style={styles.moqText}>
                MOQ: {product.minOrderQty || 1} pcs
              </Text>
            </View>
          </View>

          {/* ── Cart control ── */}
          {inStock && (
            <View style={styles.cartControlWrapper}>
              {cartQty > 0 ? (
                // Inline +/- counter
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDecrease();
                    }}
                    activeOpacity={0.7}
                    disabled={updating}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.qtyDisplay}>
                    {updating ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <TextInput
                          style={styles.qtyInput}
                          value={isFocused ? localQty : String(cartQty)}
                          keyboardType="number-pad"
                          onChangeText={setLocalQty}
                          onFocus={() => setIsFocused(true)}
                          onBlur={handleQtySubmit}
                          onSubmitEditing={handleQtySubmit}
                          selectTextOnFocus
                          onPressIn={(e) => e.stopPropagation()}
                        />
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleIncrease();
                    }}
                    activeOpacity={0.7}
                    disabled={updating}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Initial ADD button (now just + or options icon)
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (product.hasVariants) {
                      onPress();
                    } else {
                      handleAdd();
                    }
                  }}
                  activeOpacity={0.75}
                  disabled={adding && !product.hasVariants}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {adding && !product.hasVariants ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Icon name={product.hasVariants ? "format-list-bulleted" : "plus"} size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: SPACING.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    marginBottom: SPACING.md,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // ✅ Square image
    backgroundColor: COLORS.white,
    padding: SPACING.xs,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  placeholderText: {
    fontSize: 22,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.border,
    letterSpacing: 2,
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: SPACING.radius.xs,
  },
  discountText: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
    fontWeight: '700',
  },
  outOfStockOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  outOfStockText: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  infoContainer: {
    padding: SPACING.sm,
  },
  productName: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  bottomLeft: {
    flex: 1,
    marginRight: 4,
  },
  cartControlWrapper: {
    width: 80,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  salePrice: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginRight: 5,
  },
  mrpPrice: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  moqRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moqText: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  // ── ADD button ──
  addButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: SPACING.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Quantity row ──
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: SPACING.radius.sm,
    overflow: 'hidden',
    height: 32,
    width: '100%',
  },
  qtyBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  qtyBtnText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '700',
    lineHeight: 20,
  },
  qtyDisplay: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    height: '100%',
  },
  qtyInput: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    padding: 0,
    height: '100%',
  },
});

export default ProductCard;
