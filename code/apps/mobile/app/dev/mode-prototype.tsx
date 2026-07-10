import React, { useState } from 'react';
import { View, TouchableOpacity, SafeAreaView } from 'react-native';
import { AppText } from '../../src/components/ui/AppText';
import { MOCK_USER_NO_KYC, MOCK_USER_KYC_PENDING, MOCK_USER_KYC_REJECTED, MOCK_USER_KYC_APPROVED } from '../../src/fixtures/mock-profiles';
import ProfileContent from '../../src/screens/ProfileContent';
import { useRouter } from 'expo-router';
import { User } from '../../src/services/auth.service';

export default function DevModePrototype() {
  const router = useRouter();
  const [mockUser, setMockUser] = useState<User | null>(MOCK_USER_NO_KYC);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4 border-b border-border bg-surface">
        <AppText variant="h2" weight="bold" className="mb-2">Dev: Test Profile States</AppText>
        <AppText variant="caption" className="mb-4 text-text-secondary">
          Bấm vào các nút dưới đây để inject trạng thái giả lập vào Profile component. Không lưu vào cache thật.
        </AppText>
        <View className="flex-row flex-wrap gap-2">
          <TouchableOpacity 
            className="bg-primary/10 px-3 py-2 rounded-lg"
            onPress={() => setMockUser(MOCK_USER_NO_KYC)}
          >
            <AppText variant="caption" className="text-primary">1. Chưa KYC</AppText>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-status-warning/10 px-3 py-2 rounded-lg"
            onPress={() => setMockUser(MOCK_USER_KYC_PENDING)}
          >
            <AppText variant="caption" className="text-status-warning">2. Đang chờ (Pending)</AppText>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-status-danger/10 px-3 py-2 rounded-lg"
            onPress={() => setMockUser(MOCK_USER_KYC_REJECTED)}
          >
            <AppText variant="caption" className="text-status-danger">3. Bị từ chối (Rejected)</AppText>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-status-success/10 px-3 py-2 rounded-lg"
            onPress={() => setMockUser(MOCK_USER_KYC_APPROVED)}
          >
            <AppText variant="caption" className="text-status-success">4. Đã duyệt (Approved)</AppText>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-border px-3 py-2 rounded-lg"
            onPress={() => router.back()}
          >
            <AppText variant="caption" className="text-text-primary">Thoát</AppText>
          </TouchableOpacity>
        </View>
      </View>
      <View className="flex-1">
        <ProfileContent user={mockUser} isPrototype={true} />
      </View>
    </SafeAreaView>
  );
}
