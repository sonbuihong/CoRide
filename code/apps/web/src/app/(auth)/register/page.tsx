'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import apiClient from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải chứa ít nhất 8 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  firstName: z.string().min(1, 'Vui lòng nhập họ'),
  lastName: z.string().min(1, 'Vui lòng nhập tên'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Bỏ confirmPassword trước khi gửi lên server
      const { confirmPassword, ...payload } = data;
      await apiClient.post('/auth/register', payload);
      
      setSuccessMsg('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.error || 'Đã có lỗi xảy ra khi đăng ký'
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Tạo tài khoản</CardTitle>
          <CardDescription>
            Điền đầy đủ thông tin bên dưới để tham gia RideShare VN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Họ</Label>
                <Input
                  id="firstName"
                  placeholder="Nguyễn"
                  {...register('firstName')}
                  className={errors.firstName ? 'border-destructive' : ''}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Tên</Label>
                <Input
                  id="lastName"
                  placeholder="Văn A"
                  {...register('lastName')}
                  className={errors.lastName ? 'border-destructive' : ''}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại (Tùy chọn)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0901234567"
                {...register('phone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !!successMsg}>
              {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
