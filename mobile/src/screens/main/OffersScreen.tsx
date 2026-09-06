import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Dimensions,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackScreenProps } from '../../types/navigation.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { apiClient } from '../../services/api.service';
import { couponService } from '../../services/coupon.service';
import { Coupon } from '../../types/api.types';
import { useAppSelector } from '../../store/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OfferBanner {
  _id: string;
  title: string;
  description: string;
  image: string;
  linkType: 'PRODUCT' | 'CATEGORY' | 'URL' | 'NONE';
  linkTarget: string;
}

const OffersScreen: React.FC<RootStackScreenProps<'Offers'>> = ({ navigation }) => {
  const [offers, setOffers] = useState<OfferBanner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cartData = useAppSelector((state) => state.cart);
  const cartTotal = (cartData.cart?.items || []).reduce((total: number, item: any) => total + item.product.salePrice * item.quantity, 0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [topRes, midRes, couponsRes] = await Promise.all([
        apiClient.get('/banners?placement=HOME_TOP'),
        apiClient.get('/banners?placement=HOME_MIDDLE'),
        couponService.getActiveCoupons(),
      ]);
      
      const allBanners = [
        ...(topRes.banners || topRes.data?.banners || []),
        ...(midRes.banners || midRes.data?.banners || []),
      ];
      
      setOffers(allBanners);
      setCoupons(couponsRes || []);
    } catch (error) {
      console.error('Error fetching offers/coupons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOfferPress = (offer: OfferBanner) => {
    if (offer.linkType === 'PRODUCT' && offer.linkTarget) {
      navigation.navigate('ProductDetails', { productId: offer.linkTarget });
    } else if (offer.linkType === 'CATEGORY' && offer.linkTarget) {
      navigation.navigate('Main', { screen: 'Search', params: { categoryId: offer.linkTarget } });
    } else if (offer.linkType === 'URL' && offer.linkTarget) {
      Linking.openURL(offer.linkTarget);
    }
  };

  const renderOffer = (item: OfferBanner) => (
    <TouchableOpacity
      key={item._id}
      style={styles.offerCard}
      onPress={() => handleOfferPress(item)}
      activeOpacity={0.9}
    >
      <FastImage
        source={{ uri: item.image }}
        style={styles.offerImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.offerOverlay}>
        <View style={styles.textContainer}>
          <Text style={styles.offerTitle}>{item.title}</Text>
          {item.description ? <Text style={styles.offerDesc}>{item.description}</Text> : null}
        </View>
        <View style={styles.actionBtn}>
          <Text style={styles.actionText}>Grab Now</Text>
          <Icon name="arrow-right" size={16} color={COLORS.white} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCoupon = (item: Coupon) => {
    const isApplicable = cartTotal >= item.minOrderAmount;

    return (
      <View key={item._id} style={[styles.couponCard, !isApplicable && styles.couponCardDisabled]}>
        <View style={styles.couponHeader}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{item.code}</Text>
          </View>
        </View>
        <Text style={styles.couponDescText}>{item.description}</Text>
        <View style={styles.divider} />
        <View style={styles.requirementsRow}>
          <Icon name="information-outline" size={16} color={isApplicable ? COLORS.success : COLORS.error} />
          <Text style={[styles.requirementText, !isApplicable && styles.requirementTextError]}>
            {isApplicable 
              ? `Save on this order!` 
              : `Add items worth ₹${(item.minOrderAmount - cartTotal).toLocaleString('en-IN')} more to get ${item.type === 'PERCENTAGE' ? item.value + '%' : '₹' + item.value} OFF`}
          </Text>
        </View>
        <Text style={styles.minOrderHint}>
          Minimum order value: ₹{item.minOrderAmount.toLocaleString('en-IN')}
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Coupons</Text>
          <Text style={styles.headerSub}>Available coupons for you</Text>
        </View>
        {coupons.length > 0 ? (
          coupons.map(renderCoupon)
        ) : (
          <View style={styles.emptyContainerSmall}>
            <Text style={styles.emptyText}>No active coupons at the moment</Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exclusive Offers</Text>
          <Text style={styles.headerSub}>Handpicked deals just for you</Text>
        </View>
        {offers.length > 0 ? (
          offers.map(renderOffer)
        ) : (
          <View style={styles.emptyContainerSmall}>
            <Icon name="tag-off-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No active offers at the moment</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  offerCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: SPACING.radius.lg,
    overflow: 'hidden',
    height: 180,
    backgroundColor: COLORS.surfaceAlt,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  offerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: SPACING.lg,
    justifyContent: 'flex-end',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  offerTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  offerDesc: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.white,
    marginTop: 4,
    opacity: 0.9,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  actionText: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 12,
    marginRight: 6,
  },
  emptyContainerSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  couponCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: SPACING.radius.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  couponCardDisabled: {
    opacity: 0.7,
    backgroundColor: '#F8FAFC',
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  codeBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
  },
  codeText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#4338CA',
    fontSize: 14,
    letterSpacing: 1,
  },
  couponDescText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  requirementsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
  },
  requirementText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 12,
    color: COLORS.success,
    marginLeft: 6,
    flex: 1,
  },
  requirementTextError: {
    color: COLORS.error,
  },
  minOrderHint: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
    marginLeft: 22,
  },
});

export default OffersScreen;
