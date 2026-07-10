import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { AlertCircle } from 'lucide-react-native';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
  onRetry,
  fullScreen = false
}) => {
  const containerStyle = fullScreen 
    ? 'flex-1 justify-center items-center bg-background px-6'
    : 'justify-center items-center py-8 px-6';

  return (
    <View className={containerStyle}>
      <AlertCircle size={48} color="#EF4444" className="mb-4" />
      <AppText className="text-center text-text-primary mb-6" variant="title">
        {message}
      </AppText>
      
      {onRetry && (
        <AppButton 
          title="Thử lại" 
          onPress={onRetry} 
          variant="outline" 
          className="w-full max-w-xs" 
        />
      )}
    </View>
  );
};
