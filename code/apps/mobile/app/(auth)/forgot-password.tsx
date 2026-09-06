import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, resetPasswordSchema, ForgotPasswordInput, ResetPasswordInput } from '@repo/shared';
import { authService } from '../../src/services/auth.service';
import { AppInput } from '../../src/components/ui/AppInput';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppText } from '../../src/components/ui/AppText';
import { ArrowLeft, CheckCircle, Mail, KeyRound, Lock, EyeOff, Eye } from 'lucide-react-native';
import { layout } from '../../src/theme/tokens';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form Bước 1: Quên mật khẩu
  const { 
    control: step1Control, 
    handleSubmit: handleStep1Submit, 
    formState: { errors: step1Errors, isSubmitting: isStep1Submitting } 
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  // Form Bước 2: Đặt lại mật khẩu
  const { 
    control: step2Control, 
    handleSubmit: handleStep2Submit, 
    setValue: setStep2Value,
    formState: { errors: step2Errors, isSubmitting: isStep2Submitting } 
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '', otp: '', newPassword: '' },
  });

  const onSendOtp = async (data: ForgotPasswordInput) => {
    try {
      setErrorMsg(null);
      await authService.forgotPassword(data);
      setStep2Value('email', data.email);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi gửi email');
    }
  };

  const onResetPassword = async (data: ResetPasswordInput) => {
    try {
      setErrorMsg(null);
      await authService.resetPassword(data);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ alignSelf: 'center', flexGrow: 1, maxWidth: layout.maxContentWidth, width: '100%' }} className="bg-background" keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-16 pb-8">
          
          {errorMsg && step !== 3 && (
            <View className="bg-status-danger/10 p-4 rounded-xl mb-6 border border-status-danger/20 mt-4">
              <AppText variant="bodySmall" className="text-status-danger font-medium">{errorMsg}</AppText>
            </View>
          )}

          {step === 1 && (
            <View className="flex-1 justify-center">
              <TouchableOpacity onPress={() => router.back()} className="mb-6 flex-row items-center py-2">
                <ArrowLeft size={24} color="#3B82F6" />
                <AppText weight="medium" className="text-primary ml-2">Quay lại</AppText>
              </TouchableOpacity>
              
              <AppText variant="h1" weight="bold" className="text-text-primary mb-2">Quên mật khẩu?</AppText>
              <AppText variant="body" className="text-text-secondary mb-8">
                Nhập email của bạn để nhận mã xác minh OTP.
              </AppText>
              
              <Controller
                control={step1Control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Địa chỉ Email"
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={step1Errors.email?.message}
                    leftIcon={<Mail size={20} color={step1Errors.email ? '#EF4444' : '#64748B'} />}
                  />
                )}
              />
              
              <AppButton
                title="Gửi mã OTP"
                onPress={handleStep1Submit(onSendOtp)}
                isLoading={isStep1Submitting}
                className="mt-4 shadow-sm"
              />
            </View>
          )}

          {step === 2 && (
            <View className="flex-1 justify-center">
              <TouchableOpacity onPress={() => { setStep(1); setErrorMsg(null); }} className="mb-6 flex-row items-center py-2">
                <ArrowLeft size={24} color="#3B82F6" />
                <AppText weight="medium" className="text-primary ml-2">Đổi email</AppText>
              </TouchableOpacity>
              
              <AppText variant="h1" weight="bold" className="text-text-primary mb-2">Đặt lại mật khẩu</AppText>
              <AppText variant="body" className="text-text-secondary mb-8">
                Nhập mã OTP gồm 6 chữ số được gửi đến <AppText weight="bold" className="text-text-primary">{step2Control._defaultValues.email}</AppText>
              </AppText>
              
              <Controller
                control={step2Control}
                name="otp"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Mã OTP"
                    placeholder="Nhập mã xác minh"
                    keyboardType="number-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    maxLength={6}
                    error={step2Errors.otp?.message}
                    leftIcon={<KeyRound size={20} color={step2Errors.otp ? '#EF4444' : '#64748B'} />}
                  />
                )}
              />
              
              <Controller
                control={step2Control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Mật khẩu mới"
                    placeholder="Ít nhất 6 ký tự"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={step2Errors.newPassword?.message}
                    leftIcon={<Lock size={20} color={step2Errors.newPassword ? '#EF4444' : '#64748B'} />}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} accessibilityRole="button">
                        {showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
                      </TouchableOpacity>
                    }
                  />
                )}
              />
              
              <AppButton
                title="Cập nhật mật khẩu"
                onPress={handleStep2Submit(onResetPassword)}
                isLoading={isStep2Submitting}
                className="mt-4 shadow-sm"
              />
            </View>
          )}

          {step === 3 && (
            <View className="flex-1 justify-center items-center">
              <CheckCircle size={80} color="#10B981" className="mb-6" />
              <AppText variant="display" weight="bold" className="text-text-primary mb-4 text-center">Thành công!</AppText>
              <AppText variant="body" className="text-text-secondary mb-10 text-center">
                Mật khẩu của bạn đã được đặt lại thành công.
              </AppText>
              
              <AppButton
                title="Đăng nhập ngay"
                onPress={() => router.replace('/(auth)/login')}
                className="w-full shadow-sm"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
