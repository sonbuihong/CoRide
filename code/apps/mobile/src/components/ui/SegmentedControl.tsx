import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '../../theme/tokens';

export interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  activeColor?: 'passenger' | 'driver' | 'primary';
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  selectedIndex,
  onChange,
  style,
  activeColor = 'primary',
}) => {
  const activeTextColors = {
    primary: colors.navigationPassenger,
    passenger: colors.navigationPassenger,
    driver: colors.navigationDriver,
  };

  return (
    <View style={[styles.container, style]} accessibilityRole="tablist">
      {segments.map((segment, index) => {
        const isSelected = selectedIndex === index;
        return (
          <Pressable
            key={`${segment}-${index}`}
            onPress={() => onChange(index)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={segment}
            style={({ pressed }) => [
              styles.segment,
              isSelected && styles.segmentSelected,
              pressed && styles.segmentPressed,
            ]}
          >
            <AppText 
              variant="bodySmall" 
              weight={isSelected ? 'semibold' : 'medium'}
              style={{ color: isSelected ? activeTextColors[activeColor] : colors.textSecondary }}
            >
              {segment}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.input,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radius.input,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.xs,
  },
  segmentSelected: {
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  segmentPressed: { opacity: 0.72 },
});
