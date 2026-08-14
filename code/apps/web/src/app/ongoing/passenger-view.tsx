import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Phone, MapPin, Navigation, Loader2, MessageSquare, MoreHorizontal } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { PaymentSimulatorDialog } from '@/components/booking/payment-simulator-dialog';
import { useState } from 'react';
import { ChatWindow } from '@/components/chat/chat-window';
import { useAuth } from '@/components/providers/auth-provider';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  driverRating?: number | null;
  driverRatingCount?: number | null;
}

interface Ride {
  id: string;
  origin: string;
  originLat?: number | null;
  originLng?: number | null;
  destination: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  vehicleType?: string;
  departureTime?: string;
  driver?: Driver;
}

interface PassengerViewData {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  paymentStatus?: 'UNPAID' | 'PAID' | 'REFUNDED';
  isPickedUp?: boolean;
  price?: number;
  totalPrice?: number;
  ride: Ride;
}

interface PassengerViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  onRefresh: () => void;
  isExpanded?: boolean;
  onExpand?: () => void;
}

// ─── Status Text Mapping ────────────────────────────────────────────────────

function getPassengerStatusInfo(data: PassengerViewData): {
  color: string;
  text: string;
} {
  const { status: bookingStatus, isPickedUp, ride } = data;

  if (bookingStatus === 'PENDING') {
    return {
      color: 'text-orange-600',
      text: 'Đang chờ xác nhận',
    };
  }

  if (bookingStatus === 'CONFIRMED') {
    if (ride.status === 'SCHEDULED') {
      return {
        color: 'text-[#0071e3]',
        text: 'Tài xế sắp khởi hành',
      };
    }

    if (ride.status === 'ONGOING') {
      if (isPickedUp) {
        return {
          color: 'text-green-600',
          text: 'Đang di chuyển',
        };
      }
      return {
        color: 'text-[#0071e3]',
        text: 'Tài xế đang đến đón',
      };
    }
  }

  if (bookingStatus === 'COMPLETED') {
    return {
      color: 'text-gray-600',
      text: 'Đã hoàn thành',
    };
  }

  if (bookingStatus === 'CANCELLED') {
    return {
      color: 'text-red-600',
      text: 'Đã hủy',
    };
  }

  return {
    color: 'text-gray-600',
    text: 'Đang xử lý...',
  };
}

export default function PassengerView({ data, onRefresh, isExpanded = true, onExpand }: PassengerViewProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuth();
  
  const ride: Ride = data.ride;
  const driver: Driver | undefined = ride.driver;
  const bookingId: string = data.id;
  const bookingStatus: string = data.status;

  const handleCancelBooking = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy đặt chỗ này?')) return;
    try {
      await apiClient.patch(`/bookings/${bookingId}/cancel`, {
        cancelReason: 'Hành khách chủ động hủy đặt chỗ',
      });
      toast.success('Đã hủy đặt chỗ');
      onRefresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const { color: statusColor, text: statusText } = getPassengerStatusInfo(data as PassengerViewData);
  const displayPrice = data.price ?? data.totalPrice ?? 0;
  
  const mapLink = `https://www.google.com/maps/dir/?api=1&origin=${ride.originLat},${ride.originLng}&destination=${ride.destinationLat},${ride.destinationLng}&travelmode=driving`;

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col bg-white">
      {/* Header - Grab/Be Style */}
      <div className="flex items-center justify-between pb-3 pt-2 px-4 border-b border-gray-100 shrink-0">
        <button className="flex flex-col items-center gap-1 w-16" onClick={onExpand}>
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-[13px] font-bold text-gray-700">1</span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">Địa điểm</span>
        </button>
        
        <div className="flex flex-col items-center flex-1 text-center px-2">
          <span className={`text-[16px] font-bold ${statusColor}`}>{statusText}</span>
          <span className="text-[13px] text-gray-500 mt-0.5 font-medium">
            {ride.vehicleType === 'CAR' ? 'CoRide Car' : 'CoRide Bike'}
          </span>
        </div>
        
        <a href={mapLink} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 w-16">
          <div className="w-10 h-10 bg-[#0071e3] rounded-full flex items-center justify-center shadow-sm">
            <Navigation className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="text-[10px] text-gray-500 font-medium">Chỉ đường</span>
        </a>
      </div>

      {/* Sticky Info & Actions */}
      <div className="px-4 pt-4 shrink-0 bg-white z-10">
        {driver ? (
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h2 className="text-[18px] font-medium text-gray-900">{driver.firstName} {driver.lastName}</h2>
              {/* Address */}
              <div className="mt-1.5">
                <p className="text-[14px] text-gray-800 line-clamp-2 leading-snug">
                  {ride.origin}
                </p>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[15px] font-semibold">{displayPrice.toLocaleString('vi-VN')}đ</span>
                <span className="bg-[#0071e3] text-white text-[11px] px-2 py-0.5 rounded font-medium">Tiền mặt</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
              {driver.avatarUrl ? (
                <img src={driver.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-gray-500" />
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center py-6 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#0071e3]" />
            <p className="text-sm">Đang tìm tài xế...</p>
          </div>
        )}

        {/* Action Bar */}
        {driver && (
          <div className="flex items-center justify-between py-3 border-y border-gray-100 mt-4">
            <a href={`tel:${driver.phone}`} className="flex flex-col items-center gap-1 flex-1 hover:bg-gray-50 py-1 border-r border-gray-100">
              <Phone className="w-6 h-6 text-gray-700" fill="currentColor" />
              <span className="text-[12px] text-gray-700 font-medium">Gọi</span>
            </a>
            <button className="flex flex-col items-center gap-1 flex-1 hover:bg-gray-50 py-1 border-r border-gray-100" onClick={() => setShowChat(true)}>
              <MessageSquare className="w-6 h-6 text-gray-700" fill="currentColor" />
              <span className="text-[12px] text-gray-700 font-medium">Nhắn tin</span>
            </button>
            <button className="flex flex-col items-center gap-1 flex-1 hover:bg-gray-50 py-1" onClick={onExpand}>
              <MoreHorizontal className="w-6 h-6 text-gray-700" />
              <span className="text-[12px] text-gray-700 font-medium">Chi tiết</span>
            </button>
          </div>
        )}
      </div>



      {/* Bottom Action Button - FIXED AT BOTTOM */}
      <div className="p-4 pt-3 pb-6 bg-white border-t border-gray-100 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] shrink-0 mt-auto">
        {(bookingStatus === 'PENDING' || (bookingStatus === 'CONFIRMED' && ride.status === 'SCHEDULED')) ? (
          <Button
            variant="outline"
            className="w-full h-14 text-[16px] rounded-full text-red-500 border-red-200 bg-white hover:bg-red-50 hover:text-red-600 font-semibold shadow-sm"
            onClick={handleCancelBooking}
          >
            Hủy chuyến
          </Button>
        ) : (bookingStatus === 'CONFIRMED' || bookingStatus === 'COMPLETED') && data.paymentStatus === 'UNPAID' ? (
          <Button
            className="w-full h-14 text-[16px] rounded-full bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-semibold shadow-sm"
            onClick={() => setShowPayment(true)}
          >
            Thanh toán QR
          </Button>
        ) : (
          <div className="w-full h-14 flex items-center justify-center rounded-full border border-green-500 bg-white text-green-600 font-semibold text-[16px] shadow-sm">
            {statusText}
          </div>
        )}
      </div>

      <PaymentSimulatorDialog 
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        bookingId={bookingId}
        onPaymentSuccess={onRefresh}
      />

      {showChat && driver && user && (
        <div className="fixed inset-0 z-50 bg-black/20 flex flex-col justify-end sm:justify-center sm:items-center">
          <div className="w-full sm:max-w-md bg-background h-[75vh] sm:h-[500px] sm:rounded-lg shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10">
            <ChatWindow
              rideId={ride.id}
              otherUserId={driver.id}
              otherUserName={`${driver.firstName} ${driver.lastName}`}
              currentUserId={user.id}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
