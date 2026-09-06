import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerFormSchema, RegisterFormInput, splitFullName } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { AppInput } from '../../src/components/ui/AppInput';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, layout } from '../../src/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterFormInput) => {
    try {
      setErrorMsg(null);
      const { firstName, lastName } = splitFullName(data.fullName);
      await register({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        fullName: data.fullName,
        firstName,
        lastName,
        phone: data.phone || undefined,
      });
      
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
      <ScrollView 
        contentContainerStyle={{ alignSelf: 'center', flexGrow: 1, maxWidth: layout.maxContentWidth, paddingHorizontal: 20, paddingVertical: 40, width: '100%' }}
        className="bg-background"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-10">
          <AppText weight="semibold" className="text-center" style={{ color: colors.textPrimary, fontSize: 40, letterSpacing: -0.28, lineHeight: 43 }}>Đăng ký tài khoản</AppText>
          <AppText className="text-text-secondary text-center mt-3" style={{ fontSize: 17, letterSpacing: -0.37 }}>
            Dùng một tài khoản cho tất cả chuyến đi của bạn.
          </AppText>
        </View>

        {errorMsg && (
          <View className="bg-status-danger/10 p-4 rounded-xl mb-6 border border-status-danger/20">
            <AppText variant="bodySmall" className="text-status-danger font-medium text-center">{errorMsg}</AppText>
          </View>
        )}

        <View>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Họ và tên"
                placeholder="Ví dụ: Nguyễn Văn A"
                autoCapitalize="words"
                autoComplete="name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
              />
            )}
          />

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
                rightIcon={
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)} 
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    className="p-1"
                  >
                    {showPassword ? <EyeOff size={20} color={colors.textTertiary} /> : <Eye size={20} color={colors.textTertiary} />}
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
                rightIcon={
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                    accessibilityRole="button"
                    accessibilityLabel={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    className="p-1"
                  >
                    {showConfirmPassword ? <EyeOff size={20} color={colors.textTertiary} /> : <Eye size={20} color={colors.textTertiary} />}
                  </TouchableOpacity>
                }
              />
            )}
          />

          <AppButton
            title="Đăng ký"
            variant="passenger"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            className="w-full mt-4"
          />
        </View>

        <View className="flex-row justify-center mt-6 items-center">
          <AppText variant="bodySmall" className="text-text-secondary">Đã có tài khoản? </AppText>
          <TouchableOpacity onPress={() => router.back()} className="py-2">
            <AppText variant="bodySmall" weight="bold" className="text-passenger">Đăng nhập</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
