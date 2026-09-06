import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCategories, setFilters } from '../../store/slices/productSlice';
import { Category } from '../../types/api.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 4;
const PADDING = SPACING.md;
const GAP = 10;
const ITEM_WIDTH = (width - PADDING * 2 - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const CategoriesScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { categories, isLoading } = useAppSelector((state) => state.products);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchCategories());
    setRefreshing(false);
  };

  const handleCategoryPress = (category: Category) => {
    dispatch(setFilters({ categoryId: category._id }));
    navigation.navigate('Search', { categoryId: category._id });
  };

  const renderItem = ({ item, index }: { item: Category; index: number }) => {
    return (
      <TouchableOpacity
        style={[
          styles.scenicCategoryTile,
          { marginRight: (index + 1) % 4 === 0 ? 0 : 10 }
        ]}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.scenicCategoryBasePlate}>
          <View style={styles.scenicCategoryTextWrapper}>
            <Text style={styles.scenicCategoryTileName} numberOfLines={2}>
              {item.name}
            </Text>
            {/* Omitted "Explore+" per user request */}
          </View>
        </View>
        <View style={styles.scenicCategoryFloatingImageWrap}>
          {item.image ? (
            <FastImage
              source={{ uri: item.image, priority: FastImage.priority.normal }}
              style={styles.scenicCategoryTileImage}
              resizeMode={FastImage.resizeMode.contain}
            />
          ) : (
            <Text style={styles.placeholderLetter}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && categories.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        key={COLUMN_COUNT}
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>No Categories Yet</Text>
            <Text style={styles.emptySubtitle}>Pull down to refresh</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  listContent: {
    paddingHorizontal: PADDING,
    paddingTop: 30, // Space for top row floating images
    paddingBottom: SPACING.xxl,
  },
  scenicCategoryTile: {
    width: ITEM_WIDTH,
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
  placeholderLetter: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primaryLight,
    fontWeight: '900',
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});

export default CategoriesScreen;
