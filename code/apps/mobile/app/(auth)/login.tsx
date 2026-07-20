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
        className="bg-background px-6 pt-16 pb-10" 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
          <AppText variant="h1" weight="bold" className="text-passenger tracking-tight">CoRide</AppText>
        </View>

        <View className="items-center justify-center mb-6">
          <View className="w-24 h-24 bg-passenger-soft rounded-full items-center justify-center">
            <CarFront size={48} color="#3B82F6" strokeWidth={1.5} />
          </View>
        </View>

        <View className="bg-surface p-6 rounded-3xl shadow-sm mb-6 border border-border/40">
          <View className="mb-6">
            <AppText variant="h2" weight="bold" className="text-text-primary mb-1">Chào mừng trở lại</AppText>
            <AppText variant="bodySmall" className="text-text-secondary">Đăng nhập để tiếp tục hành trình của bạn cùng CoRide.</AppText>
          </View>

          {errorMsg && (
            <View className="bg-status-danger/10 p-4 rounded-xl mb-6 border border-status-danger/20">
              <AppText variant="bodySmall" className="text-status-danger font-medium text-center">{errorMsg}</AppText>
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
                  leftIcon={<Mail size={20} color={errors.email ? '#DC2626' : '#64748B'} />}
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
                  leftIcon={<Lock size={20} color={errors.password ? '#DC2626' : '#64748B'} />}
                  rightIcon={
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      className="p-1"
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#64748B" />
                      ) : (
                        <Eye size={20} color="#64748B" />
                      )}
                    </TouchableOpacity>
                  }
                />
              )}
            />
          </View>

          <TouchableOpacity 
            className="self-end mb-6"
            onPress={() => router.push('/(auth)/forgot-password' as any)}
          >
            <AppText variant="bodySmall" weight="semibold" className="text-passenger">Quên mật khẩu?</AppText>
          </TouchableOpacity>

          <AppButton
            title="Đăng nhập"
            variant="passenger"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            className="w-full"
          />
        </View>

        <View className="flex-row justify-center items-center mt-auto pt-6">
          <AppText variant="bodySmall" className="text-text-secondary">Chưa có tài khoản? </AppText>
          <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
            <AppText variant="bodySmall" weight="bold" className="text-passenger">Đăng ký ngay</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
