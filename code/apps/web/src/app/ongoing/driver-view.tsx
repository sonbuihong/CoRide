import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Phone, MapPin, Navigation, CheckCircle, XCircle, Users as UsersIcon, Map, Loader2, MessageSquare, MoreHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  vehicleType?: string;
  bookings?: Booking[];
}

interface DriverViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  onRefresh: () => void;
  isExpanded?: boolean;
  onExpand?: () => void;
  activeOrder?: string[];
  onReorder?: (newOrder: string[]) => void;
}

// ─── State Machine Logic ────────────────────────────────────────────────────

function getDriverPrimaryAction(ride: Ride): {
  label: string;
  variant: 'arrive' | 'start' | 'complete';
  apiCall: () => Promise<void>;
} | null {
  const confirmedBookings = ride.bookings?.filter(b => b.status === 'CONFIRMED') ?? [];
  const unpickedBookings = confirmedBookings.filter(b => !b.isPickedUp);
  const hasPickedUpSomeone = confirmedBookings.some(b => b.isPickedUp);

  if (ride.status === 'ONGOING') {
    return {
      label: 'Hoàn thành chuyến',
      variant: 'complete',
      apiCall: async () => {
        await apiClient.patch(`/rides/${ride.id}/status`, { status: 'COMPLETED' });
      },
    };
  }

  if (ride.status === 'SCHEDULED') {
    if (hasPickedUpSomeone && unpickedBookings.length === 0) {
      return {
        label: 'Bắt đầu chuyến',
        variant: 'start',
        apiCall: async () => {
          await apiClient.patch(`/rides/${ride.id}/status`, { status: 'ONGOING' });
        },
      };
    }
    return null;
  }

  return null;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function DriverView({ data, onRefresh, isExpanded = true, onExpand, activeOrder, onReorder }: DriverViewProps) {
  const ride: Ride = data.ride;

  const [loadingPrimary, setLoadingPrimary] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState<Record<string, boolean>>({});
  const [loadingPickup, setLoadingPickup] = useState<Record<string, boolean>>({});
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailIndex, setDetailIndex] = useState(0);

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

  // Determine next booking to focus on (strictly confirmed/active bookings)
  const nextBookingToFocus = 
    (activeOrder ? confirmedBookings.sort((a, b) => activeOrder.indexOf(a.id) - activeOrder.indexOf(b.id)) : confirmedBookings)
      .find(b => !b.isPickedUp && b.status === 'CONFIRMED') 
    || confirmedBookings.find(b => b.isPickedUp && b.status === 'CONFIRMED' && ride.status === 'ONGOING');

  let unpickedBookingsList = ride.bookings?.filter(b => 
    (b.status === 'CONFIRMED' || b.status === 'PENDING') && !b.isPickedUp && b.passengerLat && b.passengerLng
  ) || [];
  
  if (activeOrder && activeOrder.length > 0) {
    unpickedBookingsList = [...unpickedBookingsList].sort((a, b) => {
      const idxA = activeOrder.indexOf(a.id);
      const idxB = activeOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }
  
  const waypointsParam = unpickedBookingsList.length > 0
    ? `&waypoints=${unpickedBookingsList.map(b => `${b.passengerLat},${b.passengerLng}`).join('|')}`
    : '';

  const mapLink = `https://www.google.com/maps/dir/?api=1&destination=${ride.destinationLat},${ride.destinationLng}${waypointsParam}&travelmode=driving`;

  const nextDestinationName = nextBookingToFocus && !nextBookingToFocus.isPickedUp
    ? nextBookingToFocus.pickupAddress
    : ride.destination;

  let mainButton: { label: string; action: () => void; loading: boolean; variant: 'default' | 'pickup' | 'dropoff' } | null = null;

  if (nextBookingToFocus && !nextBookingToFocus.isPickedUp && nextBookingToFocus.status === 'CONFIRMED') {
     mainButton = {
       label: 'Đã đến điểm đón',
       action: () => handlePickupPassenger(nextBookingToFocus.id),
       loading: loadingPickup[nextBookingToFocus.id] || false,
       variant: 'pickup'
     };
  } else if (nextBookingToFocus && nextBookingToFocus.isPickedUp && nextBookingToFocus.status === 'CONFIRMED' && ride.status === 'ONGOING') {
     mainButton = {
       label: 'Trả khách',
       action: () => handleDropoffPassenger(nextBookingToFocus.id),
       loading: loadingPickup[nextBookingToFocus.id] || false,
       variant: 'dropoff'
     };
  } else if (primaryAction) {
     mainButton = {
       label: primaryAction.label,
       action: handlePrimaryAction,
       loading: loadingPrimary,
       variant: 'default'
     };
  }

  // Header status text
  let headerStatusColor = 'text-gray-600';
  let headerStatusText = 'Đang xử lý';

  if (ride.status === 'SCHEDULED') {
    if (nextBookingToFocus && !nextBookingToFocus.isPickedUp) {
       headerStatusText = `${confirmedBookings.length} • Đón khách`;
       headerStatusColor = 'text-green-600';
    } else {
       headerStatusText = 'Đã lên lịch';
       headerStatusColor = 'text-primary';
    }
  } else if (ride.status === 'ONGOING') {
    if (nextBookingToFocus && nextBookingToFocus.isPickedUp) {
       headerStatusText = 'Trả khách';
       headerStatusColor = 'text-orange-600';
    } else if (nextBookingToFocus && !nextBookingToFocus.isPickedUp) {
       headerStatusText = 'Đón khách';
       headerStatusColor = 'text-green-600';
    } else {
       headerStatusText = 'Về đích';
       headerStatusColor = 'text-primary';
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col bg-background">
      {/* Header - Grab/Be Style */}
      <div className="flex items-center justify-between pb-2 pt-1 px-3 border-b border-border shrink-0">
        <button className="flex flex-col items-center gap-0.5 w-12" onClick={onExpand}>
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-[13px] font-bold text-gray-700">
              {unpickedBookingsList.length > 0 ? unpickedBookingsList.length : '1'}
            </span>
          </div>
          <span className="text-[9px] text-gray-500 font-medium">Địa điểm</span>
        </button>

        <div className="flex flex-col items-center flex-1 text-center px-1">
          <span className={`text-[14px] font-bold ${headerStatusColor}`}>{headerStatusText}</span>
          <span className="text-[11px] text-gray-500 font-medium">
            {ride.vehicleType === 'CAR' ? 'CoRide Car' : 'CoRide Bike'}
          </span>
        </div>

        <a href={mapLink} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-0.5 w-12">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-sm">
            <Navigation className="w-3.5 h-3.5 text-white" fill="currentColor" />
          </div>
          <span className="text-[9px] text-gray-500 font-medium">Điều hướng</span>
        </a>
      </div>

      {/* Sticky Info & Actions */}
      <div className="px-3 pt-3 shrink-0 bg-background z-10">
        {nextBookingToFocus ? (
          <div className="flex flex-col space-y-2.5">
            {/* Điểm đón */}
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 relative shrink-0">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-foreground leading-tight line-clamp-2">
                  {nextDestinationName}
                </p>
              </div>
            </div>

            {/* Thông tin khách hàng & Điểm đến */}
            <div className="flex items-start gap-2.5 mt-0.5">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0 border border-border">
                {nextBookingToFocus.passenger.avatarUrl ? (
                  <img src={nextBookingToFocus.passenger.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-bold text-foreground">
                    {nextBookingToFocus.passenger.firstName} {nextBookingToFocus.passenger.lastName}
                  </span>
                  <span className="bg-[#34c759] text-white text-[9px] px-1 py-0.5 rounded font-semibold">
                    Tiền mặt
                  </span>
                  <span className="text-[14px] font-bold text-foreground ml-auto">
                    {((nextBookingToFocus.totalPrice ?? nextBookingToFocus.price) ?? 0).toLocaleString('vi-VN')}đ
                  </span>
                </div>
                {ride.destination && (
                  <p className="text-[12px] text-gray-500 leading-tight mt-0.5 line-clamp-1">
                    Về: {ride.destination}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 relative shrink-0">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-foreground leading-tight line-clamp-2">
                  {ride.destination}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">Điểm đến cuối cùng</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        {nextBookingToFocus && (
          <div className="flex items-center justify-between py-1.5 border-y border-border mt-3">
            <a href={nextBookingToFocus.passenger.phone ? `tel:${nextBookingToFocus.passenger.phone}` : '#'} className="flex flex-col items-center gap-0.5 flex-1 hover:bg-gray-50 py-1 border-r border-border">
              <Phone className="w-4 h-4 text-gray-700" fill="currentColor" />
              <span className="text-[10px] text-gray-700 font-semibold">Gọi</span>
            </a>
            <button className="flex flex-col items-center gap-0.5 flex-1 hover:bg-gray-50 py-1 border-r border-border">
              <MessageSquare className="w-4 h-4 text-gray-700" fill="currentColor" />
              <span className="text-[10px] text-gray-700 font-semibold">Nhắn tin</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 flex-1 hover:bg-gray-50 py-1" onClick={() => {
              const idx = nextBookingToFocus ? confirmedBookings.findIndex(b => b.id === nextBookingToFocus.id) : 0;
              setDetailIndex(idx >= 0 ? idx : 0);
              setShowDetails(true);
            }}>
              <MoreHorizontal className="w-4 h-4 text-gray-700" />
              <span className="text-[10px] text-gray-700 font-semibold">Chi tiết</span>
            </button>
          </div>
        )}

        {/* Main Action Button - Gắn liền dưới Action Bar */}
        {mainButton && (
          <div className="py-2.5">
            <Button
              className="w-full h-[44px] text-[15px] rounded-full font-semibold shadow-sm bg-primary hover:brightness-110 text-primary-foreground transition-all active:scale-[0.98]"
              onClick={mainButton.action}
              disabled={mainButton.loading}
            >
              {mainButton.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mainButton.label}
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {(pendingBookings.length > 0 || (isExpanded && confirmedBookings.length > 1) || (isExpanded && ride.status !== 'COMPLETED' && ride.status !== 'ONGOING')) && (
        <div className="pt-2 pb-4 px-4 flex-1 overflow-y-auto">

          {/* Yêu cầu PENDING */}
          {pendingBookings.length > 0 && (
            <div className="mb-3 border border-orange-200 rounded-xl overflow-hidden mt-1">
              <div className="bg-orange-500 px-3 py-1.5 flex items-center justify-between">
                <h3 className="text-[12px] font-bold text-white">Yêu cầu đặt chỗ ({pendingBookings.length})</h3>
              </div>
              <div className="divide-y divide-orange-100 bg-orange-50">
                {pendingBookings.map(b => (
                  <div key={b.id} className="p-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center overflow-hidden border border-orange-200 shrink-0">
                          {b.passenger.avatarUrl ? (
                            <img src={b.passenger.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">{b.passenger.firstName} {b.passenger.lastName}</p>
                          <p className="text-[11px] text-gray-500">{b.seats} ghế • {(b.totalPrice ?? 0).toLocaleString('vi-VN')}đ</p>
                        </div>
                      </div>
                    </div>
                    {b.pickupAddress && (
                      <div className="flex items-start gap-1.5 mb-2.5">
                        <MapPin className="w-3 h-3 text-orange-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-gray-600 line-clamp-2 leading-tight">{b.pickupAddress}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 bg-background border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 h-[36px] text-[12px] font-semibold rounded-lg"
                        onClick={() => handleBookingAction(b.id, 'REJECTED')}
                        disabled={loadingBooking[b.id]}
                      >
                        {loadingBooking[b.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><XCircle className="w-3.5 h-3.5 mr-1" /> Từ chối</>}
                      </Button>
                      <Button
                        className="flex-1 bg-[#34c759] hover:bg-green-600 text-white h-[36px] text-[12px] font-semibold rounded-lg shadow-sm"
                        onClick={() => handleBookingAction(b.id, 'CONFIRMED')}
                        disabled={loadingBooking[b.id]}
                      >
                        {loadingBooking[b.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Chấp nhận</>}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danh sách hành khách đã nhận (nếu xem chi tiết) */}
          {isExpanded && confirmedBookings.length > 1 && (
            <div className="mb-3 mt-1">
              <h3 className="text-[13px] font-semibold text-foreground mb-1.5">Hành khách khác ({confirmedBookings.length - 1})</h3>
              <div className="space-y-1.5">
                {confirmedBookings.filter(b => b.id !== nextBookingToFocus?.id).map(b => (
                  <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {b.passenger.avatarUrl ? (
                          <img src={b.passenger.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-medium text-foreground">{b.passenger.firstName} {b.passenger.lastName}</p>
                          {b.status === 'COMPLETED' ? (
                            <span className="bg-gray-100 text-gray-600 text-[9px] px-1 py-0.5 rounded font-bold">ĐÃ TRẢ KHÁCH</span>
                          ) : b.isPickedUp ? (
                            <span className="bg-green-100 text-green-700 text-[9px] px-1 py-0.5 rounded font-bold">ĐÃ ĐÓN</span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-gray-500">{b.seats} chỗ • {((b.totalPrice ?? b.price) ?? 0).toLocaleString('vi-VN')}đ</p>
                        {b.pickupAddress && !b.isPickedUp && b.status !== 'COMPLETED' && (
                          <p className="text-[10px] text-orange-600 mt-0.5 line-clamp-1">{b.pickupAddress}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nút hủy chuyến */}
          {isExpanded && ride.status !== 'COMPLETED' && ride.status !== 'ONGOING' && (
            <div className="mt-4 pt-3 border-t border-border">
              <Button
                variant="outline"
                className="w-full h-[40px] text-[14px] rounded-full font-semibold text-destructive hover:bg-destructive/10 border border-border bg-background disabled:opacity-60 transition-all active:scale-[0.98]"
                onClick={handleCancelRide}
                disabled={loadingCancel}
              >
                {loadingCancel ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" /> Hủy chuyến</>}
              </Button>
            </div>
          )}
        </div>
      )}


      {/* Ride Details Modal */}
      {showDetails && (
        <div className="fixed top-[48px] bottom-0 left-0 right-0 z-[9999] bg-secondary flex flex-col animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-background px-4 py-3 flex items-center justify-between shrink-0">
            <button onClick={() => setShowDetails(false)} className="p-1 -ml-1">
              <X className="w-6 h-6 text-foreground" />
            </button>
            <h2 className="text-[17px] font-semibold text-foreground">Chi tiết chuyến xe</h2>
            <button className="text-primary text-[15px] font-medium">Hỗ trợ</button>
          </div>

          {confirmedBookings.length > 1 && (
            <div className="bg-background px-4 py-2 border-t border-border flex items-center justify-between shrink-0 shadow-sm">
              <button 
                onClick={() => setDetailIndex(i => Math.max(0, i - 1))} 
                disabled={detailIndex === 0} 
                className="flex items-center text-primary font-medium text-[14px] disabled:opacity-40"
              >
                <ChevronLeft className="w-5 h-5 mr-0.5" /> Khách trước
              </button>
              <span className="text-[13px] font-medium text-gray-500">
                {detailIndex + 1} / {confirmedBookings.length}
              </span>
              <button 
                onClick={() => setDetailIndex(i => Math.min(confirmedBookings.length - 1, i + 1))} 
                disabled={detailIndex === confirmedBookings.length - 1} 
                className="flex items-center text-primary font-medium text-[14px] disabled:opacity-40"
              >
                Khách sau <ChevronRight className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {/* Mã chuyến xe */}
            <div className="px-4 py-3 text-[13px] text-gray-500">
              Mã chuyến xe: {ride.id.toUpperCase()}
            </div>

            {/* Điểm đón khách */}
            <div className="bg-background px-4 py-4 mb-2">
              <h3 className="text-[17px] font-bold text-foreground mb-4">Điểm đón khách</h3>
              <div className="flex gap-3 mb-5">
                <div className="mt-0.5 shrink-0">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  </div>
                </div>
                <div>
                  <p className="text-[15px] text-foreground font-medium">{(confirmedBookings[detailIndex] || nextBookingToFocus)?.pickupAddress || ride.origin}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border border-border">
                    {(confirmedBookings[detailIndex] || nextBookingToFocus)?.passenger.avatarUrl ? (
                      <img src={(confirmedBookings[detailIndex] || nextBookingToFocus)?.passenger.avatarUrl ?? undefined} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[12px] text-gray-500">Khách đặt xe</p>
                  <p className="text-[15px] font-bold text-foreground">{(confirmedBookings[detailIndex] || nextBookingToFocus)?.passenger.firstName} {(confirmedBookings[detailIndex] || nextBookingToFocus)?.passenger.lastName}</p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between py-2 mt-4 border border-border rounded-xl overflow-hidden">
                <button className="flex flex-col items-center gap-1 flex-1 py-2 border-r border-border hover:bg-gray-50">
                  <Phone className="w-6 h-6 text-gray-700" fill="currentColor" />
                  <span className="text-[12px] text-gray-700 font-medium">Gọi miễn phí</span>
                </button>
                <a href={(confirmedBookings[detailIndex] || nextBookingToFocus)?.passenger.phone ? `tel:${(confirmedBookings[detailIndex] || nextBookingToFocus)?.passenger.phone}` : '#'} className="flex flex-col items-center gap-1 flex-1 py-2 border-r border-border hover:bg-gray-50">
                  <Phone className="w-6 h-6 text-gray-700" fill="currentColor" />
                  <span className="text-[12px] text-gray-700 font-medium">Gọi</span>
                </a>
                <button className="flex flex-col items-center gap-1 flex-1 py-2 hover:bg-gray-50">
                  <MessageSquare className="w-6 h-6 text-gray-700" fill="currentColor" />
                  <span className="text-[12px] text-gray-700 font-medium">Nhắn tin</span>
                </button>
              </div>
            </div>

            {/* Điểm trả khách */}
            <div className="bg-background px-4 py-4 mb-2">
              <h3 className="text-[17px] font-bold text-foreground mb-4">Điểm trả khách</h3>
              <div className="flex gap-3 mb-6">
                <div className="mt-0.5 shrink-0">
                  <MapPin className="text-red-500 w-5 h-5" fill="currentColor" />
                </div>
                <div>
                  <p className="text-[15px] text-foreground font-medium">{ride.destination}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-[15px] text-foreground">Thanh toán</span>
                <span className="bg-[#34c759] text-white text-[12px] font-bold px-2 py-0.5 rounded">Tiền mặt</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-foreground">Thu tiền mặt</span>
                <span className="text-[15px] font-bold text-foreground">{(((confirmedBookings[detailIndex] || nextBookingToFocus)?.totalPrice ?? (confirmedBookings[detailIndex] || nextBookingToFocus)?.price) ?? 0).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Chi tiết */}
            <div className="bg-background px-4 py-4 mb-2">
              <h3 className="text-[17px] font-bold text-foreground mb-4">Chi tiết</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[15px] text-gray-500">Dự kiến</span>
                  <span className="text-[15px] text-foreground">-- phút</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[15px] text-gray-500">Quãng đường</span>
                  <span className="text-[15px] text-foreground">-- KM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[15px] text-gray-500">Dịch vụ</span>
                  <span className="text-[15px] text-foreground">CoRide Bike</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[15px] text-gray-500">Điểm thưởng</span>
                  <span className="text-[15px] text-foreground">+3 điểm</span>
                </div>
              </div>
            </div>

            {/* Hủy chuyến */}
            <div className="px-4 py-4 pb-8">
              <button onClick={() => {
                 setShowDetails(false);
                 handleCancelRide();
              }} className="w-full text-center text-[15px] font-bold text-foreground py-4 hover:bg-gray-100 rounded-xl transition-colors">
                Huỷ chuyến
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
