import React from 'react';
import { View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onAction?: () => void;
  fullScreen?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không có dữ liệu',
  description,
  icon = <Inbox size={48} color="#94A3B8" />,
  actionTitle,
  onAction,
  fullScreen = false
}) => {
  const containerStyle = fullScreen 
    ? 'flex-1 justify-center items-center p-6 bg-background'
    : 'justify-center items-center py-10 px-6';

  return (
    <View className={containerStyle}>
      <View className="mb-4 opacity-70">{icon}</View>
      
      <AppText variant="h2" weight="bold" className="text-text-primary mb-2 text-center">
        {title}
      </AppText>
      
      {description && (
        <AppText variant="body" className="text-center text-text-secondary mb-6">
          {description}
        </AppText>
      )}

      {actionTitle && onAction && (
        <AppButton 
          title={actionTitle}
          onPress={onAction}
          variant="secondary"
        />
      )}
    </View>
  );
};
