/**
 * AddressList Screen
 * 
 * Manage saved delivery addresses
 * View, edit, delete, set default addresses
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchAddresses,
  deleteAddress,
  setDefaultAddress,
} from '../../store/slices/addressSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Button from '../../components/ui/Button';
import AddressCard from '../../components/address/AddressCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

type AddressListScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddressList'
>;

interface AddressListScreenProps {
  navigation: AddressListScreenNavigationProp;
}

const AddressListScreen: React.FC<AddressListScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { addresses, isLoading, error } = useAppSelector((state) => state.address);

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    await dispatch(fetchAddresses());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  };

  const handleAddNew = () => {
    navigation.navigate('AddAddress' as never);
  };

  const handleEdit = (addressId: string) => {
    navigation.navigate('AddAddress', { addressId });
  };

  const handleDelete = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const resultAction = await dispatch(deleteAddress(addressId));
            if (deleteAddress.rejected.match(resultAction)) {
              Alert.alert(
                'Error',
                resultAction.payload as string || 'Failed to delete address',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addressId: string) => {
    const resultAction = await dispatch(setDefaultAddress(addressId));
    if (setDefaultAddress.rejected.match(resultAction)) {
      Alert.alert(
        'Error',
        resultAction.payload as string || 'Failed to set default address',
        [{ text: 'OK' }]
      );
    }
  };

  if (isLoading && addresses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            title="+ Add New Address"
            variant="primary"
            onPress={handleAddNew}
            style={styles.addButton}
          />
        </View>
        <View style={styles.content}>
          <LoadingSkeleton type="text" count={3} height={120} />
        </View>
      </View>
    );
  }

  if (addresses.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="📍"
          title="No Addresses Saved"
          description="Add a delivery address to place orders"
          actionLabel="Add Address"
          onAction={handleAddNew}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Button
          title="+ Add New Address"
          variant="primary"
          onPress={handleAddNew}
          style={styles.addButton}
        />
      </View>

      {/* Address List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {addresses.map((address) => (
          <AddressCard
            key={address._id}
            address={address}
            showActions
            onEdit={() => handleEdit(address._id)}
            onDelete={() => handleDelete(address._id)}
            onSetDefault={() => handleSetDefault(address._id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addButton: {},
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
});

export default AddressListScreen;
