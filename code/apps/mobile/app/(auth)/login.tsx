import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@repo/shared';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/auth.service';

export default function LoginScreen() {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await authService.login(data);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Lỗi đăng nhập', error.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="px-6 py-12 flex-1 justify-center">
        <View className="items-center mb-12">
          <Text className="text-4xl font-bold text-blue-600">CoRide</Text>
          <Text className="text-gray-500 mt-2">Đăng nhập để tiếp tục hành trình</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 font-medium mb-2">Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`bg-gray-50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} p-4 rounded-xl text-gray-800`}
                  placeholder="name@example.com"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</Text>}
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-2 mt-4">Mật khẩu</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-200'} p-4 rounded-xl text-gray-800`}
                  placeholder="••••••••"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.password && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</Text>}
          </View>

          <TouchableOpacity 
            className="bg-blue-600 p-4 rounded-xl items-center mt-6 shadow-md"
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Text className="text-white font-bold text-lg">
              {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500">Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text className="text-blue-600 font-bold">Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
