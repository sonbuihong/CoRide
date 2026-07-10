import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient as api } from '../src/api/client';
import { ShieldAlert, X } from 'lucide-react-native';

export default function ReportModalScreen() {
  const { reportedId, rideId } = useLocalSearchParams<{ reportedId: string; rideId?: string }>();
  const router = useRouter();

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const predefinedReasons = [
    'Tài xế lái xe không an toàn',
    'Thái độ không phù hợp',
    'Chuyến đi không đúng lộ trình',
    'Thu thêm phí ngoài hệ thống',
    'Khác'
  ];

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Lỗi', 'Vui lòng chọn hoặc nhập lý do báo cáo');
      return;
    }

    setLoading(true);
    try {
      await api.post('/reports', {
        reportedId,
        rideId,
        reason,
        description,
      });
      Alert.alert('Thành công', 'Cảm ơn bạn đã gửi báo cáo. Chúng tôi sẽ xử lý sớm nhất có thể.', [
        { text: 'Đóng', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-900">Báo cáo vi phạm</Text>
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-100 rounded-full">
          <X size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
            <ShieldAlert size={32} color="#dc2626" />
          </View>
          <Text className="text-center text-gray-600">
            Hệ thống sẽ ghi nhận và xử lý nghiêm các trường hợp vi phạm quy định cộng đồng của CoRide.
          </Text>
        </View>

        <Text className="font-semibold text-gray-800 mb-3 text-base">Lý do báo cáo</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {predefinedReasons.map((r, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setReason(r)}
              className={`px-4 py-2 rounded-full border ${reason === r ? 'bg-red-50 border-red-500' : 'bg-white border-gray-300'}`}
            >
              <Text className={reason === r ? 'text-red-600 font-medium' : 'text-gray-600'}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="font-semibold text-gray-800 mb-3 text-base">Chi tiết thêm (tùy chọn)</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 mb-6 h-32"
          placeholder="Mô tả chi tiết sự việc..."
          multiline
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity 
          className="bg-red-600 rounded-full p-4 flex-row justify-center items-center shadow-md"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Gửi báo cáo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
