'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, UpdateProfileInput } from '@repo/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2 } from 'lucide-react';
import apiClient from '../../lib/api-client';

interface ProfileFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    phone?: string;
    bio?: string;
  };
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ initialData }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      phone: initialData.phone || '',
      bio: initialData.bio || '',
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setLoading(true);
    setMessage(null);
    try {
      await apiClient.patch('/users/profile', data);
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (error: unknown) {
      console.error('Lỗi cập nhật profile:', error);
      setMessage({
        type: 'error',
        text: ((error as { response?: { data?: { message?: string } } }).response)?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Thông tin cá nhân</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Họ</Label>
              <Input
                id="firstName"
                placeholder="Nhập họ của bạn"
                {...register('firstName')}
                disabled={loading}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Tên</Label>
              <Input
                id="lastName"
                placeholder="Nhập tên của bạn"
                {...register('lastName')}
                disabled={loading}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              placeholder="Nhập số điện thoại (e.g., 0912345678)"
              {...register('phone')}
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Giới thiệu bản thân</Label>
            <textarea
              id="bio"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Chia sẻ một chút về bạn..."
              {...register('bio')}
              disabled={loading}
            />
            {errors.bio && (
              <p className="text-sm text-red-500">{errors.bio.message}</p>
            )}
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
