/**
 * CatalogScreen — Product grid for Search tab
 * 2-column square grid, category filter from route params
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList, RootStackParamList } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchProducts,
  fetchMoreProducts,
  fetchCategories,
  setFilters,
  clearFilters,
} from '../../store/slices/productSlice';
import { fetchCart } from '../../store/slices/cartSlice';
import { Product } from '../../types/api.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import ProductCard from '../../components/product/ProductCard';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const { width } = Dimensions.get('window');
const COLUMN_GAP = SPACING.md;
const H_PAD = SPACING.lg;

type CatalogNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const CatalogScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<CatalogNavProp>();
  const route = useRoute<any>();

  const { products, categories, isLoading, isLoadingMore, filters, pagination } = useAppSelector(
    (state) => state.products
  );

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep ref so we never lose focus during re-renders
  const inputRef = useRef<import('react-native').TextInput>(null);

  // Apply category/brand filter from route params (from Home or Categories tab)
  useEffect(() => {
    // Always load fresh cart state so +/- buttons show correct qty
    dispatch(fetchCart()).catch(() => {}); // silent fail if not authenticated
    // Load categories if not loaded (for subcategory tabs)
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories());
    }
    
    if (route.params?.categoryId) {
      dispatch(setFilters({ 
        categoryId: route.params.categoryId, 
        brandId: undefined, 
        search: undefined 
      }));
    } else if (route.params?.brandId) {
      dispatch(setFilters({ 
        brandId: route.params.brandId, 
        categoryId: undefined, 
        search: undefined 
      }));
    } else if (route.params?.search) {
      setSearchQuery(route.params.search);
      dispatch(setFilters({ 
        search: route.params.search, 
        categoryId: undefined, 
        brandId: undefined,
        homepageSection: undefined
      }));
    } else if (route.params?.section) {
      dispatch(setFilters({
        homepageSection: route.params.section,
        categoryId: undefined,
        brandId: undefined,
        search: undefined
      }));
    }
  }, [route.params?.categoryId, route.params?.brandId, route.params?.search, route.params?.section]);

  // Load products whenever filters change
  useEffect(() => {
    dispatch(fetchProducts({ ...filters, page: 1, limit: 20 }));
  }, [filters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchProducts({ ...filters, page: 1, limit: 20 }));
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && pagination?.hasMore) {
      dispatch(
        fetchMoreProducts({
          ...filters,
          page: (pagination?.page ?? 1) + 1,
          limit: 20,
        })
      );
    }
  };

  // Debounce search — does NOT cause keyboard dismissal because
  // the TextInput is always mounted at the top of the tree
  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        dispatch(setFilters({ search: text.trim() || undefined, categoryId: undefined, brandId: undefined }));
      }, 500);
    },
    [dispatch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
    dispatch(clearFilters());
    // Keep keyboard open so user can type a new search
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [dispatch]);

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails', { productId: product._id });
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard product={item} onPress={() => handleProductPress(item)} />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading && products.length === 0) {
      return (
        <View style={styles.skeletonGrid}>
          <LoadingSkeleton type="product" count={6} />
        </View>
      );
    }
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>No Products Found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery ? `No results for "${searchQuery}"` : 'Try a different category or search'}
        </Text>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearSearch}>
          <Text style={styles.clearBtnText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Memoized Subcategory Pills to prevent unnecessary re-renders
  const renderSubcategories = () => {
    if (!filters.categoryId) return null;
    
    let currentCat = categories.find(c => c._id === filters.categoryId);
    let parentId = currentCat?.parent || currentCat?._id;
    
    const subcategories = categories.filter(c => c.parent === parentId);
    
    if (subcategories.length === 0) return null;

    return (
      <View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcatsContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* "All" button for the parent */}
          <TouchableOpacity 
            style={[
              styles.subcatPill, 
              filters.categoryId === parentId && styles.subcatPillActive
            ]}
            onPress={() => dispatch(setFilters({ categoryId: parentId }))}
          >
            <Text style={[
              styles.subcatText,
              filters.categoryId === parentId && styles.subcatTextActive
            ]}>All</Text>
          </TouchableOpacity>

          {subcategories.map(sub => (
            <TouchableOpacity 
              key={sub._id}
              style={[
                styles.subcatPill, 
                filters.categoryId === sub._id && styles.subcatPillActive
              ]}
              onPress={() => dispatch(setFilters({ categoryId: sub._id }))}
            >
              <Text style={[
                styles.subcatText,
                filters.categoryId === sub._id && styles.subcatTextActive
              ]}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ─── CRITICAL: SearchBar is always rendered at the TOP, never conditionally
  // removed. This prevents the keyboard from dismissing during product fetches.
  const searchBar = (
    <View style={styles.searchBar}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        ref={inputRef}
        style={styles.searchInput}
        placeholder="Search products..."
        placeholderTextColor={COLORS.textMuted}
        value={searchQuery}
        onChangeText={handleSearch}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        // IMPORTANT: do not set editable=false during loading — it kills keyboard
        blurOnSubmit={false}
        onSubmitEditing={() => {
          if (searchTimer.current) clearTimeout(searchTimer.current);
          dispatch(setFilters({ search: searchQuery.trim() || undefined, categoryId: undefined, brandId: undefined }));
        }}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.clearX}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* SearchBar is ALWAYS mounted here — never inside a conditional */}
      {searchBar}
      {renderSubcategories()}

      <FlatList
        key="catalog-2col"
        data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: H_PAD,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: SPACING.radius.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: 44,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    paddingVertical: 0,
  },
  clearX: {
    fontSize: 14,
    color: COLORS.textMuted,
    paddingLeft: 8,
  },
  subcatsContainer: {
    paddingHorizontal: H_PAD,
    paddingBottom: SPACING.sm,
    gap: 8,
    flexDirection: 'row',
  },
  subcatPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subcatPillActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  subcatText: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#64748B',
  },
  subcatTextActive: {
    color: COLORS.primaryDark,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: SPACING.xxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: H_PAD,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  clearBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: SPACING.radius.sm,
  },
  clearBtnText: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default CatalogScreen;