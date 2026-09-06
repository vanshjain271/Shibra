import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useAppSelector } from '../../store/hooks';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigationRef } from '../../navigation/navigationRef';

const { width } = Dimensions.get('window');

const FloatingCartBanner = () => {
  const { cart } = useAppSelector((state) => state.cart);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  
  const [currentRoute, setCurrentRoute] = React.useState('');

  // Track route to hide banner on certain screens
  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', () => {
      const currentName = navigationRef.getCurrentRoute()?.name;
      if (currentName) {
        setCurrentRoute(currentName);
      }
    });
    return unsubscribe;
  }, []);

  const translateY = useSharedValue(300);

  const items = cart?.items || [];
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cart?.total || cart?.subtotal || 0;

  // Hidden screens
  const hiddenScreens = ['Cart', 'Checkout', 'PaymentQr', 'OrderDetails', 'ProductDetails'];
  const shouldShow = isAuthenticated && itemCount > 0 && !hiddenScreens.includes(currentRoute);

  useEffect(() => {
    if (shouldShow) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      translateY.value = withTiming(300, { duration: 250 });
    }
  }, [shouldShow, itemCount, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const handlePress = () => {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate('Cart');
    }
  };

  // Determine bottom offset based on whether we are inside a Tab screen or Stack screen
  // If we are on Main tab (Home, Profile, Categories), the bottom tab bar is visible (~80px).
  // Otherwise, we are on a stack screen where the bottom is just the safe area.
  const isTabScreen = ['Home', 'Categories', 'Search', 'Account'].includes(currentRoute);
  const bottomOffset = isTabScreen ? (Platform.OS === 'ios' ? 90 : 70 + insets.bottom) : Math.max(insets.bottom + 16, 16);

  if (!isAuthenticated) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        animatedStyle, 
        { bottom: bottomOffset }
      ]}
      pointerEvents={shouldShow ? 'auto' : 'none'}
    >
      <TouchableOpacity 
        style={styles.banner} 
        activeOpacity={0.8}
        onPress={handlePress}
      >
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Icon name="cart-outline" size={24} color={COLORS.white} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.totalText}>₹{totalAmount.toFixed(2)}</Text>
            <Text style={styles.subText}>{itemCount} item{itemCount !== 1 ? 's' : ''} in cart</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <Icon name="chevron-right" size={20} color={COLORS.white} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9999,
  },
  banner: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  textContainer: {
    justifyContent: 'center',
  },
  totalText: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 16,
  },
  subText: {
    color: COLORS.white,
    opacity: 0.8,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 12,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewCartText: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 13,
    marginRight: 4,
  },
});

export default FloatingCartBanner;
