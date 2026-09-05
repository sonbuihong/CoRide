import type { ActivityAction, ActivityItem, ActivityRole, ActivitySegment } from './activity.types';

export const SEGMENT_LABELS: Record<ActivitySegment, string> = {
  ACTIVE: 'Đang chạy',
  UPCOMING: 'Sắp tới',
  COMPLETED: 'Đã xong',
  CANCELLED: 'Đã hủy',
};

export const SEGMENT_ACCESSIBILITY_LABELS: Record<ActivitySegment, string> = {
  ACTIVE: 'Đang hoạt động',
  UPCOMING: 'Sắp tới',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang chờ xác nhận',
  MATCHING: 'Đang tìm tài xế',
  CONFIRMED: 'Đã xác nhận',
  ACCEPTED: 'Đã ghép tài xế',
  ARRIVING: 'Tài xế đang đến',
  ARRIVED: 'Tài xế đã đến',
  SCHEDULED: 'Đã lên lịch',
  FULL: 'Đã đủ chỗ',
  ONGOING: 'Đang di chuyển',
  IN_PROGRESS: 'Đang di chuyển',
  WAITING_PAYMENT: 'Chờ thanh toán',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Đã hết hạn',
  NO_DRIVER: 'Không tìm thấy tài xế',
};

const VI_DATE = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
const VI_MONTH = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });

export function formatActivityDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : VI_DATE.format(date).replace(',', ' ·');
}

export function formatActivityMonth(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Thời gian khác';
  const text = VI_MONTH.format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatActivityPrice(value: number | null): string | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${Math.round(value).toLocaleString('vi-VN')}đ`
    : null;
}

export function departureCountdown(value: string | null, now = new Date()): string | null {
  if (!value) return null;
  const milliseconds = new Date(value).getTime() - now.getTime();
  if (!Number.isFinite(milliseconds) || milliseconds <= 0 || milliseconds >= 60 * 60 * 1000) return null;
  const minutes = Math.max(1, Math.ceil(milliseconds / 60_000));
  return `Khởi hành sau ${minutes} phút`;
}

export function segmentCountLabel(count: number, segment: ActivitySegment): string {
  const phrases: Record<ActivitySegment, string> = {
    ACTIVE: 'đang hoạt động',
    UPCOMING: 'sắp tới',
    COMPLETED: 'đã hoàn thành',
    CANCELLED: 'đã hủy',
  };
  return `${count.toLocaleString('vi-VN')} chuyến ${phrases[segment]}`;
}

export function activityKindLabel(source: ActivityItem['source']): string {
  return source === 'RIDE_HAILING' ? 'Đặt xe' : 'Đi chung xe';
}

export function getActivityActions(item: ActivityItem, role: ActivityRole): ActivityAction[] {
  if (role === 'PASSENGER') {
    const primary = item.source === 'RIDE_HAILING'
      ? item.segment === 'ACTIVE'
        ? { label: 'Xem chuyến', route: '/(passenger-tabs)/ride-hailing', kind: 'primary' as const }
        : { label: 'Xem chi tiết', route: `/trip/${item.tripId}`, kind: 'primary' as const }
      : item.segment === 'ACTIVE' && item.bookingId
        ? { label: 'Xem chuyến', route: `/booking/${item.bookingId}`, kind: 'primary' as const }
        : { label: 'Xem chi tiết', route: `/booking/${item.bookingId}`, kind: 'primary' as const };
    const actions: ActivityAction[] = [primary];
    if (item.segment === 'ACTIVE' && item.chatRideId && item.relatedUser) {
      actions.push({
        label: 'Nhắn tin',
        route: `/chat/${item.chatRideId}`,
        kind: 'secondary',
        params: { otherUserId: item.relatedUser.id, otherUserName: item.relatedUser.name },
      });
    }
    return actions;
  }

  if (item.source === 'RIDE_HAILING') {
    return [{
      label: item.segment === 'ACTIVE' ? 'Điều hướng' : 'Xem chi tiết',
      route: item.segment === 'ACTIVE' ? '/driver/active-trip' : `/trip/${item.tripId}`,
      kind: 'primary',
    }];
  }
  const actions: ActivityAction[] = [{
    label: item.segment === 'ACTIVE' ? 'Quản lý chuyến' : 'Xem chuyến',
    route: item.segment === 'ACTIVE' ? '/ride/active-ride' : `/driver/trips/${item.rideId}`,
    kind: 'primary',
  }];
  if (item.segment === 'ACTIVE' && item.chatRideId && item.nextPassenger) {
    actions.push({
      label: 'Nhắn hành khách',
      route: `/chat/${item.chatRideId}`,
      kind: 'secondary',
      params: { otherUserId: item.nextPassenger.id, otherUserName: item.nextPassenger.name },
    });
  }
  return actions;
}

export function emptyStateCopy(role: ActivityRole, segment: ActivitySegment) {
  const passenger: Record<ActivitySegment, { title: string; description: string }> = {
    ACTIVE: { title: 'Chưa có chuyến đang hoạt động', description: 'Khi bạn gửi yêu cầu hoặc bắt đầu hành trình, chuyến đi sẽ xuất hiện tại đây.' },
    UPCOMING: { title: 'Chưa có chuyến sắp tới', description: 'Tìm một chuyến đi chung phù hợp để lên lịch cho hành trình tiếp theo.' },
    COMPLETED: { title: 'Chưa có chuyến hoàn thành', description: 'Những hành trình đã kết thúc sẽ được lưu lại tại đây.' },
    CANCELLED: { title: 'Chưa có chuyến bị hủy', description: 'Các chuyến bị hủy hoặc hết hạn sẽ xuất hiện tại đây.' },
  };
  const driver: Record<ActivitySegment, { title: string; description: string }> = {
    ACTIVE: { title: 'Chưa có chuyến đang hoạt động', description: 'Chuyến đang chạy hoặc cuốc xe bạn đã nhận sẽ xuất hiện tại đây.' },
    UPCOMING: { title: 'Chưa có chuyến sắp tới', description: 'Đăng chuyến mới để hành khách có thể tìm và đặt chỗ.' },
    COMPLETED: { title: 'Chưa có chuyến hoàn thành', description: 'Những chuyến bạn đã phục vụ sẽ được lưu lại tại đây.' },
    CANCELLED: { title: 'Chưa có chuyến bị hủy', description: 'Các chuyến đã hủy sẽ xuất hiện tại đây cùng lý do nếu có.' },
  };
  return role === 'PASSENGER' ? passenger[segment] : driver[segment];
}
