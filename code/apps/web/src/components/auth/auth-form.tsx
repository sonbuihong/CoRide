'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@repo/shared';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRoleMode } from '@/components/providers/role-mode-provider';
import apiClient from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// ==========================================
// THIẾT KẾ APPLE: Các Utilities CSS dùng chung
// ==========================================
const appleInputClass = 
  "h-[48px] rounded-[11px] bg-[#fafafc] border-[3px] border-[rgba(0,0,0,0.04)] px-4 text-[17px] text-[#1d1d1f] transition-all hover:border-[rgba(0,0,0,0.08)] focus-visible:ring-0 focus-visible:border-transparent focus-visible:outline-none focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 dark:bg-[rgba(255,255,255,0.05)] dark:text-white dark:border-[rgba(255,255,255,0.05)]";

const appleLabelClass = 
  "text-[14px] font-semibold text-[#1d1d1f] tracking-[-0.22px] mb-1 block dark:text-white";

const appleButtonClass = 
  "h-[48px] w-full rounded-[8px] bg-[#0071e3] text-white text-[17px] font-normal tracking-[-0.37px] transition-colors hover:bg-[#0077ED] active:bg-[#0062C3]";

const appleLinkClass = 
  "text-[#0066cc] text-[14px] tracking-[-0.22px] font-normal hover:underline dark:text-[#2997ff]";


// ─── Login Form ────────────────────────────────────────────────────────────────
export function LoginForm() {
  const router = useRouter();
  const { login, user } = useAuth();
  const { setMode } = useRoleMode();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const userData = await login(data.email, data.password);
      toast.success('Đăng nhập thành công!');
      
      // Tự động thiết lập chế độ Tìm chuyến đi (passenger) khi đăng nhập thành công
      setMode('passenger');
      
      // Redirect admin users to admin dashboard
      if (userData?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/rides/search');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message =
        axiosErr.response?.data?.message ?? 'Email hoặc mật khẩu không đúng';
      setError('root', { message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errors.root && (
          <div className="bg-destructive/10 p-3 rounded-[11px] text-[#d93025] text-[14px] font-medium text-center tracking-tight">
            {errors.root.message}
          </div>
        )}

        <div className="space-y-1 relative">
          <Label htmlFor="email" className={appleLabelClass}>Email</Label>
          <input
            id="email"
            placeholder="name@example.com"
            type="email"
            className={`w-full ${appleInputClass}`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1 relative">
          <Label htmlFor="password" className={appleLabelClass}>Mật khẩu</Label>
          <input
            id="password"
            type="password"
            placeholder="Nhập mật khẩu của bạn"
            className={`w-full ${appleInputClass}`}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.password.message}</p>
          )}
        </div>

        <div className="pt-2">
          <button type="submit" className={appleButtonClass} disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-8 text-center bg-transparent">
        <p className="text-[14px] text-[rgba(0,0,0,0.8)] tracking-[-0.22px] dark:text-[rgba(255,255,255,0.8)]">
          Chưa có tài khoản?{' '}
          <button
            onClick={() => router.push('/register')}
            className={appleLinkClass}
          >
            Đăng ký ngay &gt;
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Register Form ─────────────────────────────────────────────────────────────
export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await apiClient.post('/auth/register', registerData);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      router.push('/login');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message =
        axiosErr.response?.data?.message ?? 'Đăng ký thất bại. Vui lòng thử lại.';
      setError('root', { message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="bg-destructive/10 p-3 rounded-[11px] text-[#d93025] text-[14px] font-medium text-center tracking-tight">
            {errors.root.message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="lastName" className={appleLabelClass}>Họ</Label>
            <input
              id="lastName"
              placeholder="Nguyễn"
              className={`w-full ${appleInputClass}`}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.lastName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="firstName" className={appleLabelClass}>Tên</Label>
            <input 
              id="firstName" 
              placeholder="An" 
              className={`w-full ${appleInputClass}`}
              {...register('firstName')} 
            />
            {errors.firstName && (
              <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.firstName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1 text-left">
          <Label htmlFor="reg-email" className={appleLabelClass}>Email</Label>
          <input
            id="reg-email"
            placeholder="name@example.com"
            type="email"
            className={`w-full ${appleInputClass}`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1 text-left">
          <Label htmlFor="phone" className={appleLabelClass}>Số điện thoại</Label>
          <input
            id="phone"
            placeholder="0912345678"
            className={`w-full ${appleInputClass}`}
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1 text-left">
          <Label htmlFor="reg-password" className={appleLabelClass}>Mật khẩu</Label>
          <input
            id="reg-password"
            type="password"
            placeholder="Tạo mật khẩu"
            className={`w-full ${appleInputClass}`}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1 text-left">
          <Label htmlFor="confirm-password" className={appleLabelClass}>Nhập lại mật khẩu</Label>
          <input
            id="confirm-password"
            type="password"
            placeholder="Nhập lại mật khẩu"
            className={`w-full ${appleInputClass}`}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="pt-2 text-left">
          <p className="text-[12px] text-[rgba(0,0,0,0.48)] mb-4 tracking-tight leading-relaxed">
            Mật khẩu của bạn phải có ít nhất 6 ký tự.
          </p>
          <button type="submit" className={appleButtonClass} disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tạo...
              </span>
            ) : (
              'Tiếp tục'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-[14px] text-[rgba(0,0,0,0.8)] tracking-[-0.22px] dark:text-[rgba(255,255,255,0.8)]">
          Đã có tài khoản?{' '}
          <button
            onClick={() => router.push('/login')}
            className={appleLinkClass}
          >
            Đăng nhập ngay &gt;
          </button>
        </p>
      </div>
    </div>
  );
}
