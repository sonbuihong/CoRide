'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '../../lib/api-client';
import { Loader2, Calendar, Users, DollarSign, XCircle, CheckCircle, Clock, Star } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ReviewDialog } from '../../components/rides/review-dialog';

interface Booking {
  id: string;
  rideId: string;
  seats: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  ride: {
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    origin: string;
    destination: string;
    departureTime: string;
    driver: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get('/bookings/my');
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đặt chỗ:', error);
      toast.error('Không thể tải danh sách đặt chỗ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu đặt chỗ này không?')) return;

    setCancellingId(bookingId);
    try {
      await apiClient.patch(`/bookings/${bookingId}/cancel`);
      toast.success('Đã hủy yêu cầu đặt chỗ thành công.');
      fetchBookings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? 'Lỗi khi hủy đặt chỗ.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (booking: Booking) => {
    // Nếu chuyến đi đã kết thúc/hủy, hiển thị trạng thái chuyến đi
    if (booking.ride.status === 'COMPLETED') {
      return <span className="inline-flex items-center px-3 py-1 rounded-[980px] text-[12px] font-semibold bg-[#34c759]/10 text-[#248a3d] dark:text-[#34c759] tracking-[-0.12px]"><CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Đã hoàn thành chuyến</span>;
    }
    if (booking.ride.status === 'CANCELLED') {
      return <span className="inline-flex items-center px-3 py-1 rounded-[980px] text-[12px] font-semibold bg-[#ff3b30]/10 text-[#d93025] dark:text-[#ff453a] tracking-[-0.12px]"><XCircle className="mr-1.5 h-3.5 w-3.5" /> Chuyến đi đã bị hủy bởi tài xế</span>;
    }
    if (booking.ride.status === 'ONGOING') {
      return <span className="inline-flex items-center px-3 py-1 rounded-[980px] text-[12px] font-semibold bg-[#0071e3]/10 text-[#0071e3] tracking-[-0.12px]"><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Chuyến đi đang diễn ra</span>;
    }

    // Nếu không thì hiển thị trạng thái của booking
    switch (booking.status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-3 py-1 rounded-[980px] text-[12px] font-semibold bg-[#f5a623]/10 text-[#d48806] dark:text-[#f5a623] tracking-[-0.12px]"><Clock className="mr-1.5 h-3.5 w-3.5" /> Đang chờ duyệt</span>;
      case 'CONFIRMED':
        return <span className="inline-flex items-center px-3 py-1 rounded-[980px] text-[12px] font-semibold bg-[#34c759]/10 text-[#248a3d] dark:text-[#34c759] tracking-[-0.12px]"><CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Đã xác nhận đặt chỗ</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-3 py-1 rounded-[980px] text-[12px] font-semibold bg-[#ff3b30]/10 text-[#d93025] dark:text-[#ff453a] tracking-[-0.12px]"><XCircle className="mr-1.5 h-3.5 w-3.5" /> Bị từ chối đặt chỗ</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-3 py-1 rounded-[980px] text-[12px] font-semibold bg-[rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.1)] text-[rgba(0,0,0,0.64)] dark:text-[rgba(255,255,255,0.64)] tracking-[-0.12px]"><XCircle className="mr-1.5 h-3.5 w-3.5" /> Đã hủy đặt chỗ</span>;
      default:
        return null;
    }
  };

  const upcomingBookings = bookings.filter(
    (b) =>
      (b.status === 'PENDING' || b.status === 'CONFIRMED') &&
      (b.ride.status === 'SCHEDULED' || b.ride.status === 'ONGOING')
  );

  const historyBookings = bookings.filter(
    (b) =>
      b.status === 'CANCELLED' ||
      b.status === 'REJECTED' ||
      b.ride.status === 'COMPLETED' ||
      b.ride.status === 'CANCELLED'
  );

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : historyBookings;

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24 transition-colors duration-300">
      <div className="container max-w-[800px] mx-auto px-4 space-y-10 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="text-center md:text-left border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] pb-8">
          <h1 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.28px] leading-[1.07] text-[#1d1d1f] dark:text-white">
            Chuyến đã đặt
          </h1>
          <p className="text-[17px] tracking-[-0.37px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] mt-2">
            Lịch sử đồng hành của bạn trên hành trình CoRide.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] pb-1 gap-6 justify-center md:justify-start">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`text-[16px] font-semibold pb-3 transition-all relative ${
              activeTab === 'upcoming'
                ? 'text-[#0071e3] border-b-2 border-[#0071e3]'
                : 'text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            Chuyến đi sắp tới ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`text-[16px] font-semibold pb-3 transition-all relative ${
              activeTab === 'history'
                ? 'text-[#0071e3] border-b-2 border-[#0071e3]'
                : 'text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            Lịch sử đặt xe ({historyBookings.length})
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
            <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] tracking-tight">Đang tải hồ sơ đặt chỗ...</p>
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-12 text-center shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-transparent dark:border-[rgba(255,255,255,0.05)]">
            <Calendar className="h-16 w-16 text-[rgba(0,0,0,0.16)] dark:text-[rgba(255,255,255,0.16)] mx-auto mb-6" />
            <p className="text-[21px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight mb-2">Chưa có chuyến đi nào</p>
            <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] mb-8 max-w-[300px] mx-auto">
              {activeTab === 'upcoming' 
                ? 'Bạn chưa thực hiện bất kỳ yêu cầu đặt chỗ sắp tới nào.'
                : 'Lịch sử đặt chỗ của bạn hiện tại đang trống.'}
            </p>
            {activeTab === 'upcoming' && (
              <Link href="/rides/search">
                <button className="bg-[#0071e3] text-white px-6 py-2.5 rounded-[980px] text-[14px] font-medium tracking-[-0.12px] hover:bg-[#0077ED] transition-colors">
                  Tìm chuyến đi ngay
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {displayBookings.map((booking) => (
              <div key={booking.id} className="bg-white dark:bg-[#1d1d1f] rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)]">
                
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                    <div>
                      <h3 className="text-[21px] md:text-[24px] font-semibold tracking-tight leading-none text-[#1d1d1f] dark:text-white mb-2">
                        {booking.ride.origin} → {booking.ride.destination}
                      </h3>
                      <p className="text-[14px] font-medium text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] flex items-center">
                        <Calendar className="mr-1.5 h-4 w-4" />
                        {new Date(booking.ride.departureTime).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(booking)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-5 border-t border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
                    <div>
                      <p className="text-[12px] uppercase font-semibold tracking-wider text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] mb-1">Số ghế</p>
                      <p className="text-[17px] font-medium tracking-tight text-[#1d1d1f] dark:text-white flex items-center">
                        <Users className="mr-1.5 h-4 w-4 text-[#0071e3]" /> {booking.seats}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] uppercase font-semibold tracking-wider text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] mb-1">Tổng phí</p>
                      <p className="text-[17px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white flex items-center">
                        <DollarSign className="mr-1 h-4 w-4 text-[#0071e3]" /> {booking.totalPrice.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[12px] uppercase font-semibold tracking-wider text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] mb-1">Tài xế</p>
                      <p className="text-[17px] font-medium tracking-tight text-[#1d1d1f] dark:text-white">
                        {booking.ride.driver.firstName} {booking.ride.driver.lastName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] px-6 py-4 md:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <Link href={`/rides/${booking.rideId}`}>
                    <button className="text-[14px] text-[#0066cc] dark:text-[#2997ff] font-medium hover:underline tracking-[-0.12px]">
                      Xem thông tin chuyến &gt;
                    </button>
                  </Link>

                  {/* Hiện nút hủy đối với chuyến đi sắp tới chưa diễn ra */}
                  {activeTab === 'upcoming' && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <button 
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="text-[14px] text-[#ff3b30] dark:text-[#ff453a] font-medium hover:underline tracking-[-0.12px] flex items-center"
                    >
                      {cancellingId === booking.id ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Đang hủy...</>
                      ) : (
                        'Hủy đặt chỗ'
                      )}
                    </button>
                  )}

                  {/* Hiện nút đánh giá tài xế đối với chuyến đi đã COMPLETED và booking là CONFIRMED */}
                  {activeTab === 'history' && booking.ride.status === 'COMPLETED' && booking.status === 'CONFIRMED' && (
                    <div className="w-full sm:w-auto">
                      <ReviewDialog 
                        rideId={booking.rideId} 
                        revieweeId={booking.ride.driver.id} 
                        revieweeName={`${booking.ride.driver.firstName} ${booking.ride.driver.lastName}`} 
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

