'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateBooking } from '@/hooks/useBookings';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  driverName: string;
  origin: string;
  destination: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
}

export function BookingModal({
  isOpen,
  onClose,
  rideId,
  driverName,
  origin,
  destination,
  departureTime,
  availableSeats,
  pricePerSeat,
}: BookingModalProps) {
  const [seats, setSeats] = useState(1);
  const { mutate: createBooking, isPending } = useCreateBooking();

  const handleConfirm = () => {
    createBooking(
      { rideId, seats },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const formattedDate = new Date(departureTime).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xác nhận đặt chỗ</DialogTitle>
          <DialogDescription>
            Kiểm tra thông tin chuyến đi và chọn số lượng chỗ ngồi.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4 text-sm">
            <span className="text-muted-foreground">Tài xế:</span>
            <span className="col-span-2 font-medium">{driverName}</span>
            
            <span className="text-muted-foreground">Lộ trình:</span>
            <span className="col-span-2">{origin} → {destination}</span>
            
            <span className="text-muted-foreground">Khởi hành:</span>
            <span className="col-span-2">{formattedDate}</span>
            
            <span className="text-muted-foreground">Giá mỗi ghế:</span>
            <span className="col-span-2 font-medium text-primary">
              {pricePerSeat.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="seats">Số ghế muốn đặt (Còn {availableSeats} chỗ)</Label>
            <Input
              id="seats"
              type="number"
              min={1}
              max={availableSeats}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-between items-center p-3 bg-muted rounded-lg font-semibold text-lg">
            <span>Tổng tiền:</span>
            <span className="text-primary">
              {(pricePerSeat * seats).toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Huỷ
          </Button>
          <Button onClick={handleConfirm} disabled={isPending || seats < 1 || seats > availableSeats}>
            {isPending ? 'Đang xử lý...' : 'Xác nhận đặt chỗ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
