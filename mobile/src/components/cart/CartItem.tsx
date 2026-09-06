/**
 * CartItem Component
 * 
 * Displays cart item with quantity controls and remove option
 * High-density B2B interface for cart management
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CartItem as CartItemType } from '../../types/api.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Card from '../ui/Card';

export interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onPressProduct?: (productId: string) => void;
  loading?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove, onPressProduct, loading }) => {
  const [localQuantity, setLocalQuantity] = useState(String(item.quantity));
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Sync local quantity with item quantity whenever item changes
  // but ONLY if the user isn't currently typing (focused)
  React.useEffect(() => {
    if (!isFocused) {
      setLocalQuantity(String(item.quantity));
    }
  }, [item.quantity, isFocused]);

  const product = item.product as any; // Cast for potential missing types
  const subtotal = item.price * item.quantity;
  const imageSource = product?.image || (product?.images && product.images.length > 0 ? product.images[0] : null);

  const handleQuantitySubmit = async () => {
    Keyboard.dismiss();
    setIsFocused(false);
    let newQuantity = parseInt(localQuantity, 10);
    const step = product?.minOrderQty || 1;
    if (!isNaN(newQuantity)) {
      if (newQuantity < step) newQuantity = step;
      else {
        const remainder = newQuantity % step;
        if (remainder !== 0) {
          newQuantity = Math.round(newQuantity / step) * step;
          if (newQuantity === 0) newQuantity = step;
        }
      }
    }
    
    if (isNaN(newQuantity)) {
      setLocalQuantity(String(item.quantity));
      return;
    }

    if (newQuantity === item.quantity) return;

    if (newQuantity < 1) {
      onRemove(item._id);
      return;
    }

    setIsUpdating(true);
    await onUpdateQuantity(item._id, newQuantity);
    setLocalQuantity(String(newQuantity));
    setIsUpdating(false);
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      onRemove(item._id);
      return;
    }

    setLocalQuantity(String(newQuantity));
    setIsUpdating(true);
    await onUpdateQuantity(item._id, newQuantity);
    setIsUpdating(false);
  };

  const handleRemove = () => {
    onRemove(item._id);
  };

  return (
    <View style={styles.container}>
      {/* Product Image */}
      <TouchableOpacity 
        style={styles.imageContainer}
        onPress={() => onPressProduct?.(product._id)}
        activeOpacity={0.7}
      >
        {imageSource ? (
          <FastImage
            source={{ uri: imageSource, priority: FastImage.priority.normal }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.contain}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>YQ</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Product Info & Actions */}
      <View style={styles.contentContainer}>
        <View style={styles.headerInfo}>
          <View style={styles.nameCol}>
            <TouchableOpacity onPress={() => onPressProduct?.(product?._id)} activeOpacity={0.7}>
              <Text style={styles.productName} numberOfLines={2}>
                {product?.name || 'Product'}
              </Text>
            </TouchableOpacity>
            {item.variant ? (
              <>
                <Text style={styles.variantText}>
                  {item.variant.name || product?.name || 'Variant'}
                </Text>
                {!!item.variant.color && item.variant.color !== item.variant.name && (
                  <Text style={styles.variantText}>
                    Color: {item.variant.color}
                  </Text>
                )}
              </>
            ) : null}
            <TouchableOpacity onPress={handleRemove} activeOpacity={0.6} style={{ padding: 4 }}>
              <Icon name="trash-can-outline" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.priceCol}>
            <Text style={styles.itemTotal}>₹{item.price.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Quantity Selector - Teal Style */}
        <View style={styles.quantityWrapper}>
          <View style={styles.tealCounter}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => handleQuantityChange(parseInt(localQuantity, 10) - (product?.minOrderQty || 1))}
              disabled={isUpdating || loading || parseInt(localQuantity, 10) <= (product?.minOrderQty || 1)}
            >
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>

            <View style={styles.quantityDisplay}>
              {isUpdating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <TextInput
                  style={styles.quantityInput}
                  value={isFocused ? localQuantity : String(item.quantity)}
                  onChangeText={setLocalQuantity}
                  onFocus={() => setIsFocused(true)}
                  keyboardType="numeric"
                  onBlur={handleQuantitySubmit}
                  onSubmitEditing={handleQuantitySubmit}
                  selectTextOnFocus
                />
              )}
            </View>

            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => handleQuantityChange(parseInt(localQuantity, 10) + (product?.minOrderQty || 1))}
              disabled={isUpdating || loading}
            >
              <Text style={styles.counterBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  imageContainer: {
    width: 60,
    height: 60,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameCol: {
    flex: 1,
    paddingRight: 10,
  },
  productName: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  variantText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginBottom: 4,
  },
  removeBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginTop: 4,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  quantityWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  tealCounter: {
    flexDirection: 'row',
    backgroundColor: '#4DC8D1', // Mokup Teal
    borderRadius: 4,
    height: 32,
    width: 110,
    alignItems: 'center',
    overflow: 'hidden',
  },
  counterBtn: {
    width: 32,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  quantityDisplay: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  quantityInput: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    padding: 0, // Reset default Android padding
  },
  dotText: {
    color: COLORS.white,
    fontSize: 8,
    letterSpacing: 1,
    opacity: 0.8,
  },
});

export default CartItem;
