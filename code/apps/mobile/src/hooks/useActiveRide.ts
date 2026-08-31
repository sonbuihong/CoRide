// Hook kiểm tra có booking/ride đang active không
// Dùng trong tab "Chuyến đi" để tự chuyển giao diện

import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';
import { getRealtimeRefetchInterval, useSocketConnection } from './useSocketConnection';

/**
 * Query booking đang active cho user hiện tại.
 * Backend tự detect vai trò (driver/passenger) và trả kết quả phù hợp.
 *
 * Return:
 * - activeBooking: data nếu có chuyến đang active
 * - userRole: 'DRIVER' | 'PASSENGER'
 * - isLoading, refetch, etc.
 *
 * Socket cập nhật realtime; polling 30 giây chỉ dùng khi socket mất kết nối.
 */
export const useActiveRide = () => {
  const isSocketConnected = useSocketConnection();
  const query = useQuery({
    queryKey: ['active-booking'],
    queryFn: () => bookingService.getActiveBooking(),
    // Poll slowly only while realtime updates are unavailable.
    refetchInterval: getRealtimeRefetchInterval(isSocketConnected),
    // Không retry quá nhiều nếu lỗi mạng
    retry: 2,
  });

  return {
    activeBooking: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
};
