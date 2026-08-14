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
import dynamic from 'next/dynamic';

const PassengerPickupMap = dynamic(
  () => import('./passenger-pickup-map').then((m) => m.PassengerPickupMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-[300px] w-full bg-gray-50 rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-sm text-gray-500 font-medium">Đang tải bản đồ...</p>
      </div>
    ),
  }
);

interface BookingButtonProps {
  rideId: string;
  availableSeats: number;
  driverId: string;
  currentUserId?: string;
  passengerDestination?: { lat: number; lng: number };
}

export const BookingButton = ({ rideId, availableSeats, driverId, currentUserId, passengerDestination }: BookingButtonProps) => {
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [checkingActive, setCheckingActive] = useState(false);
  
  // States cho luồng mới
  const [step, setStep] = useState<'map' | 'seats'>('map');
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  const router = useRouter();

  const isDriver = currentUserId === driverId;

  useEffect(() => {
    if (!currentUserId) return;

    const checkActiveBooking = async () => {
      try {
        setCheckingActive(true);
        const res = await apiClient.get('/bookings/my');
        const bookings = (res.data?.bookings || []) as Array<{
          status: string;
          ride?: { status?: string };
        }>;
        
        // Backend considers both a pending request and a confirmed booking active.
        // Keep the client guard in sync so users do not reach a guaranteed 400.
        const active = bookings.find((b) =>
          (b.status === 'PENDING' || b.status === 'CONFIRMED') &&
          (b.ride?.status === 'SCHEDULED' || b.ride?.status === 'ONGOING')
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
      const response = await apiClient.post('/bookings', {
        rideId,
        seats,
        passengerLat: pickupLocation?.lat,
        passengerLng: pickupLocation?.lng,
        pickupAddress: pickupLocation?.address,
        dropoffLat: passengerDestination?.lat,
        dropoffLng: passengerDestination?.lng,
      });
      toast.success('Đặt chỗ thành công! Đang chờ tài xế duyệt yêu cầu của bạn.');
      setOpen(false);
      // Reset state
      setStep('map');
      setPickupLocation(null);
      router.push(`/bookings/${response.data.booking.id}`);
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
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        // Reset về bước đầu khi đóng dialog
        setTimeout(() => setStep('map'), 200);
      }
    }}>
      <DialogTrigger>
        <Button className="w-full text-lg font-semibold py-6 shadow-md hover:shadow-lg transition-all">
          Đặt chỗ ngay
        </Button>
      </DialogTrigger>
      <DialogContent className={step === 'map' ? "sm:max-w-[600px] p-0 overflow-hidden" : "sm:max-w-[425px]"}>
        {step === 'map' ? (
          <div className="flex flex-col">
            <div className="px-6 py-4 border-b">
              <DialogTitle className="text-lg">Xác nhận điểm đón</DialogTitle>
              <DialogDescription className="mt-1">
                Kéo bản đồ để chọn vị trí chính xác bạn muốn tài xế đến đón.
              </DialogDescription>
            </div>
            <div className="p-6">
              <PassengerPickupMap 
                onConfirm={(lat, lng, address) => {
                  setPickupLocation({ lat, lng, address });
                  setStep('seats');
                }}
                onCancel={() => setOpen(false)}
              />
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Xác nhận số ghế</DialogTitle>
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
              {pickupLocation && (
                <div className="mt-2 bg-blue-50 p-3 rounded-md border border-blue-100">
                  <p className="text-xs font-semibold text-blue-800 mb-1">Điểm đón đã chọn:</p>
                  <p className="text-xs text-blue-700 line-clamp-2">{pickupLocation.address}</p>
                  <button 
                    className="text-xs text-blue-600 underline mt-1"
                    onClick={() => setStep('map')}
                  >
                    Thay đổi điểm đón
                  </button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('map')} disabled={loading}>
                Quay lại
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
