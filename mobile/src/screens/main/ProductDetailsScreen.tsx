/**
 * ProductDetails Screen
 * 
 * Detailed product view with images, variants, and add to cart
 * B2B interface with WhatsApp inquiry option
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Share,
  Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from '@d11/react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProductById } from '../../store/slices/productSlice';
import { addToCart, removeFromCart, updateCartItem } from '../../store/slices/cartSlice';
import { fetchProductReviews, submitProductReview } from '../../store/slices/reviewSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ReviewItem from '../../components/ReviewItem';
import whatsappService from '../../services/whatsapp.service';

type ProductDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProductDetails'
>;
type ProductDetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;

interface ProductDetailsProps {
  navigation: ProductDetailsNavigationProp;
  route: ProductDetailsRouteProp;
}

import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

const ProductDetailsScreen: React.FC<ProductDetailsProps> = ({ navigation, route }) => {
  const { width: contentWidth } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  
  const { selectedProduct, isLoading } = useAppSelector((state) => state.products);
  const { productReviews, isLoading: isReviewsLoading } = useAppSelector((state) => state.review);
  const cart = useAppSelector((state) => state.cart);
  const { isLoading: isAddingToCart } = cart;
  const { productId } = route.params;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [variantQuantities, setVariantQuantities] = useState<Record<string, any>>({});
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (selectedProduct) {
      setQuantity(selectedProduct.minOrderQty || 1);
      
      // Add Share button to header
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => {
              Share.share({
                message: `Check out ${selectedProduct.name} on Shibra!\n\nView details: https://api.shibra.in/product/${selectedProduct._id}`,
              });
            }}
            style={{ marginRight: SPACING.md }}
          >
            <Icon name="share-variant" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )
      });
    }
  }, [selectedProduct, navigation]);

  const loadProduct = async () => {
    dispatch(fetchProductById(productId));
    dispatch(fetchProductReviews(productId));
  };
  
  // Logic remains the same ... [skipping logic for space but it should be preserved]
  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    try {
      if (selectedProduct.variants && selectedProduct.variants.length > 0) {
        let itemsProcessed = 0;
        let operationsCount = 0;

        // Check if anything needs updating
        for (const variant of selectedProduct.variants) {
          const vId = variant._id;
          const inCartItem = cart?.cart?.items?.find((item: any) => item.variant?._id === vId);
          const inCartQty = inCartItem?.quantity || 0;
          let localQty = variantQuantities[vId] !== undefined ? variantQuantities[vId] : inCartQty;
            if (localQty === "" || isNaN(localQty)) localQty = 0;
            localQty = Number(localQty);
          
          if (localQty > 0) itemsProcessed++;
          
          if (localQty > 0 && !inCartItem) operationsCount++;
          else if (localQty > 0 && inCartQty !== localQty) operationsCount++;
          else if (localQty === 0 && inCartItem) operationsCount++;
        }

        if (itemsProcessed === 0 && operationsCount === 0) {
          Alert.alert('Error', 'Please select at least one variant before adding to cart.');
          return;
        }

        if (operationsCount > 0) {
          for (const variant of selectedProduct.variants) {
            const vId = variant._id;
            const inCartItem = cart?.cart?.items?.find((item: any) => item.variant?._id === vId);
            const inCartQty = inCartItem?.quantity || 0;
            let localQty = variantQuantities[vId] !== undefined ? variantQuantities[vId] : inCartQty;
            if (localQty === "" || isNaN(localQty)) localQty = 0;
            localQty = Number(localQty);

            if (localQty > 0) {
              if (!inCartItem) {
                await dispatch(addToCart({
                  productId: selectedProduct._id,
                  variantId: vId,
                  quantity: localQty,
                })).unwrap();
              } else if (inCartQty !== localQty) {
                await dispatch(updateCartItem({
                  itemId: inCartItem._id,
                  quantity: localQty,
                })).unwrap();
              }
            } else if (localQty === 0 && inCartItem) {
              await dispatch(removeFromCart(inCartItem._id)).unwrap();
            }
          }
        }
      } else {
        // No variants, add the main product
        const inCartItem = cart?.cart?.items?.find((item: any) => item.product?._id === selectedProduct._id);
        const inCartQty = inCartItem?.quantity || 0;
        
        if (quantity > 0) {
          if (!inCartItem) {
            await dispatch(addToCart({
              productId: selectedProduct._id,
              quantity,
            })).unwrap();
          } else if (inCartQty !== quantity) {
            await dispatch(updateCartItem({
              itemId: inCartItem._id,
              quantity,
            })).unwrap();
          }
        } else if (quantity === 0 && inCartItem) {
          await dispatch(removeFromCart(inCartItem._id)).unwrap();
        } else {
          Alert.alert('Error', 'Please select a valid quantity.');
          return;
        }
      }

      Alert.alert(
        'Success', 
        'Cart updated successfully!',
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => navigation.navigate('Cart' as never) }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error || 'Something went wrong. Please try again.');
    }
  };

  const handleWhatsAppInquiry = () => {
    if (selectedProduct) whatsappService.openProductInquiry(selectedProduct);
  };

  const handleQuantityChange = (delta: number) => {
    const step = selectedProduct?.minOrderQty || 1;
    const newQuantity = quantity + (delta * step);
    if (newQuantity >= step && newQuantity <= (selectedProduct?.stock || 999)) {
      setQuantity(newQuantity);
    }
  };

  const handleVariantQuantityChange = (variantId: string, delta: number, stock: number) => {
    const step = selectedProduct?.minOrderQty || 1;
    setVariantQuantities(prev => {
      const inCartQty = cart?.cart?.items?.find((item: any) => item.variant?._id === variantId)?.quantity || 0;
      let currentQty = prev[variantId] !== undefined ? prev[variantId] : inCartQty;
      if (currentQty === "" || isNaN(currentQty)) currentQty = 0;
      // If we are at 0 and want to increase, we jump to step (e.g. minOrderQty)
      let newQty = currentQty;
      if (currentQty === 0 && delta > 0) {
        newQty = step;
      } else {
        newQty = currentQty + (delta * step);
      }
      
      // If newQty falls below minOrderQty, drop all the way back to 0 to remove it
      if (newQty < step) newQty = 0;
      else if (newQty > (stock || 999)) newQty = stock || 999;
      
      return { ...prev, [variantId]: newQty };
    });
  };

  const handleVariantQuantityInput = (variantId: string, text: string, stock: number) => {
    setVariantQuantities(prev => {
      if (text === "") {
        return { ...prev, [variantId]: "" };
      }
      const newQty = parseInt(text, 10);
      if (!isNaN(newQty)) {
        return { ...prev, [variantId]: Math.min(newQty, stock || 9999) };
      }
      return prev;
    });
  };

  const handleVariantQuantityBlur = (variantId: string) => {
    const step = selectedProduct?.minOrderQty || 1;
    setVariantQuantities(prev => {
      let val = prev[variantId];
      if (val === "" || val === undefined) val = 0;
      if (val === 0) return { ...prev, [variantId]: 0 };
      if (val < step) {
        val = step;
      } else {
        const remainder = val % step;
        if (remainder !== 0) {
          val = Math.round(val / step) * step;
          if (val === 0) val = step;
        }
      }
      return { ...prev, [variantId]: val };
    });
  };

  const getPriceForQuantity = (basePrice: number, qty: number) => {
    if (!product || !product.bulkPricing || product.bulkPricing.length === 0) return basePrice;
    const sortedTiers = [...product.bulkPricing].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sortedTiers) {
      if (qty >= tier.minQty) return tier.salePrice;
    }
    return basePrice;
  };

  const getCurrentPrice = () => {
    return getPriceForQuantity(product?.salePrice || 0, quantity);
  };

  const handleOpenReviewModal = () => {
    setReviewRating(5);
    setReviewComment('');
    setIsReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      Alert.alert('Error', 'Please enter a comment for your review.');
      return;
    }
    try {
      const resultAction = await dispatch(submitProductReview({
        productId: productId,
        rating: reviewRating,
        comment: reviewComment,
      }));
      if (submitProductReview.fulfilled.match(resultAction)) {
        setIsReviewModalVisible(false);
        setTimeout(() => {
          Alert.alert('Success', 'Thank you for your review!');
        }, 500);
      } else {
        Alert.alert('Error', resultAction.payload as string || 'Failed to submit review');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  if (isLoading || !selectedProduct) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  const product = selectedProduct;
  const hasDiscount = product.mrp > product.salePrice;
  const discountPercentage = hasDiscount
    ? Math.round(((product.mrp - product.salePrice) / product.mrp) * 100)
    : 0;
  const inStock = (product.stock || 0) > 0;
  const images = product.images && product.images.length > 0 ? product.images : [];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageSection}>
          {images.length > 0 ? (
            <>
              <ScrollView 
                ref={scrollViewRef}
                horizontal 
                pagingEnabled 
                snapToInterval={contentWidth}
                snapToAlignment="center"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const page = Math.round(e.nativeEvent.contentOffset.x / contentWidth);
                  if (page !== selectedImageIndex) setSelectedImageIndex(page);
                }}
              >
                {images.map((img, i) => (
                  <View key={i} style={{ width: contentWidth }}>
                    <FastImage
                      source={{ uri: img, priority: FastImage.priority.high }}
                      style={styles.mainImage}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                  </View>
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              {images.length > 1 && (
                <View style={styles.paginationContainer}>
                  {images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        selectedImageIndex === index && styles.paginationDotActive
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* YouTube Watch Video Button */}
              {product.youtubeUrl && product.youtubeUrl.trim() !== '' && (
                <TouchableOpacity 
                  style={{ position: 'absolute', bottom: images.length > 1 ? 40 : 16, right: 16, backgroundColor: 'rgba(255,255,255,0.95)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}
                  onPress={() => Linking.openURL(product.youtubeUrl!)}
                >
                  <Icon name="youtube" size={24} color="#FF0000" />
                  <Text style={{ marginLeft: 6, color: '#333', fontWeight: 'bold', fontSize: 13 }}>Watch Video</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No Image Available</Text>
              {product.youtubeUrl && product.youtubeUrl.trim() !== '' && (
                <TouchableOpacity 
                  style={{ position: 'relative', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.95)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}
                  onPress={() => Linking.openURL(product.youtubeUrl!)}
                >
                  <Icon name="youtube" size={24} color="#FF0000" />
                  <Text style={{ marginLeft: 6, color: '#333', fontWeight: 'bold', fontSize: 13 }}>Watch Video</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoCard}>
          <Text style={styles.productName}>{product.name}</Text>
          {product.sku && <Text style={styles.sku}>SKU: {product.sku}</Text>}

          <View style={styles.priceContainer}>
            <Text style={styles.salePrice}>₹{getCurrentPrice().toFixed(2)}</Text>
            {hasDiscount && (
              <>
                <Text style={styles.mrp}>₹{product.mrp.toFixed(2)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
                </View>
              </>
            )}
          </View>

          {/* MOQ Tracking Row */}
          <View style={styles.moqRow}>
            <Icon name="package-variant-closed" size={16} color={COLORS.textSecondary} />
            <Text style={styles.moqText}>
              Minimum Order Quantity is {product.minOrderQty || 1} pcs
            </Text>
          </View>

          <Text style={[styles.stockStatus, !inStock && styles.outOfStock]}>
            {inStock ? (product.stock! < 10 ? `Only ${product.stock} left in stock` : 'In Stock') : 'Out of Stock'}
          </Text>

          {/* Bulk Pricing Section */}
          {product.bulkPricing && product.bulkPricing.length > 0 && (
            <View style={styles.bulkPricingBox}>
              <View style={styles.bulkHeader}>
                <Icon name="tag-multiple" size={20} color={COLORS.accent} />
                <Text style={styles.bulkHeaderText}>Special Bulk Pricing</Text>
              </View>
              {product.bulkPricing.map((tier, idx) => (
                <View key={idx} style={styles.bulkTierRow}>
                  <View style={styles.bulkTierDot} />
                  <Text style={styles.bulkTierText}>
                    Buy <Text style={styles.bulkHighlight}>{tier.minQty}+</Text> units at 
                    <Text style={styles.bulkHighlight}> ₹{tier.salePrice.toFixed(2)}</Text> each
                  </Text>
                </View>
              ))}
            </View>
          )}

          {product.warranty && product.warranty.trim() !== '' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Warranty</Text>
              <Text style={styles.descriptionText}>{product.warranty}</Text>
            </View>
          )}

          {/* Description - FIXED HTML Rendering */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <RenderHtml
                contentWidth={contentWidth - 64}
                source={{ html: product.description }}
                tagsStyles={{
                  p: { color: COLORS.textSecondary, marginBottom: 8, fontSize: 15, lineHeight: 22 },
                  li: { color: COLORS.textSecondary, marginBottom: 4, fontSize: 15, lineHeight: 22 },
                  strong: { color: COLORS.textPrimary, fontWeight: 'bold' },
                  b: { color: COLORS.textPrimary, fontWeight: 'bold' },
                  em: { fontStyle: 'italic' },
                  i: { fontStyle: 'italic' },
                  u: { textDecorationLine: 'underline' },
                  h1: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold', marginVertical: 8 },
                  h2: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginVertical: 6 },
                  h3: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold', marginVertical: 4 },
                }}
              />
            </View>
          )}

          {/* Available Variants — REDESIGNED LIST */}
          {product.variants && product.variants.length > 0 && (
            <View style={styles.section}>
              <View style={styles.variantHeaderRow}>
                <Text style={styles.sectionTitle}>Available Variants</Text>
                <TouchableOpacity onPress={() => {/* Toggle Expand if needed */}}>
                  <Text style={styles.showMoreText}>Show more</Text>
                </TouchableOpacity>
              </View>
                     <View style={styles.variantList}>
                {product.variants.map((variant, index) => {
                  const inCartQty = cart?.cart?.items?.find((item: any) => item.variant?._id === variant._id)?.quantity || 0;
                  const rawQty = variantQuantities[variant._id] !== undefined ? variantQuantities[variant._id] : inCartQty;
                  const variantQty = rawQty === "" ? 0 : rawQty;
                  const displayQty = rawQty;
                  const variantPrice = getPriceForQuantity(variant.salePrice, variantQty > 0 ? variantQty : (product.minOrderQty || 1));
                  
                  return (
                  <View 
                    key={variant._id} 
                    style={[
                      styles.variantCard, 
                      selectedVariant === variant._id && styles.variantCardActive,
                      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
                    ]}
                  >
                    <View style={[styles.variantCardLeft, { flex: 1 }]}>
                      <View style={styles.variantInfo}>
                        <Text style={styles.variantName} numberOfLines={1}>
                          {variant.name || product.name}
                        </Text>
                        {!!variant.color && variant.color !== variant.name && (
                          <Text style={styles.variantColorText} numberOfLines={1}>
                            Color: {variant.color}
                          </Text>
                        )}
                        <Text style={styles.variantDetailsPrice}>
                          ₹{variantPrice.toFixed(2)} / {product.unit || 'Pcs'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={{ marginLeft: SPACING.md }}>
                      {rawQty !== 0 ? (
                        <View style={[styles.variantQuantityContainer, { borderColor: COLORS.accent, overflow: 'hidden' }]}>
                          <TouchableOpacity 
                            style={[styles.variantQtyButton, { backgroundColor: COLORS.accent }]} 
                            onPress={() => handleVariantQuantityChange(variant._id, -1, variant.stock || 999)}
                          >
                            <Text style={[styles.variantQtyButtonText, { color: COLORS.white }]}>−</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.variantQtyInput, { paddingHorizontal: 4, minWidth: 36 }]}
                            value={String(displayQty)}
                            keyboardType="number-pad"
                            onChangeText={(text) => handleVariantQuantityInput(variant._id, text, variant.stock || 999)}
                            onBlur={() => handleVariantQuantityBlur(variant._id)}
                            selectTextOnFocus
                          />
                          <TouchableOpacity 
                            style={[styles.variantQtyButton, { backgroundColor: COLORS.accent }]} 
                            onPress={() => handleVariantQuantityChange(variant._id, 1, variant.stock || 999)}
                          >
                            <Text style={[styles.variantQtyButtonText, { color: COLORS.white }]}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={[styles.variantAddButton, { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, backgroundColor: COLORS.accent }]}
                          onPress={() => {
                            setSelectedVariant(variant._id);
                            handleVariantQuantityChange(variant._id, 1, variant.stock || 999);
                          }}
                        >
                          <Icon name="plus" size={18} color={COLORS.white} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  )})}
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          {inStock && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity 
                  style={styles.quantityButton} 
                  onPress={() => handleQuantityChange(-1)} 
                  disabled={quantity <= (product.minOrderQty || 1)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={String(quantity)}
                  keyboardType="number-pad"
                  onChangeText={(text) => {
                    const newQty = parseInt(text, 10);
                    if (!isNaN(newQty)) {
                      setQuantity(Math.min(newQty, product.stock || 9999));
                    } else if (text === "") {
                      setQuantity(0);
                    }
                  }}
                  onBlur={() => {
                    const step = product.minOrderQty || 1;
                    let val = quantity;
                    if (val < step) {
                      val = step;
                    } else {
                      const remainder = val % step;
                      if (remainder !== 0) {
                        val = Math.round(val / step) * step;
                        if (val === 0) val = step;
                      }
                    }
                    setQuantity(val);
                  }}
                  selectTextOnFocus
                />
                <TouchableOpacity 
                  style={styles.quantityButton} 
                  onPress={() => handleQuantityChange(1)} 
                  disabled={quantity >= (product.stock || 999)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Product Reviews */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              <Text style={styles.reviewCount}>({productReviews.length})</Text>
            </View>
            {isReviewsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
            ) : productReviews.length > 0 ? (
              <View style={styles.reviewList}>
                {productReviews.slice(0, 3).map((review) => <ReviewItem key={review._id} review={review} />)}
                {productReviews.length > 3 && (
                  <Button title="Read All Reviews" variant="ghost" size="small" onPress={() => navigation.navigate('AllReviews', { productId: product._id, productName: product.name })} style={styles.viewAllReviews} />
                )}
                <Button title="Write a Review" variant="outline" size="small" onPress={handleOpenReviewModal} style={styles.addReviewButton} />
              </View>
            ) : (
              <View style={styles.emptyReviews}>
                <Text style={styles.emptyReviewsText}>No reviews yet. Be the first to review this product!</Text>
                <Button title="Write a Review" variant="outline" size="small" onPress={handleOpenReviewModal} style={styles.addReviewButton} />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, SPACING.md) }]}>
        <Button 
          title="WhatsApp Inquiry" 
          variant="outline" 
          icon={<Icon name="whatsapp" size={20} color="#25D366" />}
          onPress={handleWhatsAppInquiry} 
          style={[styles.whatsappButton, { borderColor: '#25D366' }]} 
          textStyle={{ color: '#25D366', fontWeight: 'bold' }}
        />
        {inStock && <Button title="Add to Cart" variant="primary" onPress={handleAddToCart} loading={isAddingToCart} style={styles.addToCartButton} />}
      </View>

      {/* Review Modal - FIXED Contrast */}
      <Modal visible={isReviewModalVisible} transparent animationType="slide" onRequestClose={() => setIsReviewModalVisible(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <Text style={styles.label}>Rating</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)} style={styles.starButton}>
                    <Text style={[styles.starIcon, star <= reviewRating ? styles.starIconActive : styles.starIconInactive]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Comment</Text>
              <TextInput style={styles.commentInput} placeholder="Share your thoughts about this product..." placeholderTextColor={COLORS.textSecondary} multiline numberOfLines={4} value={reviewComment} onChangeText={setReviewComment} textAlignVertical="top" />
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="ghost" onPress={() => setIsReviewModalVisible(false)} style={styles.modalCancel} />
                <Button title="Submit" variant="primary" onPress={handleSubmitReview} />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: SPACING.md, fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textSecondary },
  imageSection: { backgroundColor: COLORS.white, paddingVertical: SPACING.lg },
  mainImage: { width: '100%', height: 320 },
  imagePlaceholder: { width: '100%', height: 320, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.textSecondary },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  infoCard: { padding: SPACING.lg, backgroundColor: COLORS.white, borderTopLeftRadius: SPACING.radius.xl, borderTopRightRadius: SPACING.radius.xl, marginTop: -SPACING.lg, shadowColor: COLORS.black, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  productName: { fontSize: 22, fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textPrimary, marginBottom: SPACING.xs, fontWeight: '800' },
  sku: { fontSize: TYPOGRAPHY.fontSize.xs, fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textSecondary, marginBottom: SPACING.lg, letterSpacing: 0.5 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  salePrice: { fontSize: 26, fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.primary, marginRight: SPACING.sm, fontWeight: '800' },
  mrp: { fontSize: 16, fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textSecondary, textDecorationLine: 'line-through', marginRight: SPACING.sm },
  discountBadge: { backgroundColor: COLORS.success + '20', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: SPACING.radius.sm },
  discountText: { fontSize: 12, fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.success, fontWeight: '700' },
  moqRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  moqText: { fontSize: 13, fontFamily: TYPOGRAPHY.fontFamily.medium, color: COLORS.textSecondary, marginLeft: 6, flex: 1 },
  stockStatus: { fontSize: 13, fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.success, marginBottom: SPACING.sm },
  outOfStock: { color: COLORS.error },
  section: { marginTop: SPACING.xl },
  sectionTitle: { fontSize: 14, fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textPrimary, marginBottom: SPACING.md, letterSpacing: 0.5, fontWeight: '800' },
  descriptionText: { fontSize: 15, fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textSecondary, lineHeight: 22 },
  variantsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.xs },
  variantChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, marginRight: SPACING.sm, marginBottom: SPACING.sm, backgroundColor: COLORS.surface },
  variantChipActive: { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary },
  variantText: { fontSize: 14, fontFamily: TYPOGRAPHY.fontFamily.medium, color: COLORS.textPrimary, fontWeight: '600' },
  variantTextActive: { color: COLORS.primary },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  quantityInput: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginHorizontal: 20,
    minWidth: 40,
    textAlign: 'center',
    padding: 0,
  },
  quantityButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  quantityButtonText: { fontSize: 22, color: COLORS.textPrimary, fontWeight: '600' },
  quantityText: { fontSize: 18, fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textPrimary, marginHorizontal: 24, minWidth: 30, textAlign: 'center' },
  bottomBar: { flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  whatsappButton: { flex: 1, marginRight: SPACING.md, backgroundColor: COLORS.white },
  addToCartButton: { flex: 1 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: SPACING.md },
  reviewCount: { fontSize: 14, color: COLORS.textSecondary, marginLeft: SPACING.xs },
  reviewList: { marginTop: 0 },
  viewAllReviews: { marginTop: SPACING.sm, alignSelf: 'center' },
  emptyReviews: { paddingVertical: SPACING.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderRadius: 16, marginTop: SPACING.sm },
  emptyReviewsText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.md, paddingHorizontal: SPACING.lg },
  addReviewButton: { minHeight: 44, width: '100%', marginTop: SPACING.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: SPACING.xl, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textPrimary, marginBottom: 24, textAlign: 'center', fontWeight: '800' },
  label: { fontSize: 14, fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textPrimary, marginBottom: 12, letterSpacing: 0.5 },
  ratingContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  starButton: { padding: SPACING.xs },
  starIcon: { fontSize: 36 },
  starIconActive: { color: '#FCD34D' },
  starIconInactive: { color: COLORS.border },
  commentInput: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, height: 120, fontSize: 16, color: COLORS.textPrimary, marginBottom: 24, borderWidth: 1.5, borderColor: COLORS.border },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalCancel: { flex: 1, marginRight: SPACING.md },
  modalSubmit: { flex: 1.5 },

  // New Redesigned Variant Styles
  variantHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  showMoreText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  variantList: { gap: 12 },
  variantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primarySoft,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  variantCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft + '40',
  },
  variantCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  variantIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E6F4EA', // Light green like reference
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  variantIndexText: { fontSize: 13, fontWeight: '700', color: '#1E8E3E' },
  variantInfo: { flex: 1 },
  variantName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  variantColorText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  variantDetailsPrice: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  variantAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  variantAddText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  
  // New Variant Quantity Styles
  variantQuantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  variantQtyButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  variantQtyButtonText: { fontSize: 20, color: COLORS.textPrimary, fontWeight: '600' },
  variantQtyInput: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, minWidth: 40, textAlign: 'center', padding: 0 },
  
  // Bulk Pricing Styles
  bulkPricingBox: {
    backgroundColor: '#FFF9F2', // Light orange background
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE8CC',
    marginBottom: SPACING.md,
  },
  bulkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bulkHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  bulkTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulkTierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginRight: 10,
  },
  bulkTierText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  bulkHighlight: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});

export default ProductDetailsScreen;
