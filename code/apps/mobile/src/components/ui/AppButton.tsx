import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { AppText } from './AppText';

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
  className?: string;
  textClassName?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
  textClassName = '',
  ...props
}) => {
  const baseStyle = 'rounded-xl flex-row justify-center items-center py-4 px-6 active:opacity-80 min-h-[56px]';
  
  const variantStyles = {
    primary: 'bg-primary active:bg-primary-pressed',
    secondary: 'bg-secondary',
    outline: 'bg-surface border border-border-strong active:bg-background',
    ghost: 'bg-transparent active:bg-background',
    danger: 'bg-status-danger',
  };

  const textVariantStyles = {
    primary: 'text-surface font-semibold',
    secondary: 'text-surface font-medium',
    outline: 'text-text-primary font-semibold',
    ghost: 'text-text-primary font-semibold',
    danger: 'text-surface font-semibold',
  };

  const isDisabled = disabled || isLoading;
  const disabledStyle = isDisabled ? 'opacity-50' : '';

  return (
    <TouchableOpacity
      className={`${baseStyle} ${variantStyles[variant]} ${disabledStyle} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={(variant === 'outline' || variant === 'ghost') ? '#3B82F6' : '#ffffff'} />
      ) : (
        <AppText variant="button" className={`${textVariantStyles[variant]} ${textClassName}`}>
          {title}
        </AppText>
      )}
    </TouchableOpacity>
  );
};
