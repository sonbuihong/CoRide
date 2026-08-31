export const TRIP_STATUSES = [
  'PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS',
  'WAITING_PAYMENT', 'COMPLETED', 'NO_DRIVER', 'CANCELLED',
] as const;

export type TripStatus = (typeof TRIP_STATUSES)[number];
export type VehicleType = 'BIKE' | 'CAR';
export type PassengerPhase = 'searching' | 'driver' | 'riding' | 'payment' | 'completed' | 'ended';

export interface Coordinates { lat: number; lng: number }
export interface BookingLocation extends Coordinates { address: string }
export interface TripDriver {
  id: string; firstName: string; lastName: string; phone?: string | null;
  avatarUrl?: string | null; driverRating?: number | null;
  vehicle?: { licensePlate?: string | null; brand?: string | null; model?: string | null } | null;
}
export interface PassengerTrip {
  id: string; status: TripStatus; vehicleType: VehicleType;
  originAddress: string; originLat: number; originLng: number;
  destAddress: string; destLat: number; destLng: number;
  estimatedDistance: number; estimatedDuration: number; estimatedPrice: number;
  finalPrice?: number | null; paymentStatus?: string | null; createdAt?: string;
  completedAt?: string | null; cancelReason?: string | null; driver?: TripDriver | null;
  transactions?: Array<{ id: string; amount: number; status: string; createdAt: string }>;
}
export interface TripEstimate {
  vehicleType: VehicleType; estimatedDistance: number; estimatedDuration: number; estimatedPrice: number;
}
export interface BookingDraft {
  pickup: BookingLocation | null; destination: BookingLocation | null;
  vehicleType: VehicleType; step: 'places' | 'pickup' | 'estimate';
}

const STATUS_COPY: Record<TripStatus, { phase: PassengerPhase; title: string; description: string }> = {
  PENDING: { phase: 'searching', title: 'Đang gửi yêu cầu', description: 'CoRide đang kiểm tra các tài xế phù hợp gần điểm đón.' },
  MATCHING: { phase: 'searching', title: 'Đang tìm tài xế', description: 'Ưu tiên tài xế ở gần, đúng loại xe và có đánh giá tốt.' },
  ACCEPTED: { phase: 'driver', title: 'Đã tìm thấy tài xế', description: 'Tài xế đang chuẩn bị di chuyển tới điểm đón.' },
  ARRIVING: { phase: 'driver', title: 'Tài xế đang đến', description: 'Hãy đứng tại điểm đón và để ý điện thoại.' },
  ARRIVED: { phase: 'driver', title: 'Tài xế đã đến', description: 'Tài xế đang chờ bạn tại điểm đón.' },
  IN_PROGRESS: { phase: 'riding', title: 'Bạn đang trên đường', description: 'Theo dõi lộ trình còn lại và luôn thắt dây an toàn.' },
  WAITING_PAYMENT: { phase: 'payment', title: 'Thanh toán chuyến đi', description: 'Quét mã QR và xác nhận sau khi chuyển khoản.' },
  COMPLETED: { phase: 'completed', title: 'Chuyến đi đã hoàn thành', description: 'Cảm ơn bạn đã đồng hành cùng CoRide.' },
  NO_DRIVER: { phase: 'ended', title: 'Chưa tìm được tài xế', description: 'Hiện chưa có tài xế phù hợp. Bạn có thể thử đặt lại.' },
  CANCELLED: { phase: 'ended', title: 'Chuyến đi đã hủy', description: 'Yêu cầu này đã kết thúc và không còn tìm tài xế.' },
};

export const getPassengerStatus = (status: TripStatus) => STATUS_COPY[status];
export const canCancelTrip = (status: TripStatus) => ['PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED'].includes(status);
export const formatPrice = (value?: number | null) => value == null ? '—' : new Intl.NumberFormat('vi-VN').format(value) + 'đ';
export const formatEta = (seconds?: number | null) => {
  if (seconds == null) return '—';
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút` : `${minutes} phút`;
};
export const formatTripDistance = (meters?: number | null) => meters == null ? '—' : meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
