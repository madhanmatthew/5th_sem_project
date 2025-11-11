// components/Shimmer.js
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

export const Shimmer = ({ style, borderRadius = 8 }) => {
  const x = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.linear })
    );
    loop.start();
    return () => loop.stop();
  }, [x]);

  const translate = x.interpolate({ inputRange: [-1, 1], outputRange: [-200, 200] });
  return (
    // Use darker shimmer colors
    <View style={[{ backgroundColor: '#2C2C2C', overflow: 'hidden', borderRadius }, style]}>
      <Animated.View
        style={{
          position: 'absolute',
          left: -200,
          top: 0,
          bottom: 0,
          width: 120,
          transform: [{ translateX: translate }],
          backgroundColor: 'rgba(255,255,255,0.1)', // Brighter shimmer
        }}
      />
    </View>
  );
};