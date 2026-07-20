import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from './AppText';

export interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  className?: string;
  activeColor?: 'passenger' | 'driver' | 'primary';
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  selectedIndex,
  onChange,
  className = '',
  activeColor = 'primary',
}) => {
  const activeTextColors = {
    primary: 'text-passenger font-semibold',
    passenger: 'text-passenger font-semibold',
    driver: 'text-driver font-semibold',
  };

  return (
    <View 
      className={`flex-row bg-slate-100 p-1 rounded-xl ${className}`}
      accessibilityRole="tablist"
    >
      {segments.map((segment, index) => {
        const isSelected = selectedIndex === index;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => onChange(index)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={segment}
            className={`flex-1 py-2 px-4 rounded-lg items-center justify-center transition-all ${
              isSelected ? 'bg-surface shadow-sm' : 'bg-transparent'
            }`}
          >
            <AppText 
              variant="bodySmall" 
              weight={isSelected ? 'semibold' : 'medium'}
              className={isSelected ? activeTextColors[activeColor] : 'text-text-secondary'}
            >
              {segment}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
