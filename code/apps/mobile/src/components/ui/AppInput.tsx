import React, { useState } from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { colors } from '../../theme/tokens';
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

  const borderStyle = error
    ? 'border-[2px] border-status-danger'
    : isFocused
    ? 'border-[2px] border-passenger'
    : 'border-[2px] border-[rgba(0,0,0,0.04)]';

  return (
    <View className={`mb-4 ${className}`}>
      {label && <AppText variant="bodySmall" weight="semibold" className="mb-1 text-text-primary">{label}</AppText>}
      <View className={`flex-row items-center bg-surface-muted ${borderStyle} px-4 rounded-[11px] min-h-[48px]`}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-text-primary text-[17px] py-2.5"
          placeholderTextColor={colors.textMuted}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          accessibilityLabel={`${label || props.placeholder}${error ? `. Lỗi: ${error}` : ''}`}
          {...props}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      {error && <AppText variant="caption" className="text-status-danger mt-1">{error}</AppText>}
    </View>
  );
};
