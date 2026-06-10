// Hook kiểm tra có booking/ride đang active không
// Dùng trong tab "Chuyến đi" để tự chuyển giao diện

import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../services/booking.service';

/**
 * Query booking đang active cho user hiện tại.
 * Backend tự detect vai trò (driver/passenger) và trả kết quả phù hợp.
 *
 * Return:
 * - activeBooking: data nếu có chuyến đang active
 * - userRole: 'DRIVER' | 'PASSENGER'
 * - isLoading, refetch, etc.
 *
 * Tự refetch mỗi 10 giây để catch trường hợp driver accept booking.
 */
export const useActiveRide = () => {
  const query = useQuery({
    queryKey: ['active-booking'],
    queryFn: () => bookingService.getActiveBooking(),
    // Refetch mỗi 10s để cập nhật trạng thái (driver accept, ride status change)
    refetchInterval: 10000,
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
