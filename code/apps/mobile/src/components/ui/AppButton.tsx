import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { AppText } from './AppText';

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'passenger' | 'driver';
  isLoading?: boolean;
  className?: string;
  textClassName?: string;
  leftIcon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
  textClassName = '',
  accessibilityLabel,
  leftIcon,
  ...props
}) => {
  const baseStyle = 'rounded-xl flex-row justify-center items-center py-4 px-6 active:opacity-85 min-h-[56px]';
  
  const variantStyles = {
    primary: 'bg-passenger active:bg-passenger-pressed',
    passenger: 'bg-passenger active:bg-passenger-pressed',
    driver: 'bg-driver active:bg-driver-pressed',
    secondary: 'bg-passenger-soft active:bg-passenger/20',
    outline: 'bg-surface border border-border-strong active:bg-background',
    ghost: 'bg-transparent active:bg-background',
    danger: 'bg-status-danger active:bg-red-700',
  };

  const textVariantStyles = {
    primary: 'text-surface font-semibold',
    passenger: 'text-surface font-semibold',
    driver: 'text-surface font-semibold',
    secondary: 'text-passenger font-semibold',
    outline: 'text-text-primary font-semibold',
    ghost: 'text-text-primary font-semibold',
    danger: 'text-surface font-semibold',
  };

  const isDisabled = disabled || isLoading;
  const disabledStyle = isDisabled ? 'opacity-40' : '';

  const getIndicatorColor = () => {
    if (variant === 'outline' || variant === 'ghost' || variant === 'secondary') {
      return '#3B82F6';
    }
    return '#ffffff';
  };

  return (
    <TouchableOpacity
      className={`${baseStyle} ${variantStyles[variant]} ${disabledStyle} ${className}`}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      accessibilityLabel={accessibilityLabel || title}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getIndicatorColor()} />
      ) : (
        <>
          {leftIcon}
          <AppText variant="button" className={`${textVariantStyles[variant]} ${textClassName}`}>
            {title}
          </AppText>
        </>
      )}
    </TouchableOpacity>
  );
};
