'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  XCircle,
  AlertCircle,
  CheckCircle2,
  Clock3
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

interface Booking {
  id: string;
  seats: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  ride: {
    id: string;
    origin: string;
    destination: string;
    departureTime: string;
    driver: {
      firstName: string;
      lastName: string;
      fullName?: string;
      phone: string;
      avatarUrl?: string;
    };
  };
}

interface PassengerBookingListProps {
  bookings: Booking[];
  onRefresh: () => void;
}

const statusConfig = {
  PENDING: {
    label: 'Chờ duyệt',
    variant: 'outline' as const,
    icon: <Clock3 className="h-3 w-3 mr-1 text-amber-500" />,
    className: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    variant: 'default' as const,
    icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
    className: 'bg-green-600 hover:bg-green-600'
  },
  REJECTED: {
    label: 'Bị từ chối',
    variant: 'destructive' as const,
    icon: <XCircle className="h-3 w-3 mr-1" />,
    className: ''
  },
  CANCELLED: {
    label: 'Đã hủy',
    variant: 'secondary' as const,
    icon: <AlertCircle className="h-3 w-3 mr-1" />,
    className: ''
  }
};

export const PassengerBookingList = ({ bookings, onRefresh }: PassengerBookingListProps) => {
  const handleCancel = async (bookingId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu đặt chỗ này không?')) return;

    try {
      await apiClient.delete(`/bookings/${bookingId}`);
      toast.success('Đã hủy yêu cầu đặt chỗ thành công');
      onRefresh();
    } catch (error: unknown) {
      toast.error(((error as { response?: { data?: { message?: string } } }).response)?.data?.message || 'Không thể hủy đặt chỗ');
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">Bạn chưa có yêu cầu đặt chỗ nào.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chuyến đi</TableHead>
            <TableHead className="hidden md:table-cell">Tài xế</TableHead>
            <TableHead>Số ghế</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const config = statusConfig[booking.status];
            const departureDate = new Date(booking.ride.departureTime);
            const driverName = booking.ride.driver.fullName || `${booking.ride.driver.lastName} ${booking.ride.driver.firstName}`;

            return (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <div className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      {booking.ride.origin} → {booking.ride.destination}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {departureDate.toLocaleDateString('vi-VN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {departureDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border text-[10px]">
                      {booking.ride.driver.avatarUrl ? (
                        <img src={booking.ride.driver.avatarUrl} alt={driverName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{driverName}</span>
                      <span className="text-[10px] text-muted-foreground">{booking.ride.driver.phone}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{booking.seats} ghế</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant} className={config.className}>
                    {config.icon}
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleCancel(booking.id)}
                    >
                      Hủy
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
