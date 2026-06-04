import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@repo/shared';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/auth.service';

export default function RegisterScreen() {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await authService.register(data);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Register error:', error);
      Alert.alert('Lỗi đăng ký', error.response?.data?.message || 'Không thể tạo tài khoản vào lúc này');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="px-6 py-12">
        <View className="mb-10">
          <Text className="text-3xl font-bold text-gray-800">Tạo tài khoản</Text>
          <Text className="text-gray-500 mt-1">Tham gia cộng đồng CoRide ngay hôm nay</Text>
        </View>

        <View className="flex-row space-x-4 mb-4">
          <View className="flex-1 mr-2">
            <Text className="text-gray-700 font-medium mb-2">Họ</Text>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`bg-gray-50 border ${errors.lastName ? 'border-red-500' : 'border-gray-200'} p-4 rounded-xl text-gray-800`}
                  placeholder="Nguyễn"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.lastName && <Text className="text-red-500 text-xs mt-1">{errors.lastName.message}</Text>}
          </View>

          <View className="flex-1">
            <Text className="text-gray-700 font-medium mb-2">Tên</Text>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`bg-gray-50 border ${errors.firstName ? 'border-red-500' : 'border-gray-200'} p-4 rounded-xl text-gray-800`}
                  placeholder="An"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.firstName && <Text className="text-red-500 text-xs mt-1">{errors.firstName.message}</Text>}
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`bg-gray-50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} p-4 rounded-xl text-gray-800`}
                placeholder="email@example.com"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>}
        </View>

        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Số điện thoại (tùy chọn)</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`bg-gray-50 border ${errors.phone ? 'border-red-500' : 'border-gray-200'} p-4 rounded-xl text-gray-800`}
                placeholder="0912345678"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="phone-pad"
              />
            )}
          />
          {errors.phone && <Text className="text-red-500 text-xs mt-1">{errors.phone.message}</Text>}
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-2">Mật khẩu</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-200'} p-4 rounded-xl text-gray-800`}
                placeholder="Ít nhất 6 ký tự"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.password && <Text className="text-red-500 text-xs mt-1">{errors.password.message}</Text>}
        </View>

        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-xl items-center shadow-md"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text className="text-white font-bold text-lg">
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-8 mb-10">
          <Text className="text-gray-500">Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-600 font-bold">Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
