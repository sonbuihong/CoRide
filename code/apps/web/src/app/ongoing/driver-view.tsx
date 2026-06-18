import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Phone, MapPin, Navigation, CheckCircle, XCircle, Users as UsersIcon, Map } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DriverView({ data, onRefresh, isExpanded = true, onExpand }: { data: any, onRefresh: () => void, isExpanded?: boolean, onExpand?: () => void }) {
  const ride = data.ride;
  
  const handleUpdateStatus = async (status: string) => {
    try {
      await apiClient.patch(`/rides/${ride.id}/status`, { status });
      toast.success(status === 'COMPLETED' ? 'Chuyến đi đã hoàn thành' : 'Đã cập nhật trạng thái chuyến đi');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleCancelRide = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy chuyến đi này? Hành động này không thể hoàn tác.')) return;
    try {
      await apiClient.patch(`/rides/${ride.id}/status`, { status: 'CANCELLED' });
      toast.success('Chuyến đi đã bị hủy');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const pendingBookings = ride.bookings?.filter((b: any) => b.status === 'PENDING') || [];
  const confirmedBookings = ride.bookings?.filter((b: any) => b.status === 'CONFIRMED') || [];
  
  const handleBookingAction = async (bookingId: string, action: 'CONFIRMED' | 'REJECTED') => {
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status: action });
      toast.success(action === 'CONFIRMED' ? 'Đã nhận khách' : 'Đã từ chối khách');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="w-full px-4 pb-6 pt-2">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {ride.status === 'SCHEDULED' ? 'Chuyến đi sắp tới' : 'Đang di chuyển'}
          </h2>
          <p className="text-sm text-gray-500">Bấm Bắt đầu khi bạn khởi hành</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">Trạng thái</p>
          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${ride.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
            {ride.status === 'ONGOING' ? 'ĐANG CHẠY' : 'ĐÃ LÊN LỊCH'}
          </span>
        </div>
      </div>

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

      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 text-gray-600">
          <UsersIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Hành khách: {confirmedBookings.length}</span>
        </div>
        {!isExpanded && (
          <button onClick={onExpand} className="text-xs text-blue-600 font-medium hover:underline">
            Xem chi tiết
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Hành khách đã nhận ({confirmedBookings.length})</h3>
        {confirmedBookings.length === 0 ? (
          <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">Chưa có hành khách nào.</p>
        ) : (
          <div className="space-y-2">
            {confirmedBookings.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {b.passenger.avatarUrl ? (
                      <img src={b.passenger.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.passenger.firstName} {b.passenger.lastName}</p>
                    <p className="text-xs text-gray-500">{b.seats} chỗ • {b.price.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
                <a href={`tel:${b.passenger.phone}`} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingBookings.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-orange-600 mb-2">Yêu cầu mới ({pendingBookings.length})</h3>
          <div className="space-y-2">
            {pendingBookings.map((b: any) => (
              <div key={b.id} className="p-3 rounded-xl border border-orange-200 bg-orange-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-8 h-8 text-gray-400 bg-white p-1 rounded-full border border-gray-200" />
                    <div>
                      <p className="text-sm font-medium">{b.passenger.firstName} {b.passenger.lastName}</p>
                      <p className="text-xs text-gray-600">{b.seats} chỗ</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#0071e3]">{b.price.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-white" onClick={() => handleBookingAction(b.id, 'REJECTED')}>
                    Từ chối
                  </Button>
                  <Button className="flex-1 bg-[#34c759] hover:bg-green-600 text-white" onClick={() => handleBookingAction(b.id, 'CONFIRMED')}>
                    Chấp nhận
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}

      <div className="flex flex-col gap-2 mt-4 mb-2">
        {ride.status === 'SCHEDULED' && (
          <Button 
            className="w-full bg-[#0071e3] hover:bg-blue-600 text-white h-12 text-[15px] rounded-xl font-semibold shadow-md"
            onClick={() => handleUpdateStatus('ONGOING')}
          >
            <Navigation className="w-5 h-5 mr-2" /> Bắt đầu chuyến đi
          </Button>
        )}
        
        {ride.status === 'ONGOING' && (
          <Button 
            className="w-full bg-[#34c759] hover:bg-green-600 text-white h-12 text-[15px] rounded-xl font-semibold shadow-md"
            onClick={() => handleUpdateStatus('COMPLETED')}
          >
            <CheckCircle className="w-5 h-5 mr-2" /> Hoàn thành chuyến đi
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-8 pt-4 border-t border-gray-100">
          <Button 
            variant="outline" 
            className="w-full h-12 text-[15px] rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 border-gray-200 bg-white"
            onClick={handleCancelRide}
          >
            <XCircle className="w-5 h-5 mr-2" /> Hủy chuyến
          </Button>
        </div>
      )}
    </div>
  );
}
