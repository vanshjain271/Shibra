import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, ScrollView } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

interface TickerProps {
  text: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Ticker: React.FC<TickerProps> = ({ text }) => {
  const animatedValue = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (textWidth > 0) {
      startAnimation();
    }
  }, [text, textWidth]);

  const startAnimation = () => {
    animatedValue.stopAnimation();
    animatedValue.setValue(SCREEN_WIDTH);
    
    // Constant speed calculation (pixels per millisecond)
    const distanceToTravel = SCREEN_WIDTH + textWidth;
    const speed = 50; // pixels per second
    const duration = (distanceToTravel / speed) * 1000;

    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: -textWidth,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        bounces={false} 
        showsHorizontalScrollIndicator={false} 
        scrollEnabled={false}
      >
        <Animated.View
          style={[
            styles.textWrapper,
            { transform: [{ translateX: animatedValue }] },
          ]}
        >
          <Text 
            onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
            style={styles.text} 
            numberOfLines={1}
          >
            {text}
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primarySoft,
    paddingVertical: 8,
    width: '100%',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    height: 36, // Set explicit height to prevent layout shifts
  },
  textWrapper: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primaryDark,
    fontWeight: '700',
    paddingHorizontal: 20,
    letterSpacing: 0.5,
  },
});

export default Ticker;
