import type { ComponentProps } from 'react';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, ScrollView, View, ViewProps } from 'react-native';

export interface AppScreenProps extends ViewProps {
  safeArea?: boolean;
  edges?: Edge[];
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  padded?: boolean;
  contentClassName?: string;
  className?: string;
  children: ComponentProps<typeof SafeAreaView>['children'];
}

export const AppScreen: React.FC<AppScreenProps> = ({
  safeArea = true,
  edges = ['top', 'bottom'],
  scroll = false,
  keyboardAvoiding = false,
  padded = false,
  contentClassName = '',
  className = '',
  children,
  ...props
}) => {
  const baseStyle = 'flex-1 bg-coride-background';
  const contentStyle = `${padded ? 'px-coride-screen' : ''} ${contentClassName}`;
  const content = scroll ? (
    <ScrollView className="flex-1" contentContainerClassName={`grow ${contentStyle}`} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : padded || contentClassName ? (
    <View className={`flex-1 ${contentStyle}`}>{children}</View>
  ) : children;
  const adaptedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {content}
    </KeyboardAvoidingView>
  ) : content;

  if (safeArea) {
    return (
      <SafeAreaView edges={edges} className={`${baseStyle} ${className}`} {...props}>
        {adaptedContent}
      </SafeAreaView>
    );
  }

  return <View className={`${baseStyle} ${className}`} {...props}>{adaptedContent}</View>;
};

export const Screen = AppScreen;
