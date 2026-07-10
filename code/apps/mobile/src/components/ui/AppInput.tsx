import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { AppText } from './AppText';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  return (
    <View className={`mb-4 ${className}`}>
      {label && <AppText weight="medium" className="mb-2 text-text-primary">{label}</AppText>}
      <View className={`flex-row items-center bg-gray-100 ${error ? 'border border-status-danger' : ''} px-4 rounded-xl min-h-[56px]`}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-text-primary text-base"
          placeholderTextColor="#94A3B8" // text-disabled
          {...props}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      {error && <AppText variant="caption" className="text-status-danger mt-1">{error}</AppText>}
    </View>
  );
};
