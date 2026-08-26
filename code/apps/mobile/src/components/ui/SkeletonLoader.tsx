import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className = '',
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => {
      animation.stop();
      opacity.setValue(0.3);
    };
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-slate-200 ${className}`}
      accessibilityRole="progressbar"
      accessibilityLabel="Đang tải dữ liệu"
      style={[
        { width: width as any, height: height as any, borderRadius },
        { opacity },
      ]}
    />
  );
};
