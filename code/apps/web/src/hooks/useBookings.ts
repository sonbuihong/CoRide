import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

export const useMyBookings = (role: 'passenger' | 'driver', page: number = 1) => {
  return useQuery({
    queryKey: ['bookings', role, page],
    queryFn: async () => {
      const { data } = await apiClient.get(`/bookings?role=${role}&page=${page}`);
      return data.data;
    },
  });
};

export const useBookingDetail = (id: string) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/bookings/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: { rideId: string; seats: number }) => {
      const { data } = await apiClient.post('/bookings', payload);
      return data.data;
    },
    onSuccess: () => {
      toast.success('Đặt chỗ thành công! Chờ tài xế xác nhận.');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['ride'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi đặt chỗ');
    },
  });
};

export const useConfirmBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(`/bookings/${id}/confirm`);
      return data.data;
    },
    onSuccess: (data) => {
      toast.success('Đã xác nhận đặt chỗ');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', data.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi xác nhận');
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, cancelReason }: { id: string; cancelReason?: string }) => {
      const { data } = await apiClient.patch(`/bookings/${id}/cancel`, { cancelReason });
      return data.data;
    },
    onSuccess: (data) => {
      toast.success('Đã huỷ đặt chỗ');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', data.id] });
      queryClient.invalidateQueries({ queryKey: ['ride'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi huỷ đặt chỗ');
    },
  });
};
