import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { AppInput } from '../../src/components/ui/AppInput';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { Mail, Lock, Eye, EyeOff, CarFront } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setErrorMsg(null);
      await login(data);
    } catch (error: any) {
      setErrorMsg(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        className="bg-surface px-6 pt-16 pb-10" 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <AppText variant="h2" weight="bold" className="text-primary tracking-tight">CoRide</AppText>
        </View>

        <View className="items-center justify-center mb-10">
          <View className="w-32 h-32 bg-primary-soft rounded-full items-center justify-center mb-4">
            <CarFront size={64} color="#3B82F6" strokeWidth={1.5} />
          </View>
        </View>

        <View className="mb-8">
          <AppText variant="h1" weight="bold" className="text-text-primary mb-2">Chào mừng trở lại</AppText>
          <AppText variant="body" className="text-text-secondary">Đăng nhập để tiếp tục hành trình của bạn cùng CoRide.</AppText>
        </View>

        {errorMsg && (
          <View className="bg-status-danger/10 p-4 rounded-xl mb-6 border border-status-danger/20 flex-row items-center">
            <AppText variant="bodySmall" className="text-status-danger font-medium flex-1">{errorMsg}</AppText>
          </View>
        )}

        <View className="mb-2">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                placeholder="Nhập địa chỉ email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                leftIcon={<Mail size={20} color={errors.email ? '#EF4444' : '#94A3B8'} />}
              />
            )}
          />
        </View>

        <View className="mb-2">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                placeholder="Nhập mật khẩu"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                leftIcon={<Lock size={20} color={errors.password ? '#EF4444' : '#94A3B8'} />}
                rightIcon={
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-1"
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#94A3B8" />
                    ) : (
                      <Eye size={20} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                }
              />
            )}
          />
        </View>

        <TouchableOpacity 
          className="self-end mb-8"
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <AppText variant="bodySmall" weight="medium" className="text-primary">Quên mật khẩu?</AppText>
        </TouchableOpacity>

        <AppButton
          title="Đăng nhập"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          className="w-full mb-6"
        />

        <View className="flex-row justify-center items-center mt-auto pt-6">
          <AppText variant="body" className="text-text-secondary">Chưa có tài khoản? </AppText>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <AppText variant="body" weight="bold" className="text-primary">Đăng ký ngay</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
