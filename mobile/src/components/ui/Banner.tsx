import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { COLORS, SPACING } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - (SPACING.lg * 2);
const ASPECT_RATIO = 16 / 9;
const BANNER_HEIGHT = BANNER_WIDTH / ASPECT_RATIO;

interface BannerProps {
  images: string[];
  onPress?: (index: number) => void;
  autoPlay?: boolean;
  interval?: number;
}

const Banner: React.FC<BannerProps> = ({
  images,
  onPress,
  autoPlay = true,
  interval = 4000,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Handled placeholder if no images
  const displayImages = images.length > 0 ? images : [
    'https://placehold.co/800x450/4F46E5/FFFFFF?text=Premium+Mobile+Accessories',
  ];

  useEffect(() => {
    let timer: any;
    if (autoPlay && displayImages.length > 1) {
      timer = setInterval(() => {
        const nextIndex = (activeIndex + 1) % displayImages.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (BANNER_WIDTH + SPACING.md),
          animated: true,
        });
        setActiveIndex(nextIndex);
      }, interval);
    }
    return () => clearInterval(timer);
  }, [activeIndex, autoPlay, displayImages.length, interval]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / (BANNER_WIDTH + SPACING.md));
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        snapToInterval={BANNER_WIDTH + SPACING.md}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {displayImages.map((image, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            style={styles.bannerContainer}
            onPress={() => onPress && onPress(index)}
          >
            <FastImage
              source={{ uri: image }}
              style={styles.bannerImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {displayImages.length > 1 && (
        <View style={styles.pagination}>
          {displayImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: SPACING.radius.lg,
    overflow: 'hidden',
    marginRight: SPACING.md,
    backgroundColor: COLORS.surface,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 16,
    backgroundColor: COLORS.primary,
  },
});

export default Banner;
