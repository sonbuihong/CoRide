import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ViewProps } from 'react-native';

export interface AppScreenProps extends ViewProps {
  safeArea?: boolean;
  className?: string;
  children: ComponentProps<typeof SafeAreaView>['children'];
}

export const AppScreen: React.FC<AppScreenProps> = ({
  safeArea = true,
  className = '',
  children,
  ...props
}) => {
  const baseStyle = 'flex-1 bg-background';

  if (safeArea) {
    return (
      <SafeAreaView className={`${baseStyle} ${className}`} {...props}>
        {children}
      </SafeAreaView>
    );
  }

  return <View className={`${baseStyle} ${className}`} {...props}>{children}</View>;
};
