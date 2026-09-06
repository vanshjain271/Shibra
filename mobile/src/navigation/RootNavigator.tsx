/**
 * Root Navigator
 * 
 * Root navigation component that manages auth state
 * Switches between Auth and Main navigators
 */

import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadStoredAuth } from '../store/slices/authSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import FloatingCartBanner from '../components/cart/FloatingCartBanner';

// Screens
import ProductDetailsScreen from '../screens/main/ProductDetailsScreen';
import CheckoutScreen from '../screens/main/CheckoutScreen';
import AddAddressScreen from '../screens/main/AddAddressScreen';
import AddressListScreen from '../screens/main/AddressListScreen';
import OrderDetailsScreen from '../screens/main/OrderDetailsScreen';
// Lazy load risky screens
/*
let InvoiceViewerScreen: any = null;
try {
  InvoiceViewerScreen = require('../screens/main/InvoiceViewerScreen').default;
} catch (e) {
  console.log('Lazy load error for InvoiceViewerScreen');
}
*/

import BlogDetailsScreen from '../screens/main/BlogDetailsScreen';
import AllReviewsScreen from '../screens/main/AllReviewsScreen';
import BlogsScreen from '../screens/main/BlogsScreen';
import OffersScreen from '../screens/main/OffersScreen';
import PolicyViewerScreen from '../screens/main/PolicyViewerScreen';
import OrdersScreen from '../screens/main/OrdersScreen';
import CartScreen from '../screens/main/CartScreen';
import PaymentQrScreen from '../screens/main/PaymentQrScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import NotificationScreen from '../screens/main/NotificationScreen';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

import { fcmService } from '../services/fcm.service';
import { navigationRef, navigate } from './navigationRef';
import { Alert } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.background,
    text: COLORS.textPrimary,
    border: COLORS.border,
    primary: COLORS.primary,
  },
};

const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitializing } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadStoredAuth());
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      fcmService.initialize();

      const handleNotification = (message: any) => {
        if (!message?.data) return;
        const { linkType, linkTarget, expiresAt } = message.data;

        if (expiresAt && new Date() > new Date(expiresAt)) {
          Alert.alert('Offer Expired', 'Sorry, this offer has already expired.');
          return;
        }

        if (linkType === 'PRODUCT' && linkTarget) {
          navigate('ProductDetails', { productId: linkTarget });
        } else if (linkType === 'CATEGORY' && linkTarget) {
          navigate('CategoryProducts', { categoryId: linkTarget, categoryName: 'Products' });
        }
      };

      fcmService.getInitialNotification().then(msg => {
        if (msg) {
          // Wait for navigation container to be fully mounted and ready
          setTimeout(() => handleNotification(msg), 1500);
        }
      });

      const unsubscribe = fcmService.onNotificationOpenedApp(handleNotification);
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  const linking = {
    prefixes: ['https://api.shibra.in', 'shibra://'],
    config: {
      screens: {
        Main: {
          screens: {
            Home: 'home', // or whatever the tab routes are
            // wait, we need to map to ProductDetails which is in RootStack
          }
        },
        ProductDetails: 'product/:productId',
      }
    }
  };

  return (
    <NavigationContainer linking={linking} theme={AppTheme} ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: {
            fontFamily: TYPOGRAPHY.fontFamily.bold,
            fontSize: TYPOGRAPHY.fontSize.lg,
          },
          headerShadowVisible: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="ProductDetails"
              component={ProductDetailsScreen}
              options={{
                headerShown: true,
                title: 'Product Details',
              }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{
                headerShown: true,
                title: 'Shopping Cart',
              }}
            />
            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{
                headerShown: true,
                title: 'Checkout',
              }}
            />
            <Stack.Screen
              name="AddAddress"
              component={AddAddressScreen}
              options={{
                headerShown: true,
                title: 'Add Address',
              }}
            />
            <Stack.Screen
              name="AddressList"
              component={AddressListScreen}
              options={{
                headerShown: true,
                title: 'Manage Addresses',
              }}
            />
            <Stack.Screen
              name="OrderDetails"
              component={OrderDetailsScreen}
              options={{
                headerShown: true,
                title: 'Order Details',
              }}
            />
            {/* InvoiceViewer temporarily disabled for stability testing */}
            <Stack.Screen
              name="BlogDetails"
              component={BlogDetailsScreen}
              options={{
                headerShown: true,
                title: 'Blog Post',
              }}
            />
            <Stack.Screen
              name="AllReviews"
              component={AllReviewsScreen}
              options={{
                headerShown: true,
                title: 'Product Reviews',
              }}
            />
            <Stack.Screen
              name="Orders"
              component={OrdersScreen}
              options={{
                headerShown: true,
                title: 'My Orders',
              }}
            />
            <Stack.Screen
              name="Blogs"
              component={BlogsScreen}
              options={{
                headerShown: true,
                title: 'Blogs & News',
              }}
            />
            <Stack.Screen
              name="Offers"
              component={OffersScreen}
              options={{
                headerShown: true,
                title: 'Exclusive Offers',
              }}
            />
            <Stack.Screen
              name="PolicyViewer"
              component={PolicyViewerScreen}
              options={{
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="PaymentQr"
              component={PaymentQrScreen}
              options={{
                headerShown: true,
                title: 'Pay via UPI QR',
              }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen} 
              options={{ headerShown: true, title: 'Edit Profile' }}
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationScreen} 
              options={{ headerShown: true, title: 'Notifications' }}
            />
          </>
        )}
      </Stack.Navigator>
      <FloatingCartBanner />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
  },
});

export default RootNavigator;
