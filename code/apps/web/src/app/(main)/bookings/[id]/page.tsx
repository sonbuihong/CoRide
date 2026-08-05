'use client';

import { useBookingDetail, useCancelBooking } from '@/hooks/useBookings';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, Users, CreditCard, MessageSquare, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { data: booking, isLoading, error } = useBookingDetail(id as string);
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();

  if (isLoading) return <div className="p-8 text-center"><div className="animate-spin inline-block w-8 h-8 border-b-2 border-primary rounded-full"></div></div>;
  if (error || !booking) return <div className="p-8 text-center text-destructive">Lỗi tải dữ liệu</div>;

  const isPassenger = user?.id === booking.passengerId;
  const isDriver = user?.id === booking.ride.driver.id;

  const handleCancel = () => {
    if (confirm('Bạn có chắc chắn muốn huỷ đặt chỗ này?')) {
      cancelBooking({ id: booking.id, cancelReason: isPassenger ? 'Hành khách huỷ' : 'Tài xế huỷ' });
    }
  };

  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chi tiết đặt chỗ</h1>
        <Badge variant={booking.status === 'CONFIRMED' ? 'default' : (booking.status === 'CANCELLED' ? 'destructive' : 'outline')} className="text-sm px-3 py-1">
          {booking.status}
        </Badge>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
          <CardTitle className="text-lg">Thông tin hành trình</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Điểm đón</p>
              <p className="font-medium">{booking.ride.origin}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Điểm đến</p>
              <p className="font-medium">{booking.ride.destination}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(booking.ride.departureTime).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(booking.ride.departureTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4"/> Số ghế</span>
              <span className="font-medium">{booking.seats}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground flex items-center gap-2"><CreditCard className="w-4 h-4"/> Trạng thái</span>
              <Badge variant="outline">{booking.paymentStatus}</Badge>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold">Tổng tiền</span>
              <span className="text-xl font-bold text-primary">{booking.totalPrice.toLocaleString('vi-VN')} đ</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{isPassenger ? 'Thông tin tài xế' : 'Thông tin hành khách'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                {(isPassenger ? booking.ride.driver.firstName[0] : booking.passenger.firstName[0])}
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {isPassenger 
                    ? `${booking.ride.driver.firstName} ${booking.ride.driver.lastName}`
                    : `${booking.passenger.firstName} ${booking.passenger.lastName}`}
                </p>
                <p className="text-muted-foreground text-sm">
                  {isPassenger ? booking.ride.driver.phone : booking.passenger.phone}
                </p>
              </div>
            </div>
            
            <div className="pt-4 flex gap-2">
              <Link href={`/chat/${booking.ride.id}`} className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="w-4 h-4 mr-2" /> Nhắn tin
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {booking.cancelReason && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold">Lý do huỷ</h4>
            <p className="text-sm mt-1">{booking.cancelReason}</p>
          </div>
        </div>
      )}

      {canCancel && (
        <div className="flex justify-center pt-4 border-t">
          <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? 'Đang huỷ...' : 'Huỷ đặt chỗ'}
          </Button>
        </div>
      )}
    </div>
  );
}
