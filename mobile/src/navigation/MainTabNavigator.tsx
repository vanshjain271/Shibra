/**
 * Main Tab Navigator — 4 Tabs
 * Home | Categories | Search | Account
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../types/navigation.types';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/main/HomeScreen';
import CategoriesScreen from '../screens/main/CategoriesScreen';
import CatalogScreen from '../screens/main/CatalogScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Categories: { active: 'view-grid', inactive: 'view-grid-outline' },
  Search: { active: 'magnify', inactive: 'magnify' },
  Account: { active: 'account', inactive: 'account-outline' },
};

const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const iconSet = TAB_ICONS[route.name] || { active: 'circle', inactive: 'circle-outline' };
          const iconName = focused ? iconSet.active : iconSet.inactive;
          return <Icon name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: TYPOGRAPHY.fontFamily.medium,
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 6,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: Platform.OS === 'ios' ? 88 : 64 + Math.max(0, insets.bottom - 10),
          paddingBottom: Platform.OS === 'ios' ? 28 : Math.max(0, insets.bottom - 10),
          paddingTop: 6,
          elevation: 8,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        headerStyle: {
          backgroundColor: COLORS.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontFamily: TYPOGRAPHY.fontFamily.bold,
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: '700',
          color: COLORS.secondary,
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false, tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ headerTitle: 'Categories', tabBarLabel: 'Categories' }}
      />
      <Tab.Screen
        name="Search"
        component={CatalogScreen}
        options={{ headerTitle: 'Search Products', tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="Account"
        component={ProfileScreen}
        options={{ headerShown: false, tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
