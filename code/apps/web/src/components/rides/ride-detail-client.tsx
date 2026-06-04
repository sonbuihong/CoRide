'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { 
  Loader2, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Car, 
  Users, 
  Clock,
  Info,
  MessageSquare
} from 'lucide-react';
import RideRouteMap from '@/components/rides/ride-route-map';
import { BookingButton } from '@/components/booking/booking-button';
import { ReviewDialog } from '@/components/rides/review-dialog';
import { ChatWindow } from '@/components/chat/chat-window';

interface RideDetailClientProps {
  rideId: string;
}

export default function RideDetailClient({ rideId }: RideDetailClientProps) {
  const router = useRouter();

  const [ride, setRide] = useState<{
    id: string;
    origin: string;
    destination: string;
    originLat?: number | null;
    originLng?: number | null;
    destinationLat?: number | null;
    destinationLng?: number | null;
    departureTime: string;
    availableSeats: number;
    totalSeats: number;
    pricePerSeat: number;
    status: string;
    driverId?: string;
    driver?: { id: string; fullName?: string; avatarUrl?: string };
    description?: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName?: string; avatarUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rideRes, userRes] = await Promise.allSettled([
          apiClient.get(`/rides/${rideId}`),
          apiClient.get('/users/me')
        ]);

        if (rideRes.status === 'fulfilled') {
          setRide(rideRes.value.data);
        } else {
          setError('Không tìm thấy thông tin chuyến đi.');
        }

        if (userRes.status === 'fulfilled') {
          setCurrentUser(userRes.value.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setError('Đã xảy ra lỗi khi tải thông tin. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (rideId) {
      fetchData();
    }
  }, [rideId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col space-y-4 bg-[#f5f5f7] dark:bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-[#0071e3]" />
        <p className="text-[17px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">Đang tải biểu mẫu chuyến đi...</p>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black py-20 flex flex-col items-center justify-center space-y-6">
        <div className="p-5 rounded-full bg-[#d93025]/10">
          <Info className="h-12 w-12 text-[#d93025]" />
        </div>
        <h2 className="text-[28px] font-semibold text-[#1d1d1f] dark:text-white">{error || 'Không tìm thấy chuyến đi'}</h2>
        <button 
          onClick={() => router.back()} 
          className="bg-[#1d1d1f] text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-[980px] text-[14px] font-medium transition-colors"
        >
          Trở lại
        </button>
      </div>
    );
  }

  const isValidCoord = (v: number | null | undefined): v is number =>
    typeof v === 'number' && !isNaN(v);

  const hasMapData =
    isValidCoord(ride.originLat) &&
    isValidCoord(ride.originLng) &&
    isValidCoord(ride.destinationLat) &&
    isValidCoord(ride.destinationLng);

  const origin = hasMapData
    ? { lat: ride.originLat as number, lng: ride.originLng as number }
    : null;
  const destination = hasMapData
    ? { lat: ride.destinationLat as number, lng: ride.destinationLng as number }
    : null;

  const departureDate = new Date(ride.departureTime);

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-8 pb-32 transition-colors duration-300">
      <div className="container max-w-[1020px] mx-auto px-4 md:px-8 space-y-8 animate-in fade-in duration-700">
        
        {/* Header / Back Navigation */}
        <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] pb-4 mb-8">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-[14px] font-medium text-[#0071e3] transition-colors hover:text-[#005ea6] group"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Tìm chuyến chuyên biệt
          </button>
          
          <div className="bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] px-3 py-1 rounded-[980px]">
            <p className="text-[12px] font-medium tracking-tight text-[#1d1d1f] dark:text-white">
              {ride.availableSeats > 0 ? `Còn ${ride.availableSeats} chỗ` : 'Đã đủ người'}
            </p>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Primary Info) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* HÀNH TRÌNH BLOCK */}
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none border border-transparent dark:border-[rgba(255,255,255,0.05)]">
              <h2 className="text-[24px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-6 flex items-center">
                <Car className="h-5 w-5 mr-2 text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]" /> Biểu đồ Tuyến
              </h2>

              <div className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full border-[3px] border-[#1d1d1f] dark:border-white bg-white dark:bg-[#1d1d1f] mt-1.5" />
                  <div className="w-[2px] h-20 bg-gradient-to-b from-[#1d1d1f] to-transparent dark:from-white opacity-20 my-1" />
                  <MapPin className="h-5 w-5 text-[#1d1d1f] dark:text-white" />
                </div>
                <div className="flex-1 space-y-10">
                  <div>
                    <p className="text-[12px] uppercase font-semibold tracking-wider text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] mb-1">Điểm bắt đầu</p>
                    <p className="text-[28px] font-semibold tracking-tight leading-none text-[#1d1d1f] dark:text-white">{ride.origin}</p>
                  </div>
                  <div>
                    <p className="text-[12px] uppercase font-semibold tracking-wider text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] mb-1">Điểm đến</p>
                    <p className="text-[28px] font-semibold tracking-tight leading-none text-[#1d1d1f] dark:text-white">{ride.destination}</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] flex items-center gap-1.5 mb-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Lịch trình
                    </p>
                    <p className="text-[17px] font-medium tracking-tight text-[#1d1d1f] dark:text-white">{departureDate.toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] flex items-center gap-1.5 mb-1.5">
                      <Clock className="h-3.5 w-3.5" /> Khởi hành lúc
                    </p>
                    <p className="text-[17px] font-medium tracking-tight text-[#1d1d1f] dark:text-white">{departureDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] flex items-center gap-1.5 mb-1.5">
                      <Users className="h-3.5 w-3.5" /> Hiện trạng
                    </p>
                    <p className="text-[17px] font-medium tracking-tight text-[#1d1d1f] dark:text-white">{ride.totalSeats} ghế trống</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] flex items-center gap-1.5 mb-1.5">
                      <Info className="h-3.5 w-3.5" /> Trạng thái
                    </p>
                    <p className="text-[17px] font-medium tracking-tight text-[#0071e3]">Khả dụng</p>
                  </div>
                </div>
              </div>
            </div>

            {/* BẢN ĐỒ BLOCK */}
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-2 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none border border-transparent dark:border-[rgba(255,255,255,0.05)]">
              <div className="p-4 pl-6 pb-2">
                <h2 className="text-[21px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white flex items-center">
                  Bản đồ tuyến
                </h2>
              </div>
              <div className="rounded-[20px] overflow-hidden">
                {hasMapData && origin && destination ? (
                  <RideRouteMap origin={origin} destination={destination} />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-[14px] text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)] bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] rounded-[20px]">
                    Chuyến đi này chưa có dữ liệu bản đồ.
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-8">
            
            {/* TÀI XẾ BLOCK */}
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:shadow-none border border-transparent dark:border-[rgba(255,255,255,0.05)]">
              <h3 className="text-[17px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-6">Thông tin thành viên</h3>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden">
                  {ride.driver?.avatarUrl ? (
                    <img src={ride.driver.avatarUrl} alt={ride.driver.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-[rgba(0,0,0,0.48)]" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[17px] tracking-tight text-[#1d1d1f] dark:text-white">{ride.driver?.fullName || 'Tài xế CoRide'}</p>
                  <p className="text-[12px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">Xác minh Apple ID</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">Đánh giá chung</span>
                  <span className="font-medium text-[#1d1d1f] dark:text-white tracking-tight">5.0 ⭐</span>
                </div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">Kinh nghiệm</span>
                  <span className="font-medium text-[#1d1d1f] dark:text-white tracking-tight">Lái xe mới</span>
                </div>
              </div>
            </div>

            {/* ACTION BLOCK */}
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] relative z-10">
              <div className="text-center py-4 mb-2">
                <p className="text-[12px] uppercase font-semibold text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] tracking-wider">Chi phí dự kiến</p>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-[40px] font-semibold tracking-[-0.04em] leading-none text-[#0071e3]">{ride.pricePerSeat.toLocaleString('vi-VN')}</span>
                  <span className="text-[21px] font-semibold text-[#0071e3]">đ</span>
                </div>
              </div>
              
              <div className="mt-4">
                <BookingButton 
                  rideId={ride.id} 
                  availableSeats={ride.availableSeats} 
                  driverId={ride.driverId ?? ''}
                  currentUserId={currentUser?.id}
                />
              </div>

              {currentUser?.id && currentUser.id !== ride.driverId && (
                <div className="mt-3">
                  <button 
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#1d1d1f] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.05)] transition-all font-medium text-[14px]"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Nhắn tin cho tài xế
                  </button>
                </div>
              )}

              {ride.status === 'COMPLETED' && currentUser?.id !== ride.driverId && (
                <div className="mt-4">
                  <ReviewDialog 
                    rideId={ride.id} 
                    revieweeId={ride.driverId ?? ''} 
                    revieweeName={ride.driver?.fullName || 'Tài xế'} 
                  />
                </div>
              )}
              
              <p className="text-[11px] text-center text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] mt-5 leading-relaxed">
                Bằng cách tham gia chuyến, bạn đã đồng ý với Điều khoản Hệ sinh thái di chuyển của CoRide.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Cửa sổ Chat cố định ở góc màn hình */}
      {isChatOpen && ride.driverId && currentUser?.id && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 duration-300">
          <ChatWindow
            rideId={ride.id}
            otherUserId={ride.driverId}
            otherUserName={ride.driver?.fullName || 'Tài xế'}
            currentUserId={currentUser.id}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
