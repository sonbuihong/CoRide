'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSocket } from '@/components/providers/socket-provider';
import { useAuth } from '@/components/providers/auth-provider';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { Loader2, Check, X, User, MapPin } from 'lucide-react';
import { SocketEvents } from '@repo/shared';

/**
 * Payload nhận từ socket event 'booking:new_request'.
 * isScheduled = true → chuyến SCHEDULED (không có timeout tự reject)
 * isScheduled = false/undefined → chuyến ONGOING (có countdown)
 */
interface BookingRequestPayload {
  bookingId: string;
  passenger: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
    passengerRating?: number;
  };
  seats: number;
  totalPrice: number;
  rideId: string;
  origin?: string;
  destination?: string;
  isScheduled?: boolean;
  // ONGOING-specific fields
  pickupAddress?: string;
  detourKm?: number;
  timeoutSeconds?: number;
}

/**
 * BookingRequestPopup — Component popup toàn cục cho tài xế.
 *
 * Được mount trong root layout, luôn lắng nghe socket event 'booking:new_request'.
 * Khi hành khách đặt chỗ → popup xuất hiện ngay lập tức cho tài xế.
 * Tài xế nhấn Chấp nhận/Từ chối → gọi API → dismiss popup.
 *
 * Hỗ trợ cả 2 loại chuyến:
 * - SCHEDULED: không có countdown, tài xế có thể dismiss và xử lý sau
 * - ONGOING: có countdown (timeoutSeconds), sau khi hết giờ server tự reject
 */
export function BookingRequestPopup() {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [pendingRequest, setPendingRequest] = useState<BookingRequestPayload | null>(null);
  const [processingAction, setProcessingAction] = useState<'accept' | 'reject' | null>(null);
  // Countdown chỉ dùng cho chuyến ONGOING
  const [countdown, setCountdown] = useState<number | null>(null);

  // Nhận event booking mới từ socket
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewRequest = (payload: BookingRequestPayload) => {
      setPendingRequest(payload);
      // Nếu ONGOING → bắt đầu countdown
      if (!payload.isScheduled && payload.timeoutSeconds) {
        setCountdown(payload.timeoutSeconds);
      } else {
        setCountdown(null);
      }
    };

    socket.on(SocketEvents.BOOKING_NEW_REQUEST, handleNewRequest);
    return () => {
      socket.off(SocketEvents.BOOKING_NEW_REQUEST, handleNewRequest);
    };
  }, [socket, user]);

  // Countdown timer cho chuyến ONGOING
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Hết giờ → dismiss popup (server đã tự reject)
          setPendingRequest(null);
          toast.error('Yêu cầu đã hết thời gian. Server đã tự động từ chối.');
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleAction = useCallback(
    async (action: 'CONFIRMED' | 'REJECTED') => {
      if (!pendingRequest) return;

      const actionLabel = action === 'CONFIRMED' ? 'accept' : 'reject';
      setProcessingAction(actionLabel);

      try {
        await apiClient.patch(`/bookings/${pendingRequest.bookingId}/status`, {
          status: action,
        });

        toast.success(
          action === 'CONFIRMED'
            ? 'Đã chấp nhận yêu cầu đặt chỗ thành công!'
            : 'Đã từ chối yêu cầu đặt chỗ.'
        );

        setPendingRequest(null);
        setCountdown(null);
      } catch (error: unknown) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const message =
          axiosError.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
        toast.error(message);
      } finally {
        setProcessingAction(null);
      }
    },
    [pendingRequest]
  );

  const handleDismiss = useCallback(() => {
    // Chỉ cho phép dismiss (không từ chối) với chuyến SCHEDULED
    // Vì với SCHEDULED, tài xế có thể xử lý sau trong trang /booking-requests
    if (pendingRequest?.isScheduled) {
      setPendingRequest(null);
    }
  }, [pendingRequest]);

  // Không hiện gì nếu không có request
  if (!pendingRequest) return null;

  const isProcessing = processingAction !== null;
  const isScheduled = pendingRequest.isScheduled ?? false;
  const passengerName = `${pendingRequest.passenger.firstName} ${pendingRequest.passenger.lastName}`;

  return (
    // Overlay backdrop mờ
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Popup Card */}
      <div className="w-full max-w-sm bg-white dark:bg-[#1d1d1f] rounded-[28px] shadow-[0_32px_64px_rgba(0,0,0,0.3)] overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]">

        {/* Header */}
        <div className="bg-[#0071e3] px-6 pt-6 pb-5">
          <p className="text-[12px] font-semibold tracking-widest uppercase text-white/70 mb-1">
            {isScheduled ? 'Yêu cầu đặt chỗ mới' : 'Yêu cầu ghép chuyến'}
          </p>
          <h2 className="text-[22px] font-semibold tracking-tight text-white leading-tight">
            {isScheduled
              ? 'Hành khách muốn đặt chỗ'
              : 'Hành khách muốn ghép chuyến'}
          </h2>
          {/* Countdown cho ONGOING */}
          {!isScheduled && countdown !== null && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{
                    width: `${(countdown / (pendingRequest.timeoutSeconds ?? 30)) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[13px] font-semibold text-white shrink-0 tabular-nums">
                {countdown}s
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Thông tin hành khách */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden shrink-0">
              {pendingRequest.passenger.avatarUrl ? (
                <img
                  src={pendingRequest.passenger.avatarUrl}
                  alt={passengerName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]" />
              )}
            </div>
            <div>
              <p className="font-semibold text-[17px] tracking-tight text-[#1d1d1f] dark:text-white">
                {passengerName}
              </p>
              {pendingRequest.passenger.passengerRating && (
                <p className="text-[12px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  Đánh giá: {pendingRequest.passenger.passengerRating.toFixed(1)} / 5.0
                </p>
              )}
            </div>
          </div>

          {/* Thông tin chuyến */}
          <div className="bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] p-4 space-y-2.5">
            {(pendingRequest.origin || pendingRequest.destination) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#0071e3] mt-0.5 shrink-0" />
                <p className="text-[14px] font-medium text-[#1d1d1f] dark:text-white leading-snug">
                  {pendingRequest.origin} → {pendingRequest.destination}
                </p>
              </div>
            )}
            {pendingRequest.pickupAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#34c759] mt-0.5 shrink-0" />
                <p className="text-[13px] text-[rgba(0,0,0,0.64)] dark:text-[rgba(255,255,255,0.64)]">
                  Điểm đón: {pendingRequest.pickupAddress}
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-1 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
              <div>
                <p className="text-[11px] uppercase font-semibold tracking-wider text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]">
                  Số ghế
                </p>
                <p className="text-[20px] font-semibold tracking-tight text-[#0071e3]">
                  {pendingRequest.seats}
                </p>
              </div>
              <div className="border-l border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]" />
              <div>
                <p className="text-[11px] uppercase font-semibold tracking-wider text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]">
                  Tổng tiền
                </p>
                <p className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                  {pendingRequest.totalPrice.toLocaleString('vi-VN')}đ
                </p>
              </div>
              {pendingRequest.detourKm !== undefined && (
                <>
                  <div className="border-l border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]" />
                  <div>
                    <p className="text-[11px] uppercase font-semibold tracking-wider text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]">
                      Chệch đường
                    </p>
                    <p className="text-[20px] font-semibold tracking-tight text-[#f5a623]">
                      {pendingRequest.detourKm.toFixed(1)}km
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Nút action */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => handleAction('REJECTED')}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-transparent hover:bg-[rgba(255,59,48,0.06)] text-[#d93025] dark:text-[#ff453a] font-semibold text-[15px] transition-colors disabled:opacity-50"
            >
              {processingAction === 'reject' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Từ chối
            </button>

            <button
              onClick={() => handleAction('CONFIRMED')}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] bg-[#34c759] hover:bg-[#2eaa4e] text-white font-semibold text-[15px] transition-colors shadow-[0_4px_14px_rgba(52,199,89,0.35)] disabled:opacity-50"
            >
              {processingAction === 'accept' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Chấp nhận
            </button>
          </div>

          {/* Dismiss hint — chỉ với SCHEDULED */}
          {isScheduled && (
            <p
              onClick={handleDismiss}
              className="text-center text-[12px] text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)] cursor-pointer hover:text-[rgba(0,0,0,0.7)] dark:hover:text-[rgba(255,255,255,0.7)] transition-colors pt-1"
            >
              Bỏ qua, xử lý sau trong trang Yêu cầu đặt chỗ
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
