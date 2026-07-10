import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from './AppText';

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  selectedIndex,
  onChange,
  className = '',
}) => {
  return (
    <View className={`flex-row bg-border p-1 rounded-xl ${className}`}>
      {segments.map((segment, index) => {
        const isSelected = selectedIndex === index;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => onChange(index)}
            className={`flex-1 py-2 px-4 rounded-lg items-center justify-center ${isSelected ? 'bg-surface shadow-sm' : 'bg-transparent'}`}
          >
            <AppText 
              variant="bodySmall" 
              weight={isSelected ? 'bold' : 'medium'}
              className={isSelected ? 'text-text-primary' : 'text-text-secondary'}
            >
              {segment}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
