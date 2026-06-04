'use client';

import React, { useEffect, useState } from 'react';
import { ProfileForm } from '../../components/profile/profile-form';
import { AvatarUpload } from '../../components/profile/avatar-upload';
import { ReviewList } from '../../components/profile/review-list';
import apiClient from '../../lib/api-client';
import { Loader2, ArrowLeft, Star, User } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  driverRating?: number;
  driverRatingCount?: number;
  passengerRating?: number;
  passengerRatingCount?: number;
  isDriverVerified?: boolean;
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const userRes = await apiClient.get('/users/me');
      setUser(userRes.data);
      
      const reviewsRes = await apiClient.get(`/reviews/user/${userRes.data.id}`);
      setReviews(reviewsRes.data.reviews);
    } catch (err: unknown) {
      console.error('Lỗi khi tải thông tin hồ sơ:', err);
      setError('Phiên bản đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleAvatarSuccess = (newUrl: string) => {
    setUser((prev: UserProfile | null) => prev ? { ...prev, avatarUrl: newUrl } : null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f5f7] dark:bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-6 bg-[#f5f5f7] dark:bg-black">
        <User className="h-16 w-16 text-[rgba(0,0,0,0.16)] dark:text-[rgba(255,255,255,0.16)]" />
        <p className="text-[17px] tracking-tight text-[#1d1d1f] dark:text-white font-medium max-w-[300px] text-center">{error}</p>
        <Link href="/login">
          <button className="bg-[#0071e3] text-white px-8 py-3 rounded-[980px] text-[17px] font-medium hover:bg-[#0077ED] transition-colors">
            Đăng nhập ngay
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24 transition-colors duration-300">
      <div className="container max-w-[680px] mx-auto px-4 space-y-8 animate-in fade-in duration-500">
        
        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <Link href="/">
            <button className="flex items-center text-[14px] font-medium text-[#0071e3] transition-colors hover:text-[#005ea6] group">
              <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Khám phá CoRide
            </button>
          </Link>
        </div>

        {/* Page Title */}
        <h1 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.28px] leading-[1.07] text-[#1d1d1f] dark:text-white mb-2">
          Tài khoản.
        </h1>

        <div className="space-y-8">
          
          {/* Avatar Section */}
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)]">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="shrink-0">
                <AvatarUpload
                  currentAvatarUrl={user?.avatarUrl || undefined}
                  onUploadSuccess={handleAvatarSuccess}
                />
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-2 pt-2">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h2 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white leading-none">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  {user?.isDriverVerified ? (
                    <span className="px-2 py-0.5 bg-[#34c759]/10 text-[#34c759] text-[11px] font-medium rounded-full border border-[#34c759]/20">
                      Tài xế đã xác thực
                    </span>
                  ) : (
                    <Link href="/profile/driver-verification">
                      <span className="px-2 py-0.5 bg-[#0071e3]/10 text-[#0071e3] text-[11px] font-medium rounded-full border border-[#0071e3]/20 hover:bg-[#0071e3]/20 transition-colors cursor-pointer">
                        Xác thực tài xế
                      </span>
                    </Link>
                  )}
                </div>
                
                <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  Apple ID: {user?.email}
                </p>
                
                <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mt-4">
                  {/* Passenger Rating Badge */}
                  <div className="inline-flex items-center gap-1.5 bg-[#0071e3]/10 px-3 py-1.5 rounded-[980px]">
                    <span className="text-[11px] font-medium text-[#0071e3] uppercase tracking-wider mr-1">Hành khách</span>
                    <Star className="h-3.5 w-3.5 fill-[#0071e3] text-[#0071e3]" />
                    <span className="text-[12px] font-bold text-[#0058b0] dark:text-[#0071e3] tracking-tight">{user?.passengerRating?.toFixed(1) || '0.0'}</span>
                    <span className="text-[12px] font-medium text-[rgba(0,113,227,0.5)]">
                      ({user?.passengerRatingCount || 0})
                    </span>
                  </div>

                  {/* Driver Rating Badge */}
                  {user?.isDriverVerified && (
                    <div className="inline-flex items-center gap-1.5 bg-[#34c759]/10 px-3 py-1.5 rounded-[980px]">
                      <span className="text-[11px] font-medium text-[#34c759] uppercase tracking-wider mr-1">Tài xế</span>
                      <Star className="h-3.5 w-3.5 fill-[#34c759] text-[#34c759]" />
                      <span className="text-[12px] font-bold text-[#248a3d] dark:text-[#34c759] tracking-tight">{user?.driverRating?.toFixed(1) || '0.0'}</span>
                      <span className="text-[12px] font-medium text-[rgba(52,199,89,0.5)]">
                        ({user?.driverRatingCount || 0})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form (Personal details) */}
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)]">
            <h3 className="text-[21px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-6">
              Thông tin cá nhân
            </h3>
            <div className="relative z-10 w-full form-apple">
               {user && <ProfileForm initialData={{
                 firstName: user.firstName || '',
                 lastName: user.lastName || '',
                 phone: user.phone || undefined,
                 bio: user.bio || undefined
               }} />}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)]">
             <div className="flex items-center gap-2 mb-6">
               <h3 className="text-[21px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                 Đánh giá từ cộng đồng
               </h3>
             </div>
             <div className="border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] pt-6">
               <ReviewList reviews={reviews} />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
