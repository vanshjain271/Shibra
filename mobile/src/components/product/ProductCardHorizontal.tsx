import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Product } from '../../types/api.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToCart, updateCartItem, removeFromCart } from '../../store/slices/cartSlice';

export interface ProductCardHorizontalProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
}

const ProductCardHorizontal: React.FC<ProductCardHorizontalProps> = ({
  product,
  onPress,
  onAddToCart,
}) => {
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
      // ignore
    } finally {
      setAdding(false);
    }
  };

  const handleIncrease = async () => {
    if (!cartItemId || updating) return;
    setUpdating(true);
    try {
      await dispatch(
        updateCartItem({ itemId: cartItemId, quantity: cartQty + 1 })
      ).unwrap();
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
  };

  const handleDecrease = async () => {
    if (!cartItemId || updating) return;
    setUpdating(true);
    try {
      if (cartQty <= 1) {
        await dispatch(removeFromCart(cartItemId)).unwrap();
      } else {
        await dispatch(
          updateCartItem({ itemId: cartItemId, quantity: cartQty - 1 })
        ).unwrap();
      }
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
  };

  const handleQtySubmit = async () => {
    Keyboard.dismiss();
    setIsFocused(false);
    const newQty = parseInt(localQty, 10);
    if (isNaN(newQty) || newQty === cartQty) {
      setLocalQty(String(cartQty));
      return;
    }
    if (newQty < 1) {
      if (cartItemId) await dispatch(removeFromCart(cartItemId)).unwrap();
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
      activeOpacity={0.85}
      style={styles.container}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {product.images && product.images.length > 0 ? (
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

        {/* Discount Badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

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
            Minimum Order Quantity is {product.minOrderQty || 1} pcs
          </Text>
        </View>

        {/* ── Cart control ── */}
        {inStock ? (
          cartQty > 0 ? (
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
            // Initial ADD button
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
                <View style={styles.addButtonInner}>
                  {!product.hasVariants && <Icon name="plus" size={14} color={COLORS.white} />}
                  <Text style={styles.addButtonText}>{product.hasVariants ? 'OPTIONS' : 'ADD'}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    marginRight: 12,
    backgroundColor: COLORS.white,
    borderRadius: SPACING.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 4, // for shadow
  },
  imageContainer: {
    width: '100%',
    height: 140,
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
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.border,
    letterSpacing: 2,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
    fontWeight: '700',
  },
  infoContainer: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 17,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  salePrice: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginRight: 6,
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
    marginBottom: 8,
  },
  moqText: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    borderRadius: SPACING.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  addButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 4,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  qtyText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  qtyInput: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    padding: 0,
    height: '100%',
  },
});

export default ProductCardHorizontal;
