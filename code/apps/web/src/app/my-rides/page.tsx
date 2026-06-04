 'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '../../lib/api-client';
import { RideCard } from '../../components/rides/ride-card';
import { Loader2, Car, AlertCircle, Plus, Trash2, Play, Check, ChevronDown, ChevronUp, Users, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ReviewDialog } from '../../components/rides/review-dialog';

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  rating?: number | null;
}

interface Ride {
  id: string;
  origin: string;
  destination: string;
  departureTime: string | Date;
  availableSeats: number;
  pricePerSeat: number;
  driver: Driver;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
}

interface RideBooking {
  id: string;
  seats: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  passenger: Passenger;
}

export default function MyRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  // Quản lý hiển thị hành khách đi cùng trong lịch sử chuyến đi
  const [rideBookings, setRideBookings] = useState<Record<string, RideBooking[]>>({});
  const [loadingBookings, setLoadingBookings] = useState<Record<string, boolean>>({});
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await apiClient.get('/users/me');
      const currentUser = userRes.data;

      const ridesRes = await apiClient.get('/rides', { 
        params: { driverId: currentUser.id } 
      });
      setRides(ridesRes.data.rides ?? ridesRes.data);
    } catch (err: unknown) {
      console.error('Lỗi khi tải dữ liệu:', err);
      setError('Không thể tải danh sách chuyến đi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteRide = async (rideId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy chuyến đi này không? Việc này không thể hoàn tác.')) return;

    try {
      await apiClient.delete(`/rides/${rideId}`);
      setRides(rides.filter(r => r.id !== rideId));
      toast.success('Đã hủy chuyến đi thành công.');
    } catch (err: unknown) {
      console.error('Lỗi khi xóa chuyến đi:', err);
      toast.error(((err as { response?: { data?: { message?: string } } }).response)?.data?.message || 'Không thể hủy chuyến đi. Vui lòng thử lại.');
    }
  };

  const handleUpdateStatus = async (rideId: string, newStatus: 'ONGOING' | 'COMPLETED') => {
    const actionText = newStatus === 'ONGOING' ? 'bắt đầu' : 'hoàn thành';
    if (!confirm(`Bạn có chắc chắn muốn xác nhận ${actionText} chuyến đi này?`)) return;

    try {
      await apiClient.patch(`/rides/${rideId}/status`, { status: newStatus });
      toast.success(`Đã cập nhật chuyến đi sang trạng thái ${newStatus === 'ONGOING' ? 'Đang diễn ra' : 'Đã hoàn thành'}.`);
      fetchData();
    } catch (err: unknown) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      toast.error(((err as { response?: { data?: { message?: string } } }).response)?.data?.message || 'Không thể cập nhật trạng thái chuyến đi.');
    }
  };

  const toggleExpandRide = async (rideId: string) => {
    if (expandedRideId === rideId) {
      setExpandedRideId(null);
      return;
    }
    
    setExpandedRideId(rideId);
    
    if (!rideBookings[rideId]) {
      setLoadingBookings(prev => ({ ...prev, [rideId]: true }));
      try {
        const res = await apiClient.get(`/bookings/ride/${rideId}`);
        // Lọc các đặt chỗ đã xác nhận (CONFIRMED) để hiển thị hành khách đi cùng thực tế
        const confirmedBookings = (res.data ?? []).filter((b: RideBooking) => b.status === 'CONFIRMED');
        setRideBookings(prev => ({ ...prev, [rideId]: confirmedBookings }));
      } catch (err) {
        console.error('Lỗi khi tải danh sách hành khách:', err);
        toast.error('Không thể tải danh sách hành khách đi cùng.');
      } finally {
        setLoadingBookings(prev => ({ ...prev, [rideId]: false }));
      }
    }
  };

  const upcomingRides = rides.filter(r => r.status === 'SCHEDULED' || r.status === 'ONGOING');
  const historyRides = rides.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');
  const displayRides = activeTab === 'upcoming' ? upcomingRides : historyRides;

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24 transition-colors duration-300">
      <div className="container max-w-[800px] mx-auto px-4 space-y-10 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] pb-8">
          <div>
            <h1 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.28px] leading-[1.07] text-[#1d1d1f] dark:text-white">
              Chuyến đi của tôi
            </h1>
            <p className="text-[17px] tracking-[-0.37px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] mt-2 max-w-lg">
              Quản lý các hành trình bạn đã tạo và sẵn sàng khởi hành.
            </p>
          </div>
          <Link href="/rides/post" className="shrink-0">
            <button className="bg-[#0071e3] text-white px-5 py-2 rounded-[980px] text-[14px] font-medium tracking-[-0.12px] hover:bg-[#0077ED] transition-colors flex items-center shadow-[0_4px_14px_rgba(0,113,227,0.3)]">
              <Plus className="mr-1.5 h-4 w-4" />
              Đăng chuyến mới
            </button>
          </Link>
        </div>

        {/* Tab Switch */}
        <div className="flex border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] pb-1 gap-6 justify-center md:justify-start">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`text-[16px] font-semibold pb-3 transition-all relative ${
              activeTab === 'upcoming'
                ? 'text-[#0071e3] border-b-2 border-[#0071e3]'
                : 'text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            Chuyến sắp lái ({upcomingRides.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`text-[16px] font-semibold pb-3 transition-all relative ${
              activeTab === 'history'
                ? 'text-[#0071e3] border-b-2 border-[#0071e3]'
                : 'text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            Lịch sử chuyến lái ({historyRides.length})
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
            <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] tracking-tight">Đang tải hồ sơ lái xe...</p>
          </div>
        ) : error ? (
          <div className="bg-[#d93025]/5 border border-[#d93025]/20 rounded-[24px] p-12 text-center text-[#d93025] flex flex-col items-center space-y-4">
            <AlertCircle className="h-12 w-12 opacity-80" />
            <p className="text-[17px] font-medium tracking-tight">{error}</p>
            <button 
              onClick={fetchData}
              className="text-[14px] font-semibold hover:underline mt-2"
            >
              Thử lại
            </button>
          </div>
        ) : displayRides.length > 0 ? (
          <div className="space-y-6">
            {displayRides.map((ride) => (
              <div key={ride.id} className="relative group bg-white dark:bg-[#1d1d1f] rounded-[24px] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none overflow-hidden">
                <RideCard ride={ride} />
                
                {/* Thanh trạng thái và nút cập nhật cho tài xế */}
                <div className="bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] px-6 py-4 md:px-8 border-t border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] font-medium">Trạng thái chuyến:</span>
                    {ride.status === 'SCHEDULED' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#0071e3]/10 text-[#0071e3]">Đã lên lịch</span>
                    )}
                    {ride.status === 'ONGOING' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#e0c200]/10 text-[#857000] dark:text-[#ffd60a] animate-pulse">Đang di chuyển</span>
                    )}
                    {ride.status === 'COMPLETED' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#34c759]/10 text-[#248a3d] dark:text-[#34c759]">Đã hoàn thành</span>
                    )}
                    {ride.status === 'CANCELLED' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#ff3b30]/10 text-[#d93025] dark:text-[#ff453a]">Đã hủy chuyến</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Hành động cập nhật trạng thái cho tab Upcoming */}
                    {activeTab === 'upcoming' && ride.status === 'SCHEDULED' && (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(ride.id, 'ONGOING')}
                          className="bg-[#34c759] text-white hover:bg-[#30b651] px-4 py-1.5 rounded-[980px] text-[13px] font-medium tracking-tight transition-colors flex items-center gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Bắt đầu lái
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteRide(ride.id)}
                          className="text-[13px] text-[#ff3b30] dark:text-[#ff453a] hover:underline font-medium flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hủy chuyến
                        </button>
                      </>
                    )}

                    {activeTab === 'upcoming' && ride.status === 'ONGOING' && (
                      <button 
                        onClick={() => handleUpdateStatus(ride.id, 'COMPLETED')}
                        className="bg-[#0071e3] text-white hover:bg-[#0077ED] px-4 py-1.5 rounded-[980px] text-[13px] font-medium tracking-tight transition-colors flex items-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Hoàn thành chuyến
                      </button>
                    )}

                    {/* Xem hành khách & đánh giá cho tab History */}
                    {activeTab === 'history' && ride.status === 'COMPLETED' && (
                      <button
                        onClick={() => toggleExpandRide(ride.id)}
                        className="text-[13px] text-[#0066cc] dark:text-[#2997ff] hover:underline font-medium flex items-center gap-1"
                      >
                        {expandedRideId === ride.id ? (
                          <>Thu gọn hành khách <ChevronUp className="h-3.5 w-3.5" /></>
                        ) : (
                          <>Xem hành khách đi cùng <ChevronDown className="h-3.5 w-3.5" /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Danh sách hành khách đi cùng (để đánh giá) */}
                {expandedRideId === ride.id && (
                  <div className="px-6 py-6 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] bg-[#fafafa] dark:bg-[#121212] animate-in slide-in-from-top-4 duration-300">
                    <h4 className="text-[15px] font-bold text-[#1d1d1f] dark:text-white mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#0071e3]" />
                      Hành khách trên chuyến đi
                    </h4>

                    {loadingBookings[ride.id] ? (
                      <div className="flex items-center justify-center py-6 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#0071e3]" />
                        <span className="text-[13px] text-[rgba(0,0,0,0.56)]">Đang tải danh sách...</span>
                      </div>
                    ) : !rideBookings[ride.id] || rideBookings[ride.id].length === 0 ? (
                      <p className="text-[13px] text-[rgba(0,0,0,0.48)] text-center py-4">Chuyến đi này không có hành khách nào đặt chỗ thành công.</p>
                    ) : (
                      <div className="space-y-4">
                        {rideBookings[ride.id].map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-3.5 bg-white dark:bg-[#1d1d1f] rounded-xl border border-[rgba(0,0,0,0.04)] shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden border">
                                {booking.passenger.avatarUrl ? (
                                  <img src={booking.passenger.avatarUrl} alt={booking.passenger.firstName} className="h-full w-full object-cover" />
                                ) : (
                                  <User className="h-4 w-4 text-[rgba(0,0,0,0.48)]" />
                                )}
                              </div>
                              <div>
                                <p className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white">
                                  {booking.passenger.firstName} {booking.passenger.lastName}
                                </p>
                                <p className="text-[12px] text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)]">
                                  Số ghế đặt: {booking.seats} • SĐT: {booking.passenger.phone || 'Chưa cung cấp'}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <ReviewDialog
                                rideId={ride.id}
                                revieweeId={booking.passenger.id}
                                revieweeName={`${booking.passenger.firstName} ${booking.passenger.lastName}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-16 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-transparent dark:border-[rgba(255,255,255,0.05)]">
            <Car className="h-16 w-16 text-[rgba(0,0,0,0.16)] dark:text-[rgba(255,255,255,0.16)] mx-auto mb-6" />
            <div className="space-y-2 mb-8">
              <p className="text-[21px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">
                {activeTab === 'upcoming' ? 'Vô lăng đang trống' : 'Lịch sử trống'}
              </p>
              <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] max-w-sm mx-auto leading-relaxed">
                {activeTab === 'upcoming' 
                  ? 'Chia sẻ hành trình của bạn với cộng đồng và bù đắp chi phí di chuyển một cách dễ dàng.'
                  : 'Bạn chưa hoàn thành chuyến đi nào với vai trò tài xế.'}
              </p>
            </div>
            {activeTab === 'upcoming' && (
              <Link href="/rides/post">
                <button className="bg-[#1d1d1f] dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-[980px] text-[14px] font-medium tracking-[-0.12px] transition-colors">
                  Trở thành tài xế ngay
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

