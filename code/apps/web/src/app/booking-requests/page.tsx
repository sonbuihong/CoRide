'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import apiClient from '../../lib/api-client';
import { Loader2, User, Phone, Check, X, Clock, MapPin, Calendar, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { useSocket } from '@/components/providers/socket-provider';

const BookingDirectionsMap = dynamic(
  () => import('../../components/BookingDirectionsMap'),
  { ssr: false }
);

interface BookingRequest {
  id: string;
  rideId: string;
  passengerId: string;
  seats: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  passenger: {
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string;
  };
  ride: {
    origin: string;
    originLat: number;
    originLng: number;
    destination: string;
    departureTime: string;
  };
}

export default function BookingRequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [mapOpenFor, setMapOpenFor] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchRequests = useCallback(async () => {
    try {
      const response = await apiClient.get('/bookings/driver');
      setRequests(response.data.bookings);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách yêu cầu:', error);
      toast.error('Không thể tải danh sách yêu cầu đặt chỗ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Real-time cập nhật danh sách yêu cầu khi có thông báo mới (ví dụ khi khách vừa đặt)
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notif: { type: string }) => {
      if (notif.type === 'BOOKING_REQUEST') {
        // Tải lại danh sách yêu cầu nếu có người mới đặt
        fetchRequests();
      }
    };
    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, fetchRequests]);

  const handleUpdateStatus = async (bookingId: string, status: 'CONFIRMED' | 'REJECTED') => {
    const actionText = status === 'CONFIRMED' ? 'chấp nhận' : 'từ chối';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} yêu cầu đặt chỗ này không?`)) return;

    setProcessingId(bookingId);
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status });
      toast.success(`Đã ${actionText} yêu cầu thành công.`);
      fetchRequests();
    } catch (error: unknown) {
      toast.error(((error as { response?: { data?: { message?: string } } }).response)?.data?.message || `Lỗi khi ${actionText} yêu cầu.`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#f5f5f7] dark:bg-black pt-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
        <p className="mt-4 text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] tracking-tight">Đang tải danh sách yêu cầu...</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const otherRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24 transition-colors duration-300">
      <div className="container max-w-[800px] mx-auto px-4 space-y-12 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="text-center md:text-left border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] pb-8">
          <h1 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.28px] leading-[1.07] text-[#1d1d1f] dark:text-white">
            Yêu cầu đặt chỗ
          </h1>
          <p className="text-[17px] tracking-[-0.37px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] mt-2">
            Quản lý những hành khách muốn tham gia chuyến đi của bạn.
          </p>
        </div>

        <div className="space-y-12">
          {/* Yêu cầu đang chờ duyệt */}
          <section>
            <h2 className="text-[21px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white flex items-center mb-6">
              <Clock className="mr-2 h-5 w-5 text-[#f5a623]" />
              Đang chờ duyệt <span className="bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] text-[#1d1d1f] dark:text-white px-2 py-0.5 rounded-[980px] text-[14px] ml-2 font-medium">{pendingRequests.length}</span>
            </h2>
            
            {pendingRequests.length === 0 ? (
              <div className="bg-white/60 dark:bg-[#1d1d1f]/60 backdrop-blur rounded-[24px] p-8 text-center border border-transparent dark:border-[rgba(255,255,255,0.05)]">
                <p className="text-[14px] text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] italic tracking-tight">Không có yêu cầu nào đang chờ xử lý.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="bg-white dark:bg-[#1d1d1f] rounded-[24px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)]">
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row justify-between gap-8">
                        
                        {/* Passenger Info */}
                        <div className="space-y-5">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden">
                              {request.passenger.avatarUrl ? (
                                <img src={request.passenger.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-6 w-6 text-[rgba(0,0,0,0.48)]" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-[17px] tracking-tight text-[#1d1d1f] dark:text-white">{request.passenger.firstName} {request.passenger.lastName}</p>
                              <p className="text-[12px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] flex items-center mt-1">
                                <Phone className="mr-1 h-3.5 w-3.5" /> {request.passenger.phone}
                              </p>
                            </div>
                          </div>

                          <div className="relative pl-4">
                            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.1)] rounded-full"></div>
                            <p className="text-[14px] font-medium text-[#1d1d1f] dark:text-white tracking-tight flex items-center gap-1.5 mb-1.5">
                              <MapPin className="h-3.5 w-3.5 text-[#0071e3]" />
                              {request.ride.origin} → {request.ride.destination}
                            </p>
                            <p className="text-[12px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] flex items-center gap-1.5 pl-5">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(request.ride.departureTime).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Area */}
                        <div className="flex flex-col justify-between items-start md:items-end border-t border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] pt-5 md:border-0 md:pt-0">
                          <div className="text-left md:text-right mb-4 w-full">
                            <p className="text-[12px] uppercase font-semibold text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] tracking-wider">Yêu cầu</p>
                            <div className="flex items-baseline md:justify-end gap-1 mt-1">
                              <p className="text-[28px] font-semibold tracking-[-0.04em] text-[#0071e3] leading-none">{request.seats}</p>
                              <p className="text-[14px] font-medium text-[#0071e3]">ghế</p>
                            </div>
                            <p className="text-[14px] font-medium text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] mt-1.5">{request.totalPrice.toLocaleString('vi-VN')} đ</p>
                          </div>
                          
                          <div className="flex space-x-3 w-full md:w-auto mt-3 md:mt-0">
                            <button 
                              className="flex-1 md:flex-none border border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3]/10 dark:text-[#2997ff] dark:border-[#2997ff] dark:hover:bg-[#2997ff]/10 px-5 py-2.5 rounded-[980px] text-[14px] font-medium transition-colors flex items-center justify-center items-center"
                              onClick={() => setMapOpenFor(mapOpenFor === request.id ? null : request.id)}
                            >
                              <Navigation className="mr-1.5 h-4 w-4" /> {mapOpenFor === request.id ? 'Đóng bản đồ' : 'Chỉ đường'}
                            </button>
                            <button 
                              className="flex-1 md:flex-none border border-[#ff3b30] text-[#d93025] hover:bg-[#ff3b30]/10 dark:text-[#ff453a] dark:border-[#ff453a] dark:hover:bg-[#ff453a]/10 px-5 py-2.5 rounded-[980px] text-[14px] font-medium transition-colors flex items-center justify-center items-center"
                              onClick={() => handleUpdateStatus(request.id, 'REJECTED')}
                              disabled={processingId === request.id}
                            >
                              {processingId === request.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <X className="mr-1.5 h-4 w-4" />} Từ chối
                            </button>
                            <button 
                              className="flex-1 md:flex-none bg-[#34c759] text-white hover:bg-[#2eaa4e] px-5 py-2.5 rounded-[980px] text-[14px] font-medium transition-colors flex items-center justify-center shadow-[0_4px_14px_rgba(52,199,89,0.3)]"
                              onClick={() => handleUpdateStatus(request.id, 'CONFIRMED')}
                              disabled={processingId === request.id}
                            >
                              {processingId === request.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />} Chấp nhận
                            </button>
                          </div>
                        </div>
                        
                      </div>

                      {/* Map Section */}
                      {mapOpenFor === request.id && (
                        <div className="mt-6 border-t border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] pt-6 animate-in slide-in-from-top-4 duration-300">
                          <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-4 flex items-center">
                            <Navigation className="h-4 w-4 mr-1.5 text-[#0071e3]" />
                            Chỉ đường từ vị trí của bạn đến điểm đón
                          </h3>
                          <BookingDirectionsMap 
                            pickupLat={request.ride.originLat} 
                            pickupLng={request.ride.originLng} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Lịch sử yêu cầu khác */}
          {otherRequests.length > 0 && (
            <section>
              <h2 className="text-[17px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-4">Lịch sử yêu cầu</h2>
              <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] overflow-hidden">
                <div className="divide-y divide-[rgba(0,0,0,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                  {otherRequests.map((request) => (
                    <div key={request.id} className="p-4 px-6 flex flex-col md:flex-row md:items-center justify-between text-[14px] text-[rgba(0,0,0,0.64)] dark:text-[rgba(255,255,255,0.64)] flex-wrap gap-2 transition-colors hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)]">
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold text-[#1d1d1f] dark:text-white w-32 truncate">{request.passenger.firstName} {request.passenger.lastName}</span>
                        <span className="bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] px-2 py-0.5 rounded-[980px] font-medium text-[12px]">{request.seats} ghế</span>
                        <span className="hidden md:inline border-l border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] h-4 mx-2"></span>
                        <span className="truncate max-w-[200px] text-[12px] md:text-[14px]">{request.ride.origin} → {request.ride.destination}</span>
                      </div>
                      <div className="flex items-center">
                        {request.status === 'CONFIRMED' && <span className="text-[#34c759] font-medium text-[12px] flex items-center"><Check className="h-3.5 w-3.5 mr-1" /> Đã chấp nhận</span>}
                        {request.status === 'REJECTED' && <span className="text-[#ff3b30] dark:text-[#ff453a] font-medium text-[12px] flex items-center"><X className="h-3.5 w-3.5 mr-1" /> Đã từ chối</span>}
                        {request.status === 'CANCELLED' && <span className="text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] font-medium text-[12px] flex items-center"><X className="h-3.5 w-3.5 mr-1" /> Khách đã hủy</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
