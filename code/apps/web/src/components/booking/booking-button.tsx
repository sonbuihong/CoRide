'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BookingButtonProps {
  rideId: string;
  availableSeats: number;
  driverId: string;
  currentUserId?: string;
}

export const BookingButton = ({ rideId, availableSeats, driverId, currentUserId }: BookingButtonProps) => {
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [checkingActive, setCheckingActive] = useState(false);
  const router = useRouter();

  const isDriver = currentUserId === driverId;

  useEffect(() => {
    if (!currentUserId) return;

    const checkActiveBooking = async () => {
      try {
        setCheckingActive(true);
        const res = await apiClient.get('/bookings/my');
        const bookings = res.data.data || res.data || [];
        
        // Tìm đặt chỗ được xác nhận (CONFIRMED) của chuyến đi chưa hoàn thành (SCHEDULED hoặc ONGOING)
        const active = bookings.find((b: any) => 
          b.status === 'CONFIRMED' && 
          (b.ride.status === 'SCHEDULED' || b.ride.status === 'ONGOING')
        );
        
        if (active) {
          setHasActiveBooking(true);
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra đặt chỗ đang hoạt động:', err);
      } finally {
        setCheckingActive(false);
      }
    };

    checkActiveBooking();
  }, [currentUserId]);

  const handleBooking = async () => {
    if (seats < 1 || seats > availableSeats) {
      toast.error(`Số ghế không hợp lệ. Vui lòng chọn từ 1 đến ${availableSeats} ghế.`);
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/bookings', {
        rideId,
        seats,
      });
      toast.success('Đặt chỗ thành công! Đang chờ tài xế duyệt yêu cầu của bạn.');
      setOpen(false);
      router.push('/my-bookings');
    } catch (error: unknown) {
      console.error('Lỗi đặt chỗ:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Đã xảy ra lỗi khi đặt chỗ. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (isDriver) {
    return (
      <Button disabled className="w-full">
        Bạn là tài xế chuyến này
      </Button>
    );
  }

  if (availableSeats === 0) {
    return (
      <Button disabled variant="secondary" className="w-full">
        Đã hết ghế trống
      </Button>
    );
  }

  if (checkingActive) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang kiểm tra trạng thái...
      </Button>
    );
  }

  if (hasActiveBooking) {
    return (
      <div className="space-y-2">
        <Button disabled variant="destructive" className="w-full">
          Không thể đặt chỗ
        </Button>
        <p className="text-[12px] text-[#d93025] text-center font-medium leading-normal">
          Bạn đang có chuyến đi đã xác nhận và chưa hoàn thành. Không thể đặt thêm chuyến mới.
        </p>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="w-full text-lg font-semibold py-6 shadow-md hover:shadow-lg transition-all">
          Đặt chỗ ngay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xác nhận đặt chỗ</DialogTitle>
          <DialogDescription>
            Chọn số lượng ghế bạn muốn đặt cho chuyến đi này.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="seats" className="text-right">
              Số ghế
            </Label>
            <Input
              id="seats"
              type="number"
              min={1}
              max={availableSeats}
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
              className="col-span-3"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Còn trống {availableSeats} ghế
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button onClick={handleBooking} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận đặt'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
