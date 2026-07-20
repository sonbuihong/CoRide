import React, { useState } from 'react';
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
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const borderStyle = error
    ? 'border border-status-danger'
    : isFocused
    ? 'border border-passenger'
    : 'border border-transparent';

  return (
    <View className={`mb-4 ${className}`}>
      {label && <AppText weight="medium" className="mb-2 text-text-primary">{label}</AppText>}
      <View className={`flex-row items-center bg-slate-100 ${borderStyle} px-4 rounded-xl min-h-[56px] transition-all`}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-text-primary text-base py-3"
          placeholderTextColor="#94A3B8"
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={`${label || props.placeholder}${error ? `. Lỗi: ${error}` : ''}`}
          {...props}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      {error && <AppText variant="caption" className="text-status-danger mt-1">{error}</AppText>}
    </View>
  );
};
