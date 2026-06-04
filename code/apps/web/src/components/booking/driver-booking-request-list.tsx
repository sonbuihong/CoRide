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
import { 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Phone,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { BookingActionButtons } from './booking-action-buttons';

interface BookingRequest {
  id: string;
  seats: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  passenger: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl?: string;
  };
  ride: {
    id: string;
    origin: string;
    destination: string;
    departureTime: string;
  };
}

interface DriverBookingRequestListProps {
  requests: BookingRequest[];
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
    label: 'Đã từ chối',
    variant: 'destructive' as const,
    icon: <XCircle className="h-3 w-3 mr-1" />,
    className: ''
  },
  CANCELLED: {
    label: 'Khách đã hủy',
    variant: 'secondary' as const,
    icon: <AlertCircle className="h-3 w-3 mr-1" />,
    className: ''
  }
};

export const DriverBookingRequestList = ({ requests, onRefresh }: DriverBookingRequestListProps) => {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">Hiện chưa có yêu cầu đặt chỗ nào cho các chuyến đi của bạn.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hành khách</TableHead>
            <TableHead>Chuyến đi</TableHead>
            <TableHead>Số ghế</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const config = statusConfig[request.status];
            const departureDate = new Date(request.ride.departureTime);

            return (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border">
                      {request.passenger.avatarUrl ? (
                        <img src={request.passenger.avatarUrl} alt={request.passenger.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{request.passenger.fullName}</span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Phone className="h-2 w-2" />
                        {request.passenger.phone}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    <div className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      {request.ride.origin} → {request.ride.destination}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-2 w-2" />
                        {departureDate.toLocaleDateString('vi-VN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-2 w-2" />
                        {departureDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{request.seats} ghế</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant} className={config.className}>
                    {config.icon}
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <BookingActionButtons 
                    bookingId={request.id} 
                    status={request.status} 
                    onRefresh={onRefresh} 
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
