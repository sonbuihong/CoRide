import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra khi gửi email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ mã OTP và mật khẩu mới');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setStep(3);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-16 pb-8">
          {step === 1 && (
            <View className="flex-1 justify-center">
              <TouchableOpacity onPress={() => router.back()} className="mb-6 flex-row items-center">
                <ArrowLeft size={24} color="#0071e3" />
                <Text className="text-blue-600 ml-2 font-medium">Quay lại</Text>
              </TouchableOpacity>
              
              <Text className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu?</Text>
              <Text className="text-gray-500 mb-8">Nhập email của bạn để nhận mã xác minh OTP.</Text>
              
              <Text className="text-gray-700 font-semibold mb-2">Địa chỉ Email</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 text-base"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TouchableOpacity 
                className="bg-blue-600 rounded-full p-4 flex-row justify-center items-center"
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">Gửi mã OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View className="flex-1 justify-center">
              <TouchableOpacity onPress={() => setStep(1)} className="mb-6 flex-row items-center">
                <ArrowLeft size={24} color="#0071e3" />
                <Text className="text-blue-600 ml-2 font-medium">Đổi email</Text>
              </TouchableOpacity>
              
              <Text className="text-3xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu</Text>
              <Text className="text-gray-500 mb-8">Nhập mã OTP gồm 6 chữ số được gửi đến <Text className="font-bold text-gray-800">{email}</Text></Text>
              
              <Text className="text-gray-700 font-semibold mb-2">Mã OTP</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4 text-center text-2xl tracking-widest font-mono"
                placeholder="------"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              
              <Text className="text-gray-700 font-semibold mb-2 mt-2">Mật khẩu mới</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 text-base"
                placeholder="Ít nhất 6 ký tự"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              
              <TouchableOpacity 
                className="bg-blue-600 rounded-full p-4 flex-row justify-center items-center"
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">Cập nhật mật khẩu</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View className="flex-1 justify-center items-center">
              <CheckCircle size={80} color="#34c759" className="mb-6" />
              <Text className="text-3xl font-bold text-gray-900 mb-4">Thành công!</Text>
              <Text className="text-gray-500 mb-10 text-center text-base">
                Mật khẩu của bạn đã được đặt lại thành công.
              </Text>
              
              <TouchableOpacity 
                className="bg-blue-600 rounded-full p-4 w-full flex-row justify-center items-center"
                onPress={() => router.replace('/login')}
              >
                <Text className="text-white font-bold text-lg">Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
