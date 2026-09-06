/**
 * Profile / Account Screen
 * 
 * Professional layout matching reference app:
 * - Profile card with avatar + edit
 * - Quick actions row (Wallet, Notifications, Wishlist)
 * - Orders, Support, Legal, More sections
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { apiClient } from '../../services/api.service';

type ProfileNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Account'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface ProfileScreenProps {
  navigation: ProfileNavProp;
}

// ===== MENU ITEM COMPONENT =====
interface MenuItemProps {
  iconName: string;
  iconColor?: string;
  title: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ iconName, iconColor, title, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
    <View style={styles.menuIconCircle}>
      <Icon name={iconName} size={20} color={iconColor || COLORS.textSecondary} />
    </View>
    <Text style={styles.menuTitle}>{title}</Text>
    <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
  </TouchableOpacity>
);

// ===== SECTION HEADER =====
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionAccent} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// ===== QUICK ACTION =====
interface QuickActionProps {
  iconName: string;
  label: string;
  onPress: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ iconName, label, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <Icon name={iconName} size={24} color={COLORS.textPrimary} />
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

// ===== MAIN COMPONENT =====
const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action is irreversible and will delete your profile, addresses, and order history.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const res = await apiClient.delete('/users/me');
              if (res.success) {
                Alert.alert('Success', 'Your account has been deleted successfully.');
                dispatch(logout());
              } else {
                Alert.alert('Error', res.message || 'Failed to delete account');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred while deleting your account');
            }
          } 
        },
      ]
    );
  };

  const handleWhatsApp = async () => {
    const url = 'https://wa.me/919328492451?text=Hi, I need help with my Shibra order';
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert('WhatsApp Not Available', 'Please install WhatsApp to contact support.');
  };

  const handleCall = () => Linking.openURL('tel:+919328492451');
  const handleEmail = () => Linking.openURL('mailto:support@shibra.in');

  const comingSoon = (feature: string) => Alert.alert('Coming Soon', `${feature} will be available soon!`);

  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    setLoadingRecent(true);
    try {
      const response = await apiClient.get('/orders/recently-ordered?limit=10');
      if (response.success) {
        setRecentProducts(response.products);
      }
    } catch (error) {
      console.log('Error fetching recent orders:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const navigateToPolicy = (title: string, policyKey: any) => {
    navigation.navigate('PolicyViewer', { title, policyKey });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ===== PROFILE CARD ===== */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Icon name="account" size={36} color={COLORS.textMuted} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileContact}>
                {user?.email || `+91 ${user?.phone || ''}`}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Icon name="pencil-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsRow}>
            <QuickAction iconName="bell-outline" label="Notifications" onPress={() => navigation.navigate('Notifications')} />
            <QuickAction iconName="shopping-outline" label="Orders" onPress={() => navigation.navigate('Orders')} />
            <QuickAction iconName="map-marker-outline" label="Address" onPress={() => navigation.navigate('AddressList')} />
          </View>
        </View>

        {/* ===== RECENTLY ORDERED SECTION ===== */}
        {recentProducts.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recently Ordered</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
              {recentProducts.map((product) => (
                <View key={product._id} style={styles.recentProductCard}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                    style={{ alignItems: 'center', width: '100%' }}
                  >
                    <View style={styles.recentProductImageContainer}>
                      {product.images && product.images.length > 0 ? (
                        <Image source={{ uri: product.images[0] }} style={styles.recentProductImage} resizeMode="contain" />
                      ) : (
                        <Icon name="package-variant" size={24} color={COLORS.textMuted} />
                      )}
                    </View>
                    <Text style={styles.recentProductName} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.recentProductPrice}>₹{product.salePrice || product.price}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.reorderButton}
                    onPress={async () => {
                      if (product.hasVariants) {
                        navigation.navigate('ProductDetails', { productId: product._id });
                        return;
                      }
                      try {
                        await dispatch(addToCart({ productId: product._id, quantity: product.minOrderQty || 1 })).unwrap();
                        navigation.navigate('Cart');
                      } catch (error) {
                        console.error('Failed to reorder:', error);
                        // Optionally show a toast here if you have one
                      }
                    }}
                  >
                    <Text style={styles.reorderText}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ===== ORDERS SECTION ===== */}
        <View style={styles.sectionCard}>
          <SectionHeader title="Orders" />
          <MenuItem iconName="cart-outline" title="My Cart" onPress={() => navigation.navigate('Checkout')} />
          <MenuItem iconName="shopping-outline" title="Orders" onPress={() => navigation.navigate('Orders')} />
          <MenuItem iconName="map-marker-outline" title="Addresses" onPress={() => navigation.navigate('AddressList')} />
          <MenuItem iconName="format-list-bulleted" title="Recently Ordered" onPress={() => navigation.navigate('Orders')} />
        </View>

        {/* ===== SUPPORT SECTION ===== */}
        <View style={styles.sectionCard}>
          <SectionHeader title="Support" />
          <MenuItem iconName="phone-outline" title="Call Us" onPress={handleCall} />
          <MenuItem iconName="email-outline" title="Email Us" onPress={handleEmail} />
          <MenuItem iconName="whatsapp" iconColor="#25D366" title="WhatsApp Us" onPress={handleWhatsApp} />
          <MenuItem iconName="qrcode-scan" title="Payment QR Code" onPress={() => navigation.navigate('PaymentQr')} />
          <MenuItem iconName="translate" title="Change Language" onPress={() => comingSoon('Language')} />
        </View>

        {/* ===== LEGAL SECTION ===== */}
        <View style={styles.sectionCard}>
          <SectionHeader title="Legal" />
          <MenuItem iconName="truck-delivery-outline" title="Shipping Policy" onPress={() => navigateToPolicy('Shipping Policy', 'shippingPolicy')} />
          <MenuItem iconName="cash-refund" title="Refund Policy" onPress={() => navigateToPolicy('Refund Policy', 'refundPolicy')} />
          <MenuItem iconName="keyboard-return" title="Return Policy" onPress={() => navigateToPolicy('Return Policy', 'returnPolicy')} />
          <MenuItem iconName="close-circle-outline" title="Cancellation Policy" onPress={() => navigateToPolicy('Cancellation Policy', 'cancellationPolicy')} />
          <MenuItem iconName="shield-check-outline" title="Privacy Policy" onPress={() => navigateToPolicy('Privacy Policy', 'privacyPolicy')} />
          <MenuItem iconName="file-document-outline" title="Terms and Conditions" onPress={() => navigateToPolicy('Terms and Conditions', 'termsAndConditions')} />
        </View>

        {/* ===== MORE SECTION ===== */}
        <View style={styles.sectionCard}>
          <SectionHeader title="More" />
          <MenuItem iconName="newspaper-variant-outline" title="Blogs & News" onPress={() => navigation.navigate('Blogs')} />
          <MenuItem iconName="tag-outline" title="Offers" onPress={() => navigation.navigate('Offers')} />
          <MenuItem iconName="star-outline" title="Rate Us" onPress={() => {
            const storeUrl = Platform.OS === 'ios' 
              ? 'itms-apps://itunes.apple.com/app/id6776185375?action=write-review' 
              : 'market://details?id=com.shibra.wholesale';
            Linking.openURL(storeUrl).catch(() => {
              const fallbackUrl = Platform.OS === 'ios'
                ? 'https://apps.apple.com/app/id6776185375'
                : 'https://play.google.com/store/apps/details?id=com.shibra.wholesale';
              Linking.openURL(fallbackUrl).catch(() => Alert.alert('Error', 'Could not open store.'));
            });
          }} />
        </View>

        {/* ===== LOGOUT ===== */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Icon name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* ===== DELETE ACCOUNT ===== */}
        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <Icon name="delete-outline" size={20} color={COLORS.white} />
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.1.8</Text>
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  scrollContent: {
    flex: 1,
  },

  // ===== PROFILE CARD =====
  profileCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: SPACING.radius.lg,
    padding: SPACING.lg,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  profileContact: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },

  // ===== RECENTLY ORDERED SECTION =====
  recentSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: SPACING.radius.lg,
    paddingVertical: SPACING.md,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  recentTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  reorderButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  reorderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  recentProductImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  recentScroll: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  recentProductCard: {
    width: 100,
    marginRight: SPACING.md,
    alignItems: 'center',
  },
  recentProductImageContainer: {
    width: 80,
    height: 80,
    borderRadius: SPACING.radius.md,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  recentProductName: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textPrimary,
    textAlign: 'center',
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: 2,
  },
  recentProductPrice: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '700',
  },

  // ===== SECTION CARDS =====
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: SPACING.radius.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  // ===== MENU ITEMS =====
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.xs,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textPrimary,
    fontWeight: '400',
  },

  // ===== LOGOUT =====
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    borderRadius: SPACING.radius.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  logoutText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
  
  // ===== DELETE ACCOUNT =====
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: SPACING.radius.lg,
    paddingVertical: SPACING.md,
  },
  deleteAccountText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
  versionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});

export default ProfileScreen;