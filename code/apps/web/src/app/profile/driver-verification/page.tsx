'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShieldCheck, Clock, CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { z } from 'zod';
import { driverVerificationSchema } from '@repo/shared';

type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface VerificationData {
  status: VerificationStatus;
  rejectionReason?: string;
  licenseFrontImageUrl: string;
  licenseBackImageUrl: string;
  registrationFrontImageUrl: string;
  registrationBackImageUrl: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleType: 'BIKE' | 'CAR';
}

interface ImageKycUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

const ImageKycUpload: React.FC<ImageKycUploadProps> = ({ label, value, onChange, error }) => {
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalError(null);

    // Validate size < 2MB
    if (file.size > 2 * 1024 * 1024) {
      setLocalError("Dung lượng file không được vượt quá 2MB");
      return;
    }

    // Validate type is image
    if (!file.type.startsWith('image/')) {
      setLocalError("Chỉ chấp nhận tệp tin hình ảnh");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await apiClient.post('/users/upload-kyc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data?.url) {
        onChange(res.data.url);
      }
    } catch (err: any) {
      console.error(err);
      setLocalError(err.response?.data?.message || "Lỗi khi tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Base URL mapping
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const backendHost = apiBase.replace('/api', '');
    return `${backendHost}${url}`;
  };

  return (
    <div className="space-y-2">
      <Label className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white flex items-center">
        {label} <span className="text-red-500 ml-1">*</span>
      </Label>
      
      <div 
        onClick={() => !value && !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-[12px] p-4 flex flex-col items-center justify-center min-h-[140px] bg-[#fafafc] dark:bg-[rgba(255,255,255,0.05)] transition-all ${
          !value && !uploading ? 'cursor-pointer hover:border-[rgba(0,0,0,0.2)] dark:hover:border-zinc-500' : ''
        }`}
      >
        {value ? (
          <div className="relative w-full aspect-[16/9] max-h-[160px] rounded-lg overflow-hidden border">
            <img src={getImageUrl(value)} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-[#0071e3] mb-2" />
            ) : (
              <span className="text-[28px] mb-2">📸</span>
            )}
            <p className="text-[13px] font-medium text-[#0071e3]">
              {uploading ? "Đang tải ảnh lên..." : "Chọn ảnh để tải lên"}
            </p>
            <p className="text-[11px] text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] mt-1">
              Hỗ trợ mọi ảnh (Tối đa 2MB)
            </p>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        disabled={uploading}
      />
      
      {(error || localError) && (
        <p className="text-[13px] text-red-500 font-medium mt-1">{error || localError}</p>
      )}
    </div>
  );
};

export default function DriverVerificationPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [hasRefreshed, setHasRefreshed] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    licenseFrontImageUrl: '',
    licenseBackImageUrl: '',
    registrationFrontImageUrl: '',
    registrationBackImageUrl: '',
    vehiclePlate: '',
    vehicleModel: '',
    vehicleType: 'BIKE' as 'BIKE' | 'CAR',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login?callbackUrl=/profile/driver-verification');
      return;
    }

    const checkAndFetch = async () => {
      // 1. Đồng bộ lại thông tin user từ server một lần duy nhất nếu client thấy chưa verify
      if (!user.isDriverVerified && !hasRefreshed) {
        setHasRefreshed(true);
        try {
          await refreshUser();
          return; // Dừng lại để useEffect chạy lại với thông tin user mới
        } catch (e) {
          console.error('Lỗi khi đồng bộ thông tin người dùng:', e);
        }
      }

      // 2. Nếu đã được xác thực tài xế, chuyển hướng về trang cá nhân
      if (user.isDriverVerified) {
        toast.info('Tài khoản của bạn đã được xác thực tài xế.');
        router.push('/profile');
        return;
      }

      // 3. Nếu chưa xác thực, lấy thông tin hồ sơ KYC chi tiết
      try {
        const response = await apiClient.get('/users/driver-verification');
        if (response.data?.data) {
          setVerification(response.data.data);
          
          // Double check: Nếu trong database đã APPROVED nhưng client chưa cập nhật
          if (response.data.data.status === 'APPROVED' && !user.isDriverVerified) {
            await refreshUser();
            return;
          }

          // Điền dữ liệu cũ để cập nhật nếu bị từ chối
          if (response.data.data.status === 'REJECTED') {
            setFormData({
              licenseFrontImageUrl: response.data.data.licenseFrontImageUrl || '',
              licenseBackImageUrl: response.data.data.licenseBackImageUrl || '',
              registrationFrontImageUrl: response.data.data.registrationFrontImageUrl || '',
              registrationBackImageUrl: response.data.data.registrationBackImageUrl || '',
              vehiclePlate: response.data.data.vehiclePlate || '',
              vehicleModel: response.data.data.vehicleModel || '',
              vehicleType: response.data.data.vehicleType || 'BIKE',
            });
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin xác thực:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAndFetch();
  }, [user, authLoading, hasRefreshed, refreshUser, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Xóa error khi user bắt đầu gõ
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate bằng Zod schema từ @repo/shared
    try {
      driverVerificationSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) newErrors[e.path[0].toString()] = e.message;
        });
        setErrors(newErrors);
        toast.error('Vui lòng kiểm tra lại thông tin nhập.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await apiClient.post('/users/driver-verification', formData);
      toast.success('Gửi yêu cầu xác thực thành công. Vui lòng chờ duyệt.');
      // Refresh status
      const response = await apiClient.get('/users/driver-verification');
      setVerification(response.data?.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải trạng thái...</div>;
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 -ml-2 text-[rgba(0,0,0,0.56)] hover:text-black"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f] mb-2 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-[#0071e3]" />
          Xác thực Tài xế
        </h1>
        <p className="text-[15px] leading-relaxed text-[rgba(0,0,0,0.56)]">
          Để đảm bảo an toàn cho hành khách, tất cả tài xế trên CoRide cần cung cấp giấy tờ tùy thân và phương tiện.
        </p>
      </div>

      {/* Hiển thị trạng thái hiện tại */}
      {verification && verification.status === 'PENDING' && (
        <Card className="border-[#0071e3]/20 bg-[#0071e3]/5 shadow-none mb-8">
          <CardContent className="pt-6 flex items-start gap-4">
            <Clock className="w-6 h-6 text-[#0071e3] shrink-0" />
            <div>
              <h3 className="font-medium text-[#1d1d1f] mb-1">Hồ sơ đang chờ duyệt</h3>
              <p className="text-[14px] text-[rgba(0,0,0,0.56)]">
                Admin đang kiểm tra thông tin của bạn. Quá trình này thường mất từ 1-2 ngày làm việc. Bạn sẽ nhận được thông báo khi có kết quả.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {verification && verification.status === 'APPROVED' && (
        <Card className="border-[#34c759]/20 bg-[#34c759]/5 shadow-none mb-8">
          <CardContent className="pt-6 flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-[#34c759] shrink-0" />
            <div>
              <h3 className="font-medium text-[#1d1d1f] mb-1">Xác thực thành công</h3>
              <p className="text-[14px] text-[rgba(0,0,0,0.56)]">
                Bạn đã có thể đăng chuyến đi trên CoRide.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {verification && verification.status === 'REJECTED' && (
        <Card className="border-[#ff3b30]/20 bg-[#ff3b30]/5 shadow-none mb-8">
          <CardContent className="pt-6 flex items-start gap-4">
            <XCircle className="w-6 h-6 text-[#ff3b30] shrink-0" />
            <div>
              <h3 className="font-medium text-[#1d1d1f] mb-1">Yêu cầu bị từ chối</h3>
              <p className="text-[14px] text-[rgba(0,0,0,0.56)] mb-2">
                Hồ sơ của bạn không hợp lệ. Bạn có thể cập nhật thông tin và gửi lại.
              </p>
              <div className="bg-white/50 p-3 rounded-md text-[13px] text-[#ff3b30] border border-[#ff3b30]/10">
                <span className="font-medium">Lý do: </span>
                {verification.rejectionReason || 'Không rõ'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form upload — Chỉ hiện khi chưa gửi hoặc bị REJECTED */}
      {(!verification || verification.status === 'REJECTED') && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Cung cấp thông tin</CardTitle>
            <CardDescription>
              Vui lòng tải lên ảnh giấy tờ rõ nét. Dung lượng mỗi ảnh không quá 2MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Bằng lái xe */}
              <div className="space-y-4">
                <h3 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-white border-l-4 border-[#0071e3] pl-2.5">
                  1. Bằng lái xe (GPLX)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageKycUpload
                    label="Mặt trước bằng lái"
                    value={formData.licenseFrontImageUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, licenseFrontImageUrl: url }))}
                    error={errors.licenseFrontImageUrl}
                  />
                  <ImageKycUpload
                    label="Mặt sau bằng lái"
                    value={formData.licenseBackImageUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, licenseBackImageUrl: url }))}
                    error={errors.licenseBackImageUrl}
                  />
                </div>
              </div>

              {/* Giấy đăng ký xe */}
              <div className="space-y-4 pt-2">
                <h3 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-white border-l-4 border-[#0071e3] pl-2.5">
                  2. Giấy đăng ký xe (Cà vẹt)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageKycUpload
                    label="Mặt trước đăng ký xe"
                    value={formData.registrationFrontImageUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, registrationFrontImageUrl: url }))}
                    error={errors.registrationFrontImageUrl}
                  />
                  <ImageKycUpload
                    label="Mặt sau đăng ký xe"
                    value={formData.registrationBackImageUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, registrationBackImageUrl: url }))}
                    error={errors.registrationBackImageUrl}
                  />
                </div>
              </div>

              {/* Loại phương tiện */}
              <div className="space-y-3 pt-2">
                <h3 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-white border-l-4 border-[#0071e3] pl-2.5 mb-2">
                  3. Thông tin phương tiện
                </h3>
                <Label>Loại phương tiện <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, vehicleType: 'BIKE' }))}
                    className={`flex flex-col items-center justify-center p-4 rounded-[12px] border-[2px] transition-all ${formData.vehicleType === 'BIKE'
                      ? 'border-[#0071e3] bg-[#0071e3]/5 text-[#0071e3]'
                      : 'border-border/50 bg-card hover:bg-accent text-card-foreground'
                      }`}
                  >
                    <span className="text-[20px] mb-1">🏍️</span>
                    <span className="text-[14px] font-medium">Xe máy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, vehicleType: 'CAR' }))}
                    className={`flex flex-col items-center justify-center p-4 rounded-[12px] border-[2px] transition-all ${formData.vehicleType === 'CAR'
                      ? 'border-[#0071e3] bg-[#0071e3]/5 text-[#0071e3]'
                      : 'border-border/50 bg-card hover:bg-accent text-card-foreground'
                      }`}
                  >
                    <span className="text-[20px] mb-1">🚗</span>
                    <span className="text-[14px] font-medium">Ô tô</span>
                  </button>
                </div>
                {errors.vehicleType && <p className="text-[13px] text-red-500">{errors.vehicleType}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehiclePlate">Biển số xe <span className="text-red-500">*</span></Label>
                  <Input
                    id="vehiclePlate"
                    name="vehiclePlate"
                    placeholder="VD: 59X1 123.45"
                    value={formData.vehiclePlate}
                    onChange={handleInputChange}
                    className={errors.vehiclePlate ? 'border-red-500' : ''}
                  />
                  {errors.vehiclePlate && <p className="text-[13px] text-red-500">{errors.vehiclePlate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleModel">Hãng xe <span className="text-red-500">*</span></Label>
                  <Input
                    id="vehicleModel"
                    name="vehicleModel"
                    placeholder="VD: Honda Wave, Toyota Vios"
                    value={formData.vehicleModel}
                    onChange={handleInputChange}
                    className={errors.vehicleModel ? 'border-red-500' : ''}
                  />
                  {errors.vehicleModel && <p className="text-[13px] text-red-500">{errors.vehicleModel}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-[rgba(0,0,0,0.08)]">
                <Button
                  type="submit"
                  className="w-full bg-[#1d1d1f] hover:bg-black text-white h-11"
                  disabled={submitting}
                >
                  {submitting ? 'Đang gửi...' : 'Gửi yêu cầu xác thực'}
                </Button>
                <p className="text-center text-[12px] text-[rgba(0,0,0,0.5)] mt-3">
                  Bằng việc gửi yêu cầu, bạn cam kết các thông tin trên là chính xác.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
