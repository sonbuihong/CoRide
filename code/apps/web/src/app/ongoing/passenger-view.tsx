import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Phone, MapPin, XCircle, Clock, ShieldCheck, Car, Map, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

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

/**
 * Xác định thông tin hiển thị trạng thái cho Passenger.
 * Tập trung logic tại đây — không rải điều kiện khắp component.
 */
function getPassengerStatusInfo(data: PassengerViewData): {
  color: string;
  text: string;
  Icon: React.ElementType;
} {
  const { status: bookingStatus, isPickedUp, ride } = data;

  if (bookingStatus === 'PENDING') {
    return {
      color: 'text-orange-700 bg-orange-100 border-orange-200',
      text: 'Đang chờ tài xế xác nhận',
      Icon: Clock,
    };
  }

  if (bookingStatus === 'CONFIRMED') {
    if (ride.status === 'SCHEDULED') {
      return {
        color: 'text-[#0071e3] bg-blue-50 border-blue-200',
        text: 'Tài xế đã nhận. Đang chờ khởi hành',
        Icon: ShieldCheck,
      };
    }

    if (ride.status === 'ONGOING') {
      if (isPickedUp) {
        return {
          color: 'text-[#248a3d] bg-green-50 border-green-200',
          text: 'Chuyến đi đã bắt đầu. Bạn đang trên xe',
          Icon: Car,
        };
      }
      return {
        color: 'text-[#0071e3] bg-blue-50 border-blue-200',
        text: 'Tài xế đang đến đón bạn',
        Icon: MapPin,
      };
    }
  }

  if (bookingStatus === 'COMPLETED') {
    return {
      color: 'text-gray-700 bg-gray-100 border-gray-200',
      text: 'Chuyến đi đã hoàn thành',
      Icon: CheckCircle,
    };
  }

  if (bookingStatus === 'CANCELLED') {
    return {
      color: 'text-red-700 bg-red-50 border-red-200',
      text: 'Đặt chỗ đã bị hủy',
      Icon: XCircle,
    };
  }

  return {
    color: 'text-gray-600 bg-gray-100 border-gray-200',
    text: 'Đang xử lý...',
    Icon: Clock,
  };
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function PassengerView({ data, onRefresh, isExpanded = true, onExpand }: PassengerViewProps) {
  const ride: Ride = data.ride;
  const driver: Driver | undefined = ride.driver;
  const bookingId: string = data.id;
  const bookingStatus: string = data.status;

  const handleCancelBooking = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy đặt chỗ này?')) return;
    try {
      await apiClient.patch(`/bookings/${bookingId}/cancel`);
      toast.success('Đã hủy đặt chỗ');
      onRefresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const { color: statusColor, text: statusText, Icon: StatusIcon } = getPassengerStatusInfo(data as PassengerViewData);
  const displayPrice = data.price ?? data.totalPrice ?? 0;

  return (
    <div className="w-full px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Chi tiết chuyến đi</h2>
          <p className="text-sm text-gray-500">
            {ride.departureTime
              ? new Date(ride.departureTime).toLocaleString('vi-VN', {
                  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
                })
              : 'Sắp đi'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">Giá tiền</p>
          <span className="text-lg font-bold text-[#0071e3]">{displayPrice.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {/* Trạng thái nổi bật */}
      <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 border ${statusColor}`}>
        <StatusIcon className="w-5 h-5 shrink-0" />
        <span className="text-sm font-semibold">{statusText}</span>
      </div>

      {/* Thông tin tài xế */}
      {isExpanded && driver && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border border-gray-100">
              {driver.avatarUrl ? (
                <img src={driver.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">{driver.firstName} {driver.lastName}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-medium">
                  {ride.vehicleType === 'CAR' ? 'Ô TÔ' : 'XE MÁY'}
                </span>
                <span>• {driver.driverRating ? `${driver.driverRating.toFixed(1)}` : 'Mới'}</span>
              </div>
            </div>
          </div>
          {bookingStatus === 'CONFIRMED' && driver.phone && (
            <a href={`tel:${driver.phone}`} className="p-3 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors">
              <Phone className="w-5 h-5" />
            </a>
          )}
        </div>
      )}

      {/* Lộ trình */}
      <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100 relative">
        <div className="flex flex-col items-center gap-1 mt-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <div className="w-0.5 h-8 bg-gray-300"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="pr-10">
            <p className="text-xs text-gray-500">Điểm đón</p>
            <p className="text-sm font-medium text-gray-900 truncate">{ride.origin}</p>
          </div>
          <div className="pr-10">
            <p className="text-xs text-gray-500">Điểm đến</p>
            <p className="text-sm font-medium text-gray-900 truncate">{ride.destination}</p>
          </div>
        </div>
        <a
          href={`https://www.google.com/maps/dir/?api=1&origin=${ride.originLat},${ride.originLng}&destination=${ride.destinationLat},${ride.destinationLng}&travelmode=driving`}
          target="_blank"
          rel="noreferrer"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
          title="Mở Google Maps"
        >
          <Map className="w-5 h-5" />
        </a>
      </div>

      {!isExpanded && (
        <div className="flex justify-center mb-2 mt-2">
          <button onClick={onExpand} className="text-xs text-blue-600 font-medium hover:underline">
            Xem thêm chi tiết & thông tin tài xế
          </button>
        </div>
      )}

      {/* Nút hủy đặt chỗ — chỉ khi còn có thể hủy */}
      {isExpanded && (
        <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col gap-2">
          {(bookingStatus === 'PENDING' || (bookingStatus === 'CONFIRMED' && ride.status === 'SCHEDULED')) && (
            <Button
              variant="outline"
              className="w-full h-12 text-[15px] rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 border-gray-200 bg-white"
              onClick={handleCancelBooking}
            >
              <XCircle className="w-5 h-5 mr-2" /> Hủy đặt chỗ
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
