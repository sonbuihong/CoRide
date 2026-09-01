import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { rideService } from '../src/services/ride.service';
import { bookingService } from '../src/services/booking.service';
import { XCircle, X } from 'lucide-react-native';

export default function CancelModalScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: 'ride' | 'booking' }>();
  const router = useRouter();

  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const predefinedReasons = type === 'ride' ? [
    'Xe gặp sự cố',
    'Kẹt xe / Thời tiết xấu',
    'Có việc đột xuất',
    'Khác'
  ] : [
    'Tôi đã tìm được xe khác',
    'Kế hoạch thay đổi',
    'Chờ quá lâu',
    'Khác'
  ];

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Lỗi', 'Vui lòng chọn hoặc nhập lý do hủy');
      return;
    }

    setLoading(true);
    try {
      if (type === 'ride') {
        await rideService.updateRideStatus(id, 'CANCELLED', reason);
      } else {
        await bookingService.cancelBooking(id, reason);
      }
      
      Alert.alert('Thành công', 'Đã hủy thành công', [
        { text: 'Đóng', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể hủy lúc này');
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
        <Text className="text-lg font-bold text-gray-900">
          {type === 'ride' ? 'Hủy chuyến đi' : 'Hủy đặt chỗ'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-100 rounded-full">
          <X size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
            <XCircle size={32} color="#dc2626" />
          </View>
          <Text className="text-center text-gray-600">
            Hủy chuyến thường xuyên có thể ảnh hưởng đến đánh giá tài khoản của bạn.
          </Text>
        </View>

        <Text className="font-semibold text-gray-800 mb-3 text-base">Lý do hủy</Text>
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

        <Text className="font-semibold text-gray-800 mb-3 text-base">Nhập lý do khác (nếu có)</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 mb-6 h-32"
          placeholder="Lý do của bạn..."
          multiline
          textAlignVertical="top"
          value={reason}
          onChangeText={setReason}
        />

        <TouchableOpacity 
          className="bg-red-600 rounded-full p-4 flex-row justify-center items-center shadow-md"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Xác nhận hủy</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
