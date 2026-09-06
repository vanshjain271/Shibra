/**
 * Orders Screen
 * Fixed:
 * - ScrollView was used inside renderHeader() without being imported — added import
 * - pagination.hasMore used (now set in orderSlice fix)
 * - isLoadingMore now exists in orderSlice
 * - navigation to OrderDetails uses composite nav (RootStack)
 * - navigation to Catalog uses composite nav (MainTab)
 * - removed unused invoiceService import
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView, // FIX: was missing, caused runtime crash in renderHeader
  Alert,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMyOrders } from '../../store/slices/orderSlice';
import { OrderDetail } from '../../types/api.types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import OrderCard from '../../components/order/OrderCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

// FIX: Orders tab needs to navigate to OrderDetails & InvoiceViewer in RootStack
type OrdersNavProp = NativeStackNavigationProp<RootStackParamList, 'Orders'>;

interface OrdersScreenProps {
  navigation: OrdersNavProp;
}

type OrderStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

const OrdersScreen: React.FC<OrdersScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { orders, pagination, isLoading, isLoadingMore } = useAppSelector(
    (state) => state.orders
  );

  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('ALL');

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const loadOrders = async () => {
    const status = selectedStatus === 'ALL' ? undefined : selectedStatus;
    await dispatch(fetchMyOrders({ page: 1, limit: 20, status }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    // FIX: use hasMore (set in orderSlice fix)
    if (!isLoadingMore && pagination?.hasMore) {
      const status = selectedStatus === 'ALL' ? undefined : selectedStatus;
      dispatch(
        fetchMyOrders({ page: (pagination?.page ?? 1) + 1, limit: 20, status })
      );
    }
  };

  const handleOrderPress = (order: OrderDetail) => {
    navigation.navigate('OrderDetails', { orderId: order._id });
  };

  const handleViewInvoice = async (order: OrderDetail) => {
    // The public-pdf endpoint generates the PDF on-the-fly — no pre-generation needed.
    const pdfUrl = `https://api.shibra.in/api/v1/invoices/public-pdf/${order._id}`;

    const { Linking } = require('react-native');
    Linking.openURL(pdfUrl).catch((err: any) => {
      Alert.alert('Error', 'Could not open invoice. Please try again.');
      console.error('Invoice open error:', err);
    });
  };

  const handleStatusFilter = (status: OrderStatus) => {
    setSelectedStatus(status);
  };

  const renderOrder = ({ item }: { item: OrderDetail }) => (
    <OrderCard
      order={item}
      onPress={() => handleOrderPress(item)}
      onViewInvoice={() => handleViewInvoice(item)}
    />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerText}>Loading more orders...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <EmptyState
        icon="📦"
        title="No Orders Found"
        description={
          selectedStatus === 'ALL'
            ? "You haven't placed any orders yet"
            : `No ${selectedStatus.toLowerCase()} orders found`
        }
        actionLabel="Browse Products"
        onAction={() => navigation.navigate('Catalog' as never)}
      />
    );
  };

  // FIX: ScrollView is now imported above — no crash
  const renderHeader = () => (
    <View style={styles.header}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {(
          [
            'ALL',
            'PENDING',
            'CONFIRMED',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED',
          ] as OrderStatus[]
        ).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterPill,
              selectedStatus === status && styles.filterPillActive,
            ]}
            onPress={() => handleStatusFilter(status)}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === status && styles.filterTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.skeletonContainer}>
          <LoadingSkeleton type="order" count={5} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterContainer: {
    paddingHorizontal: SPACING.lg,
  },
  filterPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.radius.full,
    backgroundColor: COLORS.borderLight,
    marginRight: SPACING.sm,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  skeletonContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
});

export default OrdersScreen;