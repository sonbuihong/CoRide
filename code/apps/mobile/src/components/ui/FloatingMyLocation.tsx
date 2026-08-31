import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated';
import { Locate, LocateFixed } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme/tokens';
import * as Location from 'expo-location';

interface FloatingMyLocationProps {
  onRecenter: (location: Location.LocationObjectCoords) => void;
  isCentered?: boolean;
  animatedPosition: SharedValue<number>;
}

export function FloatingMyLocation({ onRecenter, isCentered = false, animatedPosition }: FloatingMyLocationProps) {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionGranted(status === 'granted');
    })();
  }, []);

  const handlePress = async () => {
    let hasPerm = permissionGranted;
    if (!hasPerm) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      hasPerm = status === 'granted';
      setPermissionGranted(hasPerm);
    }

    if (hasPerm) {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        onRecenter(location.coords);
      } catch (e) {
        console.warn('Could not get location', e);
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    // animatedPosition is the Y coordinate from the top of the screen.
    // We want the button to float above the sheet.
    return {
      top: animatedPosition.value - 64, // 64px above the sheet
      opacity: interpolate(
        animatedPosition.value,
        [50, 150], // If sheet is near the top (expanded), fade out
        [0, 1],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            animatedPosition.value,
            [50, 150],
            [0.8, 1],
            Extrapolation.CLAMP
          )
        }
      ],
      // When invisible, don't intercept touches
      pointerEvents: animatedPosition.value < 100 ? 'none' : 'auto',
    } as any;
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {isCentered ? (
          <LocateFixed size={24} color={colors.navigationPassenger || '#0071E3'} />
        ) : (
          <Locate size={24} color={colors.textSecondary || '#6B7280'} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 50,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface || '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  }
});
