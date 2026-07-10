import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AppText } from './AppText';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Đang tải...', 
  fullScreen = false 
}) => {
  const containerStyle = fullScreen 
    ? 'flex-1 justify-center items-center bg-background'
    : 'justify-center items-center py-8';

  return (
    <View className={containerStyle}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <AppText variant="body" className="mt-4 text-text-secondary">{message}</AppText>
    </View>
  );
};
