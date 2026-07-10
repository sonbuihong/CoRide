import React from 'react';
import { View, Text } from 'react-native';
import { AppText } from '../../src/components/ui/AppText';

export default function PublishScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <AppText variant="h2" weight="bold">Đăng chuyến đi</AppText>
      <AppText variant="body" className="mt-2 text-text-secondary">Chức năng đang phát triển</AppText>
    </View>
  );
}
