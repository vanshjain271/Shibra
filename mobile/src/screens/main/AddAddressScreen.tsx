/**
 * AddAddress Screen
 * 
 * Add or edit delivery address
 * Form with validation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addAddress, updateAddress } from '../../store/slices/addressSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type AddAddressScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddAddress'>;
type AddAddressScreenRouteProp = RouteProp<RootStackParamList, 'AddAddress'>;

interface AddAddressScreenProps {
  navigation: AddAddressScreenNavigationProp;
  route: AddAddressScreenRouteProp;
}

const AddAddressScreen: React.FC<AddAddressScreenProps> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.address);
  const { addresses } = useAppSelector((state) => state.address);

  const addressId = route.params?.addressId;
  const returnToCheckout = route.params?.returnToCheckout;
  const isEditMode = !!addressId;

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Error state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEditMode && addressId) {
      const address = addresses.find((addr) => addr._id === addressId);
      if (address) {
        setName(address.name);
        setPhone(address.phone);
        setAddressLine1(address.addressLine1);
        setAddressLine2(address.addressLine2 || '');
        setCity(address.city);
        setState(address.state);
        setPincode(address.pincode);
        setIsDefault(address.isDefault);
      }
    }
  }, [isEditMode, addressId, addresses]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const addressData = {
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isDefault,
    };

    try {
      if (isEditMode && addressId) {
        const resultAction = await dispatch(
          updateAddress({
            addressId,
            ...addressData,
          })
        );

        if (updateAddress.fulfilled.match(resultAction)) {
          Alert.alert('Success', 'Address updated successfully', [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          Alert.alert('Error', resultAction.payload as string || 'Failed to update address', [
            { text: 'OK' },
          ]);
        }
      } else {
        const resultAction = await dispatch(addAddress(addressData));

        if (addAddress.fulfilled.match(resultAction)) {
          Alert.alert('Success', 'Address added successfully', [
            {
              text: 'OK',
              onPress: () => {
                if (returnToCheckout) {
                  navigation.navigate('Checkout');
                } else {
                  navigation.goBack();
                }
              },
            },
          ]);
        } else {
          Alert.alert('Error', resultAction.payload as string || 'Failed to add address', [
            { text: 'OK' },
          ]);
        }
      }
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Something went wrong. Please try again.';
      Alert.alert('Error', msg, [{ text: 'OK' }]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {isEditMode ? 'Edit Address' : 'Add New Address'}
        </Text>

        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          error={errors.name}
          required
          autoCapitalize="words"
        />

        <Input
          label="Phone Number"
          placeholder="Enter 10-digit phone number"
          value={phone}
          onChangeText={(text) => {
            const cleaned = text.replace(/\D/g, '').slice(0, 10);
            setPhone(cleaned);
          }}
          error={errors.phone}
          required
          keyboardType="phone-pad"
          maxLength={10}
          leftIcon={<Text style={styles.countryCode}>+91</Text>}
        />

        <Input
          label="Address Line 1"
          placeholder="House No., Building Name"
          value={addressLine1}
          onChangeText={setAddressLine1}
          error={errors.addressLine1}
          required
          multiline
          numberOfLines={2}
        />

        <Input
          label="Address Line 2"
          placeholder="Road name, Area, Colony (Optional)"
          value={addressLine2}
          onChangeText={setAddressLine2}
          multiline
          numberOfLines={2}
        />

        <Input
          label="City"
          placeholder="Enter city"
          value={city}
          onChangeText={setCity}
          error={errors.city}
          required
          autoCapitalize="words"
        />

        <Input
          label="State"
          placeholder="Enter state"
          value={state}
          onChangeText={setState}
          error={errors.state}
          required
          autoCapitalize="words"
        />

        <Input
          label="Pincode"
          placeholder="Enter 6-digit pincode"
          value={pincode}
          onChangeText={(text) => {
            const cleaned = text.replace(/\D/g, '').slice(0, 6);
            setPincode(cleaned);
          }}
          error={errors.pincode}
          required
          keyboardType="number-pad"
          maxLength={6}
        />

        {/* Set as Default - Simple implementation without checkbox */}
        {/* <View style={styles.defaultContainer}>
          <Text style={styles.defaultLabel}>Set as default address</Text>
        </View> */}

        <Button
          title={isEditMode ? 'Update Address' : 'Save Address'}
          variant="primary"
          size="large"
          onPress={handleSave}
          loading={isLoading}
          fullWidth
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  countryCode: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
  },
  saveButton: {
    marginTop: SPACING.md,
  },
});

export default AddAddressScreen;
