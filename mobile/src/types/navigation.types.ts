/**
 * Navigation Types - React Navigation Type Safety
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ==================== ROOT STACK ====================
export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ProductDetails: { productId: string; addToCart?: boolean };
  Cart: undefined;
  Checkout: undefined;
  AddAddress: { addressId?: string; returnToCheckout?: boolean };
  AddressList: undefined;
  Orders: undefined;
  OrderDetails: { orderId: string };
  InvoiceViewer: { invoiceUrl: string; orderId: string };
  Blogs: undefined;
  BlogDetails: { blogId: string };
  Offers: undefined;
  PolicyViewer: { title: string; policyKey: 'shippingPolicy' | 'returnPolicy' | 'refundPolicy' | 'cancellationPolicy' | 'privacyPolicy' | 'termsAndConditions' };
  AllReviews: { productId: string; productName: string };
  PaymentQr: undefined;
  EditProfile: undefined;
  Notifications: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

// ==================== MAIN TAB ====================
export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Search: { categoryId?: string; brandId?: string; search?: string; autoFocus?: boolean; section?: string };
  Account: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

// ==================== AUTH STACK ====================
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  VerifyOTP: { phoneNumber: string; isRegistration?: boolean; registrationData?: any };
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

// ==================== DECLARE GLOBAL ====================
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
