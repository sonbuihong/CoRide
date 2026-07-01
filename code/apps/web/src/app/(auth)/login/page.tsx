'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    try {
      const response = await apiClient.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data.data;
      
      setAuth(user, accessToken, refreshToken);
      router.push('/'); // Redirect về trang chủ
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.error || 'Đã có lỗi xảy ra khi đăng nhập'
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Đăng nhập</CardTitle>
          <CardDescription>
            Nhập email và mật khẩu của bạn để tiếp tục
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}
            
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
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
