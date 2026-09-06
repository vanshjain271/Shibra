import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

export type SkeletonType = 'product' | 'cart' | 'order' | 'text' | 'circle' | 'rectangle';

export interface SkeletonProps {
  type?: SkeletonType;
  count?: number;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

const LoadingSkeleton: React.FC<SkeletonProps> = ({
  type = 'rectangle',
  count = 1,
  width = '100%',
  height = 20,
  borderRadius = SPACING.radius.md,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const renderSkeleton = () => {
    switch (type) {
      case 'product':
        return <ProductSkeleton opacity={opacity} />;
      case 'cart':
        return <CartItemSkeleton opacity={opacity} />;
      case 'order':
        return <OrderCardSkeleton opacity={opacity} />;
      case 'text':
        return <TextSkeleton opacity={opacity} width={width} height={height} />;
      case 'circle':
        return (
          <Animated.View
            style={[
              styles.skeleton,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { width, height, borderRadius: (height as number) / 2, opacity } as any,
              style,
            ]}
          />
        );
      case 'rectangle':
      default:
        return (
          <Animated.View
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={[styles.skeleton, { width, height, borderRadius, opacity } as any, style]}
          />
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={type === 'product' ? { width: '48%' } : { width: '100%' }}>
          {renderSkeleton()}
        </View>
      ))}
    </>
  );
};

// Product Card Skeleton
const ProductSkeleton: React.FC<{ opacity: Animated.AnimatedInterpolation<number> }> = ({
  opacity,
}) => (
  <View style={styles.productContainer}>
    <Animated.View style={[styles.productImage, { opacity }]} />
    <Animated.View style={[styles.productLine, { width: '100%', opacity }]} />
    <Animated.View style={[styles.productLine, { width: '60%', opacity }]} />
    <Animated.View style={[styles.productLine, { width: '40%', opacity }]} />
  </View>
);

// Cart Item Skeleton
const CartItemSkeleton: React.FC<{ opacity: Animated.AnimatedInterpolation<number> }> = ({
  opacity,
}) => (
  <View style={styles.cartContainer}>
    <Animated.View style={[styles.cartImage, { opacity }]} />
    <View style={styles.cartInfo}>
      <Animated.View style={[styles.cartLine, { width: '80%', opacity }]} />
      <Animated.View style={[styles.cartLine, { width: '50%', opacity }]} />
      <Animated.View style={[styles.cartLine, { width: '60%', opacity }]} />
    </View>
  </View>
);

// Order Card Skeleton
const OrderCardSkeleton: React.FC<{ opacity: Animated.AnimatedInterpolation<number> }> = ({
  opacity,
}) => (
  <View style={styles.orderContainer}>
    <View style={styles.orderHeader}>
      <Animated.View style={[styles.orderLine, { width: '40%', opacity }]} />
      <Animated.View style={[styles.orderBadge, { opacity }]} />
    </View>
    <Animated.View style={[styles.orderLine, { width: '60%', opacity }]} />
    <Animated.View style={[styles.orderLine, { width: '30%', opacity }]} />
  </View>
);

// Text Skeleton
const TextSkeleton: React.FC<{
  opacity: Animated.AnimatedInterpolation<number>;
  width: number | string;
  height: number | string;
}> = ({ opacity, width, height }) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <Animated.View style={[styles.textSkeleton, { width, height, opacity } as any]} />
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.border,
  },
  productContainer: {
    width: '100%',
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.border,
    borderRadius: SPACING.radius.md,
    marginBottom: SPACING.sm,
  },
  productLine: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: SPACING.radius.sm,
    marginBottom: SPACING.xs,
  },
  cartContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.radius.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cartImage: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.border,
    borderRadius: SPACING.radius.md,
    marginRight: SPACING.md,
  },
  cartInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cartLine: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: SPACING.radius.sm,
  },
  orderContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.radius.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  orderLine: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: SPACING.radius.sm,
    marginBottom: SPACING.xs,
  },
  orderBadge: {
    width: 60,
    height: 24,
    backgroundColor: COLORS.border,
    borderRadius: SPACING.radius.sm,
  },
  textSkeleton: {
    backgroundColor: COLORS.border,
    borderRadius: SPACING.radius.sm,
    marginBottom: SPACING.xs,
  },
});

export default LoadingSkeleton;
