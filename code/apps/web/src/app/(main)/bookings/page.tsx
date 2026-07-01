'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMyBookings, useConfirmBooking } from '@/hooks/useBookings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, User, ChevronRight } from 'lucide-react';

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<'passenger' | 'driver'>('passenger');
  const { data, isLoading } = useMyBookings(activeTab, 1);
  const { mutate: confirmBooking, isPending: isConfirming } = useConfirmBooking();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Chờ xác nhận</Badge>;
      case 'CONFIRMED': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Đã xác nhận</Badge>;
      case 'COMPLETED': return <Badge variant="default" className="bg-blue-600">Hoàn thành</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Đã huỷ</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Đặt chỗ</h1>
        <p className="text-muted-foreground mt-2">Theo dõi các chuyến đi bạn đã đặt hoặc quản lý khách hàng của bạn.</p>
      </div>

      <div className="flex space-x-2 border-b pb-4">
        <Button 
          variant={activeTab === 'passenger' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('passenger')}
        >
          Chuyến của tôi (Hành khách)
        </Button>
        <Button 
          variant={activeTab === 'driver' ? 'default' : 'ghost'} 
          onClick={() => setActiveTab('driver')}
        >
          Quản lý chuyến (Tài xế)
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : (
        <div className="grid gap-4">
          {data?.bookings.length === 0 ? (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>Không có đặt chỗ nào.</p>
              </CardContent>
            </Card>
          ) : (
            data?.bookings.map((booking: any) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
                          {new Date(booking.ride.departureTime).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="font-medium">
                          {booking.ride.origin} <span className="text-muted-foreground font-normal mx-2">đến</span> {booking.ride.destination}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded-md inline-flex">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {activeTab === 'passenger' ? (
                            <span>Tài xế: {booking.ride.driver.firstName} {booking.ride.driver.lastName}</span>
                          ) : (
                            <span>Khách: {booking.passenger.firstName} {booking.passenger.lastName}</span>
                          )}
                        </div>
                        <div className="w-px h-4 bg-border"></div>
                        <div className="font-semibold text-primary">{booking.seats} chỗ</div>
                        <div className="w-px h-4 bg-border"></div>
                        <div className="font-semibold text-primary">{booking.totalPrice.toLocaleString('vi-VN')} đ</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                      {activeTab === 'driver' && booking.status === 'PENDING' && (
                        <Button 
                          onClick={() => confirmBooking(booking.id)} 
                          disabled={isConfirming}
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                        >
                          Xác nhận đặt chỗ
                        </Button>
                      )}
                      <Link href={`/bookings/${booking.id}`} className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full">
                          Xem chi tiết <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
