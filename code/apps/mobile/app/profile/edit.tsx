import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useForm as useRHForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, UpdateProfileInput } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useAuth, authKeys } from '../../src/hooks/useAuth';
import { authService } from '../../src/services/auth.service';
import { AppInput } from '../../src/components/ui/AppInput';
import { User, Phone, FileText } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { layout } from '../../src/theme/tokens';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useRHForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: (user as any)?.bio || '',
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      setErrorMsg(null);
      const response = await authService.updateProfile(data as any);
      
      // Update cache
      queryClient.setQueryData(authKeys.me(), response.user);
      
      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      setErrorMsg(error.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ alignSelf: 'center', flexGrow: 1, maxWidth: layout.maxContentWidth, width: '100%' }} className="bg-white px-6 pt-6 pb-10">
        
        {errorMsg && (
          <View className="bg-red-50 p-3 rounded-xl mb-4 border border-red-200">
            <Text className="text-red-600">{errorMsg}</Text>
          </View>
        )}

        <View className="flex-row space-x-4 mb-4">
          <View className="flex-1 mr-2">
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Họ"
                  placeholder="Họ"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.lastName?.message}
                  leftIcon={<User size={20} color={errors.lastName ? '#EF4444' : '#6B7280'} />}
                />
              )}
            />
          </View>
          <View className="flex-1 ml-2">
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Tên"
                  placeholder="Tên"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.firstName?.message}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Số điện thoại"
              placeholder="Ví dụ: 0912345678"
              keyboardType="phone-pad"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
              leftIcon={<Phone size={20} color={errors.phone ? '#EF4444' : '#6B7280'} />}
            />
          )}
        />

        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Giới thiệu bản thân"
              placeholder="Mô tả ngắn về bạn"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.bio?.message}
              multiline
              numberOfLines={3}
              leftIcon={<FileText size={20} color={errors.bio ? '#EF4444' : '#6B7280'} style={{ marginTop: -15 }} />}
            />
          )}
        />

        <TouchableOpacity
          className={`w-full p-4 mt-8 rounded-2xl items-center shadow-md ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'}`}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text className="text-white font-bold text-lg">
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
