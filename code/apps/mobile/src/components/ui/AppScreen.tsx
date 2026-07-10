import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ViewProps } from 'react-native';

export interface AppScreenProps extends ViewProps {
  safeArea?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const AppScreen: React.FC<AppScreenProps> = ({
  safeArea = true,
  className = '',
  children,
  ...props
}) => {
  const baseStyle = 'flex-1 bg-white dark:bg-slate-900';

  if (safeArea) {
    return (
      <SafeAreaView className={`${baseStyle} ${className}`} {...props}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View className={`${baseStyle} ${className}`} {...props}>
      {children}
    </View>
  );
};
