import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { AppInput } from '../../src/components/ui/AppInput';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phone: '' },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setErrorMsg(null);
      const { confirmPassword, ...payload } = data;
      await register(payload as any);
      
      Alert.alert('Thành công', 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error: any) {
      setErrorMsg(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-background px-6 pt-12 pb-10" keyboardShouldPersistTaps="handled">
        <AppText variant="h2" weight="bold" className="text-text-primary mb-2">Tạo tài khoản mới</AppText>
        <AppText variant="body" className="text-text-secondary mb-6">Tham gia CoRide để chia sẻ hành trình</AppText>

        {errorMsg && (
          <View className="bg-status-danger/10 p-4 rounded-xl mb-6 border border-status-danger/20">
            <AppText variant="bodySmall" className="text-status-danger font-medium">{errorMsg}</AppText>
          </View>
        )}

        <View className="flex-row space-x-4 mb-1">
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
                  leftIcon={<User size={20} color={errors.lastName ? '#EF4444' : '#64748B'} />}
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
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Email"
              placeholder="Nhập địa chỉ email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              leftIcon={<Mail size={20} color={errors.email ? '#EF4444' : '#64748B'} />}
            />
          )}
        />

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
              leftIcon={<Phone size={20} color={errors.phone ? '#EF4444' : '#64748B'} />}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Mật khẩu"
              placeholder="Ít nhất 6 ký tự"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              leftIcon={<Lock size={20} color={errors.password ? '#EF4444' : '#64748B'} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} accessibilityRole="button">
                  {showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
                </TouchableOpacity>
              }
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              leftIcon={<Lock size={20} color={errors.confirmPassword ? '#EF4444' : '#64748B'} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} accessibilityRole="button">
                  {showConfirmPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
                </TouchableOpacity>
              }
            />
          )}
        />

        <AppButton
          title="Đăng ký"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          className="w-full mt-2 shadow-sm"
        />

        <View className="flex-row justify-center mt-8 items-center">
          <AppText variant="body" className="text-text-secondary">Đã có tài khoản? </AppText>
          <TouchableOpacity onPress={() => router.back()} className="py-2">
            <AppText variant="body" weight="bold" className="text-primary">Đăng nhập</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
