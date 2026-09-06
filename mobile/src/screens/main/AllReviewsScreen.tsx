import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { RootStackScreenProps } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProductReviews } from '../../store/slices/reviewSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import ReviewItem from '../../components/ReviewItem';

const AllReviewsScreen: React.FC<RootStackScreenProps<'AllReviews'>> = ({ navigation, route }) => {
  const { productId, productName } = route.params;
  const dispatch = useAppDispatch();
  const { productReviews, isLoading } = useAppSelector((state) => state.review);

  useEffect(() => {
    dispatch(fetchProductReviews(productId));
    
    // Set header title to product name
    navigation.setOptions({
      title: `Reviews: ${productName}`,
    });
  }, [productId]);

  if (isLoading && productReviews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={productReviews}
        renderItem={({ item }) => <ReviewItem review={item} />}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No reviews yet for this product.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  listContent: {
    padding: SPACING.lg,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default AllReviewsScreen;
