import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Phone, MapPin, XCircle, Clock, ShieldCheck, Car } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PassengerView({ data, onRefresh }: { data: any, onRefresh: () => void }) {
  const ride = data.ride;
  const driver = ride.driver;
  const bookingId = data.id;
  const bookingStatus = data.status; // PENDING, CONFIRMED, CANCELLED, REJECTED
  
  const handleCancelBooking = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy đặt chỗ này?')) return;
    try {
      await apiClient.patch(`/bookings/${bookingId}/cancel`);
      toast.success('Đã hủy đặt chỗ');
      onRefresh(); // API trả về state mới (hoặc không còn activeBooking nữa thì page sẽ đá ra)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Xác định text trạng thái
  let statusColor = 'text-gray-600 bg-gray-100';
  let statusText = 'Đang xử lý...';
  let StatusIcon = Clock;

  if (bookingStatus === 'PENDING') {
    statusColor = 'text-orange-700 bg-orange-100';
    statusText = 'Đang chờ tài xế xác nhận';
    StatusIcon = Clock;
  } else if (bookingStatus === 'CONFIRMED') {
    if (ride.status === 'SCHEDULED') {
      statusColor = 'text-[#0071e3] bg-blue-50';
      statusText = 'Tài xế đã nhận. Đang chờ khởi hành';
      StatusIcon = ShieldCheck;
    } else if (ride.status === 'ONGOING') {
      statusColor = 'text-[#34c759] bg-green-50';
      statusText = 'Tài xế đang di chuyển';
      StatusIcon = Car;
    }
  }

  return (
    <div className="w-full px-4 pb-6 pt-2">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Chi tiết chuyến đi</h2>
          <p className="text-sm text-gray-500">
            {ride.departureTime ? new Date(ride.departureTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Sắp đi'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">Giá tiền</p>
          <span className="text-lg font-bold text-[#0071e3]">{data.price?.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {/* Trạng thái nổi bật */}
      <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 border ${statusColor} bg-opacity-50`}>
        <StatusIcon className="w-5 h-5" />
        <span className="text-sm font-semibold">{statusText}</span>
      </div>

      {/* Thông tin tài xế */}
      {driver && (
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
                <span>• ★ {driver.driverRating ? driver.driverRating.toFixed(1) : 'Mới'}</span>
              </div>
            </div>
          </div>
          {bookingStatus === 'CONFIRMED' && (
            <a href={`tel:${driver.phone}`} className="p-3 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors">
              <Phone className="w-5 h-5" />
            </a>
          )}
        </div>
      )}

      {/* Lộ trình */}
      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl mb-6 border border-gray-100">
        <div className="flex flex-col items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <div className="w-0.5 h-6 bg-gray-300"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-gray-500">Điểm đón</p>
            <p className="text-sm font-medium text-gray-900 truncate">{ride.originAddress}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Điểm đến</p>
            <p className="text-sm font-medium text-gray-900 truncate">{ride.destinationAddress}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {(bookingStatus === 'PENDING' || (bookingStatus === 'CONFIRMED' && ride.status === 'SCHEDULED')) && (
          <Button 
            variant="outline" 
            className="w-full h-12 text-[15px] rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 border-gray-200"
            onClick={handleCancelBooking}
          >
            <XCircle className="w-5 h-5 mr-2" /> Hủy đặt chỗ
          </Button>
        )}
      </div>
    </div>
  );
}
