/** Version 5.1 - Final Stability Build */
/**
 * Home Screen — GoodAam-Style Dynamic Layout
 *
 * 9 scrollable sections matching the reference:
 * 1. Header: Location + Action Icons
 * 2. Search Bar
 * 3. Banner Carousel (HOME_TOP)
 * 4. Promotional Offer Cards (HOME_MIDDLE)
 * 5. Hot Category (circular)
 * 6. Direct From Brands (circular logos)
 * 7. Recommended / Hot Selling (horizontal product cards)
 * 8. Shop by Category (4-col grid with sky blue tiles)
 * 9. Featured Deals (2-col product grid)
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Linking,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FastImage from '@d11/react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CompositeNavigationProp, useScrollToTop } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts, fetchCategories, fetchBrands, fetchTrendingProducts, fetchHomepageSection } from '../../store/slices/productSlice';
import { fetchAddresses } from '../../store/slices/addressSlice';
import { Product, Category, Brand, Order } from '../../types/api.types';
import { fetchMyOrders } from '../../store/slices/orderSlice';
import { fetchSettings } from '../../store/slices/settingsSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import ProductCard from '../../components/product/ProductCard';
import ProductCardHorizontal from '../../components/product/ProductCardHorizontal';
import { apiClient } from '../../services/api.service';
import whatsappService from '../../services/whatsapp.service';
import Ticker from '../../components/ui/Ticker';
import { addToCart } from '../../store/slices/cartSlice';
import { Alert } from 'react-native';

const logo = require('../../assets/images/logo_round.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH;
const BANNER_HEIGHT = SCREEN_WIDTH * 0.55; // Reduced from 0.8 to save vertical space
const CATEGORY_TILE_SIZE = (SCREEN_WIDTH - 48) / 4;

type HomeNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// ===== SECTION HEADER COMPONENT =====
interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onViewAll }) => (
  <View style={styles.sectionHeaderRow}>
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {onViewAll && (
      <TouchableOpacity onPress={onViewAll} style={styles.viewAllBtn}>
        <Icon name="chevron-right" size={22} color={COLORS.textSecondary} />
      </TouchableOpacity>
    )}
  </View>
);

interface HomeScreenProps {
  navigation: HomeNavProp;
}

interface BannerItem {
  _id: string;
  title: string;
  image: string;
  linkType: string;
  linkTarget: string;
  placement: string;
}

const ensureAbsoluteUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = 'https://api.shibra.in/api';
  const domain = baseUrl.split('/api')[0];
  return `${domain}${url.startsWith('/') ? '' : '/'}${url}`;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { 
    products, categories, brands, 
    dynamicSections,
    isLoading, categoriesLoadedAt, brandsLoadedAt, sectionsLoadedAt
  } = useAppSelector((state) => state.products);
  const { user } = useAppSelector((state) => state.auth);
  const { addresses } = useAppSelector((state) => state.address);
  const { cart } = useAppSelector((state) => state.cart);
  const { orders } = useAppSelector((state) => state.orders);

  const [refreshing, setRefreshing] = useState(false);
  const [topBanners, setTopBanners] = useState<BannerItem[]>([]);
  const [midBanners, setMidBanners] = useState<BannerItem[]>([]);
  const [bottomBanners, setBottomBanners] = useState<BannerItem[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [activeBrandPage, setActiveBrandPage] = useState(0);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const bannerScrollRef = useRef<ScrollView>(null);
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const STALE_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Smart initial load — skips categories/brands/sections if already fresh.
   * Products and banners always reload so the home feed stays current.
   */
  const loadInitialData = async () => {
    const now = Date.now();
    const categsFresh = categoriesLoadedAt && (now - categoriesLoadedAt < 1000 * 30);
    const brandsFresh = brandsLoadedAt && (now - brandsLoadedAt < STALE_MS);
    const sectionsFresh = sectionsLoadedAt && (now - sectionsLoadedAt < STALE_MS);

    const tasks: Promise<any>[] = [
      // Products and banners always refresh
      dispatch(fetchProducts({ page: 1, limit: 20 })),
      loadBanners(),
      loadSettings(),
      dispatch(fetchSettings()),
    ];

    if (!categsFresh) tasks.push(dispatch(fetchCategories()));
    if (!brandsFresh) tasks.push(dispatch(fetchBrands()));
    if (!sectionsFresh && storeSettings?.homepageVisibilitySections) {
      storeSettings.homepageVisibilitySections.filter((s: any) => s.isActive).forEach((s: any) => {
        tasks.push(dispatch(fetchHomepageSection({ section: s.id })));
      });
    }

    // Non-critical: addresses + orders in background
    dispatch(fetchAddresses()).catch(() => {});
    dispatch(fetchMyOrders({ page: 1, limit: 10 })).catch(() => {});

    await Promise.allSettled(tasks);
  };

  const loadAllData = async () => {
    // Force-reload everything (used on pull-to-refresh)
    await Promise.allSettled([
      dispatch(fetchProducts({ page: 1, limit: 20 })),
      dispatch(fetchCategories()),
      dispatch(fetchBrands()),
      dispatch(fetchAddresses()),
      dispatch(fetchMyOrders({ page: 1, limit: 10 })),
      loadBanners(),
      loadSettings().then(settings => {
        if (settings?.homepageVisibilitySections) {
          return Promise.all(
            settings.homepageVisibilitySections
              .filter((s: any) => s.isActive)
              .map((s: any) => dispatch(fetchHomepageSection({ section: s.id })))
          );
        }
      }),
      dispatch(fetchSettings()),
    ]);
  };

  const loadSettings = async () => {
    try {
      const res = await apiClient.get<any>('/settings');
      if (res.success && res.data) {
        setStoreSettings(res.data);
        return res.data;
      }
    } catch (err) {
      console.log('Failed to load store settings', err);
    }
    return null;
  };

  const loadBanners = async () => {
    try {
      const [topRes, midRes, bottomRes] = await Promise.all([
        apiClient.get<any>('/banners?placement=HOME_TOP'),
        apiClient.get<any>('/banners?placement=HOME_MIDDLE'),
        apiClient.get<any>('/banners?placement=HOME_BOTTOM'),
      ]);
      setTopBanners(topRes.banners || topRes.data?.banners || []);
      setMidBanners(midRes.banners || midRes.data?.banners || []);
      setBottomBanners(bottomRes.banners || bottomRes.data?.banners || []);
    } catch (err) {
      console.log('Banners not available:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Navigation handlers
  // Banners are now non-clickable as per structural changes
  const handleBannerPress = (banner: any) => {
    const type = banner.linkType || (banner.linkToProduct ? 'PRODUCT' : banner.linkToCategory ? 'CATEGORY' : 'NONE');
    const target = banner.linkTarget || banner.linkToProduct || banner.linkToCategory;

    console.log('Banner Press:', { type, target });

    if (type === 'PRODUCT' && target) {
      navigation.navigate('ProductDetails', { productId: target });
    } else if (type === 'CATEGORY' && target) {
      navigation.navigate('Search', { categoryId: target });
    } else if (type === 'URL' && target) {
      Linking.openURL(target).catch(err => console.log('Link Error:', err));
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails', { productId: product._id });
  };
  const handleAddToCart = async (product: Product) => {
    try {
      const minQty = product.minOrderQty || 1;
      await dispatch(addToCart({
        productId: product._id,
        quantity: minQty
      })).unwrap();
      Alert.alert(
        'Success', 
        `${product.name} added to cart!`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to add to cart');
    }
  };
  const handleCategoryPress = (categoryId: string) => {
    navigation.navigate('Search', { categoryId });
  };
  const handleBrandPress = (brandId: string) => {
    navigation.navigate('Search', { brandId });
  };
  const handleSearchPress = () => {
    navigation.navigate('Search', { autoFocus: true });
  };
  const handleWhatsApp = () => {
    whatsappService.openGeneralInquiry('Hi Shibra! I need help.');
  };
  const handleCartPress = () => {
    // Navigate to Cart screen in root stack
    navigation.navigate('Cart');
  };

  // Auto-scroll banners
  useEffect(() => {
    const bannerCount = Array.isArray(topBanners) ? topBanners.length : 0;
    if (bannerCount <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => {
        const next = (prev + 1) % bannerCount;
        bannerScrollRef.current?.scrollTo({
          x: next * SCREEN_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [topBanners?.length]);

  // Determine which address to show
  const safeAddresses = addresses || [];
  const defaultAddress = safeAddresses.find((a) => a.isDefault) || safeAddresses[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea}>
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <View style={styles.addressRow}>
            <View style={styles.addressLeft}>
              <View style={styles.logoRow}>
                <Text style={styles.brandLogoText}>
                  Youth<Text style={styles.brandLogoTextPrimary}>Qit</Text>
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              {/* Search icon removed as requested */}
              <TouchableOpacity style={styles.headerIconBtn} onPress={async () => {
                try {
                  const phone = storeSettings?.companyPhone || '9328492451';
                  await Linking.openURL(`tel:${phone}`);
                } catch (e) {
                  Alert.alert('Error', 'Could not open dialer.');
                }
              }}>
                <Icon name="phone-outline" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={handleWhatsApp}>
                <Icon name="whatsapp" size={24} color="#25D366" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={handleCartPress}>
                <Icon name="cart-outline" size={24} color={COLORS.textPrimary} />
                {cartItemCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ===== SECTION 2: SEARCH BAR (Keep for usability if needed, or hide if search icon suffices) ===== */}
        <TouchableOpacity style={styles.searchBarContainer} onPress={handleSearchPress} activeOpacity={0.8}>
          <View style={styles.searchBar}>
            <Icon name="magnify" size={20} color={COLORS.textMuted} />
            <Text style={styles.searchPlaceholder}>Search for items or products...</Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ===== STABILITY MODE: REMOVED LOADING GATES ===== */}
        {isLoading && (products?.length || 0) === 0 && (
          <View style={{ padding: 15, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
        <Ticker text={storeSettings?.tickerText || "🔥 Flash Sale: Get flat 20% off on orders above ₹2000! | 🚚 Free delivery on all mobile cases today!"} />

        {/* ===== BANNER CAROUSEL (WITH SAFETY FALLBACK) ===== */}
        {(topBanners?.length > 0) ? (
          <View style={styles.bannerSection}>
            <ScrollView
              ref={bannerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveBannerIndex(index);
              }}
            >
              {topBanners.map((banner) => (
                <TouchableOpacity 
                  key={banner._id} 
                  style={[styles.bannerSlide, { backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }]}
                  onPress={() => handleBannerPress(banner)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: ensureAbsoluteUrl(banner.image) }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="stretch"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            {(topBanners?.length > 1) && (
              <View style={styles.dotsRow}>
                {topBanners.map((_: any, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      activeBannerIndex === i && styles.dotActive
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.bannerFallback}>
            <View style={styles.bannerFallbackContent}>
              <Icon name="tag-outline" size={40} color={COLORS.primaryLight} />
              <Text style={styles.bannerFallbackTitle}>Welcome to Shibra</Text>
              <Text style={styles.bannerFallbackSubtitle}>Uploading latest offers from Admin Panel...</Text>
            </View>
          </View>
        )}

        {/* ===== STORE FEATURES (SCENIC MATRIX STYLE - FORCED VISIBILITY) ===== */}
        <View style={styles.matrixContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matrixScrollContent}
          >
            <View style={styles.matrixInner}>
              {(storeSettings?.storeFeatures?.length > 0 ? storeSettings.storeFeatures : [
                { title: 'Free Delivery', subtitle: 'On Prepaid Order', iconName: 'truck-delivery-outline' },
                { title: 'Wholesale Pricing', subtitle: 'On All Products', iconName: 'thumb-up-outline' },
                { title: 'Secure Payment', subtitle: '100% Safe Checkout', iconName: 'shield-check-outline' }
              ]).map((feat: any, idx: number, arr: any[]) => (
                <View key={idx} style={styles.matrixItemWrapper}>
                  <View style={styles.matrixItem}>
                    <Icon 
                      name={feat.iconName || 'check-circle-outline'} 
                      size={28} 
                      color={COLORS.primary} 
                    />
                    <View style={styles.matrixTextWrapper}>
                      <Text style={styles.matrixTitle}>{feat.title}</Text>
                      {feat.subtitle ? (
                        <Text style={styles.matrixSubtitle}>{feat.subtitle}</Text>
                      ) : null}
                    </View>
                  </View>
                  {idx < arr.length - 1 && (
                    <View style={styles.matrixDivider} />
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ===== SHOP BY CATEGORY (POP-OUT TEMPLATE GRID) ===== */}
        <View style={styles.section}>
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: 0 }}>
            <Text style={{ fontSize: 22, fontFamily: TYPOGRAPHY.fontFamily.bold, color: '#1E293B', fontWeight: '800' }}>Shop By Categories</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <View style={{ width: 6, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginRight: 3 }} />
              <View style={{ width: 6, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginRight: 3 }} />
              <View style={{ width: 6, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginRight: 6 }} />
              <View style={{ width: 45, height: 4, borderRadius: 2, backgroundColor: COLORS.primaryLight }} />
            </View>
          </View>
          <View style={styles.categoryGrid}>
            {( (categories?.length || 0) > 0 
              ? [...categories].filter((c: any) => !c.parent || c.level === 0).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)) 
              : [
                { _id: 'cat1', name: 'Mobile Case', image: null },
                { _id: 'cat2', name: 'Bluetooth', image: null },
                { _id: 'cat3', name: 'Charger', image: null },
                { _id: 'cat4', name: 'Gadgets', image: null },
                { _id: 'cat5', name: 'Connector', image: null },
                { _id: 'cat6', name: 'Camera', image: null },
                { _id: 'cat7', name: 'Speaker', image: null },
                { _id: 'cat8', name: 'Earbuds', image: null }
              ]
            ).filter(c => !!c).map((cat: any, idx: number) => (
              <TouchableOpacity
                key={cat._id}
                style={[
                  styles.scenicCategoryTile,
                  { marginRight: (idx + 1) % 4 === 0 ? 0 : 10 } // clear margin on right-most items
                ]}
                onPress={() => handleCategoryPress(cat._id)}
                activeOpacity={0.7}
              >
                <View style={styles.scenicCategoryBasePlate}>
                  <View style={styles.scenicCategoryTextWrapper}>
                    <Text style={styles.scenicCategoryTileName} numberOfLines={2}>
                      {cat.name}
                    </Text>
                    {cat.productCount ? (
                      <Text style={styles.scenicCategorySubText}>
                        {cat.productCount} products
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.scenicCategoryFloatingImageWrap}>
                  {cat.image ? (
                    <FastImage
                      source={{ uri: ensureAbsoluteUrl(cat.image) }}
                      style={styles.scenicCategoryTileImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Icon name="folder-outline" size={32} color={COLORS.primaryLight} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {(midBanners?.length > 0) && (
          <View style={styles.promoSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToAlignment="center"
              contentContainerStyle={styles.promoScroll}
            >
              {(midBanners || []).filter(b => !!b).map((banner: any) => (
                <TouchableOpacity 
                  key={banner._id} 
                  style={[styles.promoCardLarge, { backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }]}
                  onPress={() => handleBannerPress(banner)}
                  activeOpacity={0.9}
                >
                  <FastImage
                    source={{ uri: ensureAbsoluteUrl(banner.image) }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode={FastImage.resizeMode.stretch}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ===== DIRECT FROM BRANDS ===== */}
        {(brands?.length > 0) && (
          <View style={styles.section}>
            <SectionHeader title="Direct From Brands" />
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.horizontalList, { paddingBottom: 10 }]}
              scrollEventThrottle={16}
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const contentWidth = e.nativeEvent.contentSize.width;
                const layoutWidth = e.nativeEvent.layoutMeasurement.width;
                const maxOffset = contentWidth - layoutWidth;
                
                if (maxOffset <= 0) return;
                const progress = Math.max(0, Math.min(1, offsetX / maxOffset));
                
                let page = 0;
                if (progress > 0.25 && progress < 0.75) page = 1;
                else if (progress >= 0.75) page = 2;
                
                if (activeBrandPage !== page) setActiveBrandPage(page);
              }}
            >
              {(brands || []).filter(b => !!b).map((item: any) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.brandCard}
                  onPress={() => handleBrandPress(item._id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.brandPlaque}>
                    {item.image ? (
                      <FastImage
                        source={{ uri: ensureAbsoluteUrl(item.image) }}
                        style={styles.brandLogo}
                        resizeMode={FastImage.resizeMode.contain}
                      />
                    ) : (
                      <Text style={styles.brandInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                  <Text style={styles.brandName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Pagination Dots for Brands */}
            {(brands?.length > 3) && (
              <View style={styles.brandPaginationContainer}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.brandPaginationDot,
                      activeBrandPage === i && styles.brandPaginationDotActive
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ===== NEW CAROUSEL BELOW BRANDS (HOME_BOTTOM) ===== */}
        {(bottomBanners?.length > 0) && (
          <View style={styles.promoSection}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={SCREEN_WIDTH * 0.85 + 12}
              decelerationRate="fast"
              contentContainerStyle={styles.promoScroll}
            >
              {(bottomBanners || []).filter(b => !!b).map((banner: any) => (
                <TouchableOpacity 
                  key={banner._id} 
                  style={[styles.promoCardLarge, { backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }]}
                  onPress={() => handleBannerPress(banner)}
                  activeOpacity={0.9}
                >
                  <FastImage
                    source={{ uri: ensureAbsoluteUrl(banner.image) }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode={FastImage.resizeMode.stretch}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ===== DYNAMIC SECTIONS ===== */}
        {storeSettings?.homepageVisibilitySections?.filter((s: any) => s.isActive).map((section: any) => {
          const sectionProducts = dynamicSections[section.id];
          if (!sectionProducts || sectionProducts.length === 0) return null;
          return (
            <View key={section.id} style={styles.section}>
              <SectionHeader
                title={section.title}
                onViewAll={() => navigation.navigate('Search', { section: section.id })}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                {sectionProducts.filter(i => !!i).map((item: any) => (
                  <ProductCardHorizontal key={item._id} product={item} onPress={() => handleProductPress(item)} onAddToCart={() => handleAddToCart(item)} />
                ))}
              </ScrollView>
            </View>
          );
        })}
        {/* ===== NEW STYLE FOOTER ===== */}
        <View style={styles.footerContainer}>
          <View style={styles.footerBrand}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.footerBrandText}>Youth<Text style={{ color: COLORS.primary }}>Qit</Text></Text>
              <View style={styles.syncTag}>
                <Text style={styles.syncTagText}>v5.3-STABLE</Text>
              </View>
            </View>
            <Text style={styles.footerCopyright}>© 2026 Shibra India. All rights reserved.</Text>
          </View>
          
          <View style={styles.footerDivider} />

          <View style={styles.footerInfoRow}>
            <View style={styles.footerInfoItem}>
              <Icon name="clock-outline" size={18} color="#64748B" />
              <Text style={styles.footerInfoText}>10 AM - 10 PM</Text>
            </View>
          </View>
          
          <Text style={styles.footerQueryText}>ANY QUERIES? CONTACT US</Text>
          <View style={styles.footerContactRow}>
            <TouchableOpacity 
              style={styles.footerContactBtn} 
              onPress={() => Linking.openURL('tel:9328492451')}
            >
              <View style={[styles.footerIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Icon name="phone" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.footerContactNum}>9328492451</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.footerContactBtn} 
              onPress={() => Linking.openURL('https://wa.me/919328492451')}
            >
              <View style={[styles.footerIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="whatsapp" size={20} color="#22C55E" />
              </View>
              <Text style={[styles.footerContactNum, { color: '#22C55E' }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerSocialSection}>
            <Text style={styles.footerSocialTitle}>Follow Us</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://www.facebook.com/share/1CKxka8TPS/?mibextid=wwXIfr')}
                activeOpacity={0.7}
              >
                <View style={styles.facebookCircle}>
                  <Icon name="facebook" size={28} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://www.instagram.com/shibra_india?igsh=MTc3a2UyNXR4OGc5OQ%3D%3D&utm_source=qr')}
                activeOpacity={0.7}
              >
                <View style={styles.instaCircle}>
                  <Icon name="instagram" size={28} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerBottomTag}>
            <Text style={styles.footerBottomText}>Designed with ❤️ for You</Text>
          </View>
        </View>

        </ScrollView>
    </View>
  );
};

// Styles moved to top level but initialized via StyleSheet.create for optimization
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  promoBar: {
    backgroundColor: COLORS.accent, // Yellow-gold from reference
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoText: {
    color: COLORS.black,
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: '700',
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm, // Reduced from md
    paddingTop: Platform.OS === 'ios' ? 10 : 16, // Fixed padding issue
    paddingBottom: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTextContainer: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  addressTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
  },
  addressSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressSubtitle: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  headerIconBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  searchBarContainer: {
    paddingHorizontal: SPACING.sm, // Reduced for density
    paddingVertical: 2, // SIGNIFICANTLY REDUCED to fix gap
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.radius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },

  // ===== SCROLL =====
  scrollContent: {
    flex: 1, // RESTORED: this is required for the ScrollView to fill the screen
    backgroundColor: '#FFFFFF',
  },

  bannerSection: {
    marginTop: 0, // Flush with ticker/search
    backgroundColor: '#FFFFFF',
    minHeight: BANNER_HEIGHT,
  },
  bannerSlide: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
  },
  bannerFallback: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    marginTop: 0,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerFallbackContent: {
    alignItems: 'center',
  },
  bannerFallbackTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
    marginTop: 8,
    fontWeight: '800',
  },
  bannerFallbackSubtitle: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#94A3B8',
    marginTop: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 18,
    backgroundColor: COLORS.primary,
  },

  // ===== PROMO OFFER CARDS =====
  promoSection: {
    marginTop: 0, // Flush with previous section
  },
  promoScroll: {
    paddingHorizontal: 0,
  },
  promoCard: {
    width: 140,
    height: 140,
    borderRadius: SPACING.radius.md,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: COLORS.white,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  promoCardLarge: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    elevation: 0,
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },

  // ===== SECTIONS =====
  section: {
    marginTop: SPACING.md, // Reduced to save space
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm, // Reduced
    marginBottom: SPACING.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionAccent: {
    width: 4,
    height: 20,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  viewAllBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalList: {
    paddingHorizontal: SPACING.md,
  },

  // ===== HOT CATEGORIES =====
  hotCategoryCard: {
    width: 80,
    alignItems: 'center',
    marginRight: 8, // Reduced
  },
  hotCategoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  hotCategoryImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  hotCategoryName: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 4,
  },
  
  // BRAND TEXT LOGO
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandLogoText: {
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    fontSize: 26,
    color: '#000000',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brandLogoTextPrimary: {
    color: COLORS.primary,
  },
  syncTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  syncTagText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },

  // ===== BRANDS (RECTANGULAR PLAQUE UI) =====
  brandCard: {
    alignItems: 'center',
    marginRight: 15,
    width: 110,
  },
  brandPlaque: {
    width: 110,
    height: 65,
    borderRadius: 12,
    backgroundColor: '#F0F9FF', // Cool Light Blue Effect
    borderWidth: 1.5,
    borderColor: '#BAE6FD', // Sky blue border
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    // Deeper blue-tinted shadow for cool effect
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    padding: 4,
  },
  brandLogo: {
    width: '90%',
    height: '80%',
  },
  brandInitial: {
    fontSize: 26,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  brandPaginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  brandPaginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginHorizontal: 3,
  },
  brandPaginationDotActive: {
    backgroundColor: COLORS.primary,
    width: 16,
  },

  // ===== FEATURES MATRIX (SCENIC STYLE) =====
  matrixContainer: {
    marginHorizontal: SPACING.lg,
    marginTop: 20, // 'One line space' below banner
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  matrixScrollContent: {
    flexGrow: 1,
  },
  matrixInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  matrixItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matrixItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 180,
  },
  matrixTextWrapper: {
    marginLeft: 12,
  },
  matrixTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  matrixSubtitle: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  matrixDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },

  // ===== POP-OUT CATEGORY GRID (CLASSY TEMPLATE) =====
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    justifyContent: 'flex-start',
    paddingTop: 30, // Space for top row floating images
  },
  scenicCategoryTile: {
    width: (SCREEN_WIDTH - (SPACING.md * 2) - 30) / 4, // 4 columns with ~10px gaps
    marginBottom: 35,
    position: 'relative',
    alignItems: 'center',
  },
  scenicCategoryBasePlate: {
    width: '100%',
    backgroundColor: '#EEF8FF', // Soft Electric Blue Base
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingTop: 50, // Drop text below the floating image
    paddingBottom: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 105, 
    // Subtle lift
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  scenicCategoryFloatingImageWrap: {
    position: 'absolute',
    top: -20, // Break out of the box
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    // Realistic 3D floating shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  scenicCategoryTileImage: {
    width: '100%',
    height: '100%',
  },
  scenicCategoryTextWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  scenicCategoryTileName: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#0F172A',
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 12,
  },
  scenicCategorySubText: {
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },

  // ===== PRODUCTS GRID =====
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },

  // ===== FOOTER STYLES =====
  footerContainer: {
    backgroundColor: '#E0F2FE', // Light Blue
    paddingTop: 35,
    paddingBottom: 100,
    paddingHorizontal: SPACING.lg,
    marginTop: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#BAE6FD',
  },
  footerBrand: {
    alignItems: 'center',
    marginBottom: 15,
  },
  footerBrandText: {
    fontSize: 26,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#0F172A',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
  footerDivider: {
    width: '40%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginBottom: 20,
    opacity: 0.3,
  },
  footerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 25,
  },
  footerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerInfoText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  footerQueryText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#1E293B',
    marginBottom: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footerContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 35,
  },
  footerContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    gap: 10,
  },
  footerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerContactNum: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
    fontWeight: '900',
  },
  footerSocialSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  footerSocialTitle: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '800',
  },
  facebookCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1877F2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  instaCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E1306C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E1306C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  footerBottomTag: {
    marginTop: 10,
    opacity: 0.8,
  },
  footerBottomText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    fontWeight: '600',
  },
});

export default HomeScreen;