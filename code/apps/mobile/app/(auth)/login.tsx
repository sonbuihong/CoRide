import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { AppInput } from '../../src/components/ui/AppInput';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../src/theme/tokens';

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
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 }}
        className="bg-background"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-10">
          <AppText weight="semibold" style={{ color: colors.textPrimary, fontSize: 40, letterSpacing: -0.28, lineHeight: 43 }}>CoRide</AppText>
          <AppText className="text-text-secondary text-center mt-3" style={{ fontSize: 17, letterSpacing: -0.37 }}>
            Giải pháp đi chung xe thông minh cho cộng đồng
          </AppText>
        </View>

        <View>
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
                  label="Email"
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
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
                  label="Mật khẩu"
                  placeholder="Nhập mật khẩu"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  rightIcon={
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      className="p-1"
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={colors.textTertiary} />
                      ) : (
                        <Eye size={20} color={colors.textTertiary} />
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

        <View className="flex-row justify-center items-center mt-8">
          <AppText variant="bodySmall" className="text-text-secondary">Chưa có tài khoản? </AppText>
          <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
            <AppText variant="bodySmall" weight="bold" className="text-passenger">Đăng ký ngay</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
