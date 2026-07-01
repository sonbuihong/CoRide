import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  User, Phone, MapPin, Navigation, CheckCircle, XCircle,
  Users as UsersIcon, Map, Loader2
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  passengerRating?: number | null;
  passengerRatingCount?: number | null;
}

interface Booking {
  id: string;
  seats: number;
  totalPrice?: number;
  price?: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  isPickedUp: boolean;
  passengerLat?: number | null;
  passengerLng?: number | null;
  pickupAddress?: string | null;
  passenger: Passenger;
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
  bookings?: Booking[];
}

interface DriverViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  onRefresh: () => void;
  isExpanded?: boolean;
  onExpand?: () => void;
}

// ─── State Machine Logic ────────────────────────────────────────────────────

/**
 * Xác định hành động chính Driver cần thực hiện tiếp theo.
 *
 * State machine (không thay đổi DB schema):
 * - SCHEDULED + có confirmed booking → nút "Đã đến vị trí đón khách"
 * - SCHEDULED + isPickedUp → nút "Bắt đầu chuyến" (thực ra chưa xảy ra với SCHEDULED)
 * - ONGOING → nút "Hoàn thành chuyến"
 *
 * Logic dùng isPickedUp để biết Driver đã đón khách hay chưa.
 * Tài xế chỉ được nhấn "Bắt đầu chuyến" (→ ONGOING) sau khi đã xác nhận đón ít nhất 1 khách.
 */
function getDriverPrimaryAction(ride: Ride): {
  label: string;
  variant: 'arrive' | 'start' | 'complete';
  apiCall: () => Promise<void>;
} | null {
  const confirmedBookings = ride.bookings?.filter(b => b.status === 'CONFIRMED') ?? [];
  const unpickedBookings = confirmedBookings.filter(b => !b.isPickedUp);
  const hasPickedUpSomeone = confirmedBookings.some(b => b.isPickedUp);

  if (ride.status === 'ONGOING') {
    // Chỉ khi ONGOING mới cho phép hoàn thành
    return {
      label: 'Hoàn thành chuyến',
      variant: 'complete',
      apiCall: async () => {
        await apiClient.patch(`/rides/${ride.id}/status`, { status: 'COMPLETED' });
      },
    };
  }

  if (ride.status === 'SCHEDULED') {
    // Nếu đã đón được ít nhất 1 khách và không còn khách chờ đón → cho phép bắt đầu chuyến
    if (hasPickedUpSomeone && unpickedBookings.length === 0) {
      return {
        label: 'Bắt đầu chuyến',
        variant: 'start',
        apiCall: async () => {
          await apiClient.patch(`/rides/${ride.id}/status`, { status: 'ONGOING' });
        },
      };
    }

    // Còn khách chưa đón → nút "Đã đến vị trí đón khách" không hiện ở đây
    // Nút đón khách hiện ở từng booking card bên dưới
    return null;
  }

  return null;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function DriverView({ data, onRefresh, isExpanded = true, onExpand }: DriverViewProps) {
  const ride: Ride = data.ride;

  // Loading state riêng cho từng action để tránh double-click
  const [loadingPrimary, setLoadingPrimary] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState<Record<string, boolean>>({});
  const [loadingPickup, setLoadingPickup] = useState<Record<string, boolean>>({});
  const [loadingCancel, setLoadingCancel] = useState(false);

  // ─── Handlers ────────────────────────────────────────────────────────

  const handlePrimaryAction = async () => {
    const action = getDriverPrimaryAction(ride);
    if (!action || loadingPrimary) return;

    setLoadingPrimary(true);
    try {
      await action.apiCall();
      const successText =
        action.variant === 'complete' ? 'Chuyến đi đã hoàn thành' :
        action.variant === 'start'    ? 'Đã bắt đầu chuyến đi' :
                                        'Đã cập nhật trạng thái chuyến đi';
      toast.success(successText);
      onRefresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    } finally {
      setLoadingPrimary(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'CONFIRMED' | 'REJECTED') => {
    if (loadingBooking[bookingId]) return;

    setLoadingBooking(prev => ({ ...prev, [bookingId]: true }));
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status: action });
      toast.success(action === 'CONFIRMED' ? 'Đã nhận khách' : 'Đã từ chối khách');
      onRefresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoadingBooking(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  /**
   * Xác nhận đã đến điểm đón và đón khách.
   * Sau khi đón đủ khách, tài xế mới được nhấn "Bắt đầu chuyến".
   */
  const handlePickupPassenger = async (bookingId: string) => {
    if (loadingPickup[bookingId]) return;

    setLoadingPickup(prev => ({ ...prev, [bookingId]: true }));
    try {
      await apiClient.patch(`/bookings/${bookingId}/pickup`);
      toast.success('Đã xác nhận đón khách');
      onRefresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoadingPickup(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleDropoffPassenger = async (bookingId: string) => {
    if (loadingPickup[bookingId]) return;

    setLoadingPickup(prev => ({ ...prev, [bookingId]: true }));
    try {
      await apiClient.patch(`/bookings/${bookingId}/dropoff`);
      toast.success('Đã hoàn thành hành trình của khách hàng');
      onRefresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoadingPickup(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleCancelRide = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy chuyến đi này? Hành động này không thể hoàn tác.')) return;
    if (loadingCancel) return;

    setLoadingCancel(true);
    try {
      await apiClient.patch(`/rides/${ride.id}/status`, {
        status: 'CANCELLED',
        cancelReason: 'Tài xế hủy chuyến',
      });
      toast.success('Chuyến đi đã bị hủy');
      onRefresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoadingCancel(false);
    }
  };

  // ─── Derived State ────────────────────────────────────────────────────

  const pendingBookings = ride.bookings?.filter(b => b.status === 'PENDING') || [];
  const confirmedBookings = ride.bookings?.filter(b =>
    b.status === 'CONFIRMED' || b.status === 'COMPLETED'
  ) || [];

  const primaryAction = getDriverPrimaryAction(ride);

  // Màu sắc badge trạng thái chuyến
  const statusBadge =
    ride.status === 'ONGOING'    ? { label: 'ĐANG CHẠY', className: 'bg-green-100 text-green-700' } :
    ride.status === 'SCHEDULED'  ? { label: 'ĐÃ LÊN LỊCH', className: 'bg-blue-100 text-blue-700' } :
    ride.status === 'COMPLETED'  ? { label: 'HOÀN THÀNH', className: 'bg-gray-100 text-gray-600' } :
    ride.status === 'CANCELLED'  ? { label: 'ĐÃ HỦY', className: 'bg-red-100 text-red-600' } :
    { label: ride.status, className: 'bg-gray-100 text-gray-600' };

  // Màu nút hành động chính theo từng bước
  const primaryButtonStyle =
    primaryAction?.variant === 'complete' ? 'bg-[#34c759] hover:bg-green-600' :
    primaryAction?.variant === 'start'    ? 'bg-[#0071e3] hover:bg-blue-600' :
                                            'bg-gray-400';

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="w-full px-4 pb-6 pt-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {ride.status === 'SCHEDULED' ? 'Chuyến đi sắp tới' : 'Đang di chuyển'}
          </h2>
          <p className="text-sm text-gray-500">
            {ride.status === 'SCHEDULED' ? 'Đang chờ khởi hành' : 'Chuyến đang diễn ra'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">Trạng thái</p>
          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Nút hành động chính — State machine UI đưa lên trên cùng để luôn nhìn thấy */}
      <div className="flex flex-col gap-2 mt-2 mb-4">
        {primaryAction && (
          <Button
            className={`w-full text-white h-12 text-[15px] rounded-xl font-semibold shadow-md ${primaryButtonStyle} disabled:opacity-60`}
            onClick={handlePrimaryAction}
            disabled={loadingPrimary}
          >
            {loadingPrimary ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : primaryAction.variant === 'complete' ? (
              <><CheckCircle className="w-5 h-5 mr-2" /> {primaryAction.label}</>
            ) : primaryAction.variant === 'start' ? (
              <><Navigation className="w-5 h-5 mr-2" /> {primaryAction.label}</>
            ) : (
              primaryAction.label
            )}
          </Button>
        )}

      </div>

      {/* Lộ trình (Chỉ hiện khi Expanded để nhường chỗ cho các nút thao tác ở chế độ thu gọn) */}
      {isExpanded && (
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
      )}

      {/* Badge tổng hành khách + yêu cầu mới */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 text-gray-600">
          <UsersIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Hành khách: {confirmedBookings.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {pendingBookings.length > 0 && (
            <span className="flex items-center gap-1 bg-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full animate-pulse">
              {pendingBookings.length} yêu cầu mới
            </span>
          )}
          {!isExpanded && (
            <button onClick={onExpand} className="text-xs text-blue-600 font-medium hover:underline">
              Xem chi tiết
            </button>
          )}
        </div>
      </div>

      {/* Yêu cầu PENDING — LUÔN HIỆN, không phụ thuộc isExpanded */}
      {pendingBookings.length > 0 && (
        <div className="mb-4 border border-orange-200 rounded-2xl overflow-hidden">
          <div className="bg-orange-500 px-4 py-2.5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Khách muốn đặt chỗ ({pendingBookings.length})</h3>
            <span className="text-[10px] text-orange-100 font-medium">Nhấn để phản hồi</span>
          </div>
          <div className="divide-y divide-orange-100 bg-orange-50">
            {pendingBookings.map(b => (
              <div key={b.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border border-orange-200 shrink-0">
                      {b.passenger.avatarUrl ? (
                        <img src={b.passenger.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{b.passenger.firstName} {b.passenger.lastName}</p>
                      <p className="text-xs text-gray-500">{b.seats} ghế • {(b.totalPrice ?? 0).toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                  {b.passenger.phone && (
                    <a href={`tel:${b.passenger.phone}`} className="p-2 bg-white text-blue-600 rounded-full border border-blue-100 hover:bg-blue-50 transition-colors shrink-0">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {b.pickupAddress && (
                  <div className="flex items-start gap-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-600 line-clamp-2">{b.pickupAddress}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-white border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 h-10 text-sm font-semibold rounded-xl"
                    onClick={() => handleBookingAction(b.id, 'REJECTED')}
                    disabled={loadingBooking[b.id]}
                  >
                    {loadingBooking[b.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1" /> Từ chối</>}
                  </Button>
                  <Button
                    className="flex-1 bg-[#34c759] hover:bg-green-600 text-white h-10 text-sm font-semibold rounded-xl shadow-sm"
                    onClick={() => handleBookingAction(b.id, 'CONFIRMED')}
                    disabled={loadingBooking[b.id]}
                  >
                    {loadingBooking[b.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" /> Chấp nhận</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danh sách hành khách đã nhận — Bỏ điều kiện isExpanded để luôn hiện nút Đón khách */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Hành khách đã nhận ({confirmedBookings.length})</h3>
          {confirmedBookings.length === 0 ? (
            <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">Chưa có hành khách nào.</p>
          ) : (
            <div className="space-y-2">
              {confirmedBookings.map(b => (
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{b.passenger.firstName} {b.passenger.lastName}</p>
                        {b.status === 'COMPLETED' ? (
                          <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-bold">ĐÃ TRẢ KHÁCH</span>
                        ) : b.isPickedUp ? (
                          <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold">ĐÃ ĐÓN</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500">{b.seats} chỗ • {((b.totalPrice ?? b.price) ?? 0).toLocaleString('vi-VN')}đ</p>
                      {b.pickupAddress && !b.isPickedUp && b.status !== 'COMPLETED' && (
                        <p className="text-[11px] text-orange-600 mt-0.5 line-clamp-1">{b.pickupAddress}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${b.passenger.phone}`} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors">
                      <Phone className="w-4 h-4" />
                    </a>
                    {/* Nút "Đã đến vị trí đón khách" — chỉ hiện khi CONFIRMED và chưa đón */}
                    {!b.isPickedUp && b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handlePickupPassenger(b.id)}
                        disabled={loadingPickup[b.id]}
                        className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
                        title="Xác nhận đã đến và đón khách"
                      >
                        {loadingPickup[b.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    )}
                    {/* Nút trả khách — chỉ khi đang ONGOING và đã đón */}
                    {b.isPickedUp && b.status === 'CONFIRMED' && ride.status === 'ONGOING' && (
                      <button
                        onClick={() => handleDropoffPassenger(b.id)}
                        disabled={loadingPickup[b.id]}
                        className="p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors disabled:opacity-50"
                        title="Kết thúc hành trình (Trả khách)"
                      >
                        {loadingPickup[b.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Đã chuyển Nút hành động chính lên trên cùng */}

      {/* Nút hủy chuyến */}
      {isExpanded && ride.status !== 'COMPLETED' && ride.status !== 'ONGOING' && (
        <div className="mt-8 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            className="w-full h-12 text-[15px] rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 border-gray-200 bg-white disabled:opacity-60"
            onClick={handleCancelRide}
            disabled={loadingCancel}
          >
            {loadingCancel ? <Loader2 className="w-5 h-5 animate-spin" /> : <><XCircle className="w-5 h-5 mr-2" /> Hủy chuyến</>}
          </Button>
        </div>
      )}
    </div>
  );
}
