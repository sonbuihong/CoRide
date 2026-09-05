import Link from 'next/link';
import { Armchair, CalendarClock, CarFront, ChevronRight, Clock3, MapPin, Navigation, Route, UserRound } from 'lucide-react';
import { ActivityItem, ActivityRole } from '@/services/activity-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const labels: Record<string, string> = { PENDING: 'Đang chờ', MATCHING: 'Đang tìm tài xế', CONFIRMED: 'Đã xác nhận', ACCEPTED: 'Đã ghép tài xế', ARRIVING: 'Tài xế đang đến', ARRIVED: 'Tài xế đã đến', SCHEDULED: 'Đã lên lịch', FULL: 'Đã đủ chỗ', ONGOING: 'Đang di chuyển', IN_PROGRESS: 'Đang di chuyển', WAITING_PAYMENT: 'Chờ thanh toán', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', REJECTED: 'Đã từ chối', EXPIRED: 'Đã hết hạn', NO_DRIVER: 'Không tìm thấy tài xế' };

function hrefFor(item: ActivityItem) {
  if (item.source === 'RIDE_HAILING') return item.segment === 'ACTIVE' ? `/ride-hailing/trip/${item.tripId}` : `/ride-hailing/trip/${item.tripId}`;
  if (item.role === 'DRIVER') return item.segment === 'ACTIVE' ? `/ongoing?rideId=${item.rideId}` : `/my-rides/${item.rideId}`;
  return item.bookingId ? `/bookings/${item.bookingId}` : '/my-bookings';
}

export function ActivityCard({ item, role }: { item: ActivityItem; role: ActivityRole }) {
  const active = item.segment === 'ACTIVE';
  const date = item.departureTime ? new Date(item.departureTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
  const person = role === 'DRIVER' ? item.nextPassenger ?? item.relatedUser : item.relatedUser;
  return <article className={`rounded-xl border bg-card p-5 sm:p-6 ${active ? 'border-primary/30' : ''}`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">{item.source === 'RIDE_HAILING' ? <CarFront className="h-4 w-4" /> : <Route className="h-4 w-4" />}{item.source === 'RIDE_HAILING' ? 'Ride-Hailing' : 'Carpooling'}</div><Badge variant={item.segment === 'CANCELLED' ? 'destructive' : item.segment === 'COMPLETED' ? 'secondary' : 'default'}><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />{labels[item.status] ?? item.status}</Badge></div>
    {date && <div className="mt-5 flex items-center gap-2 text-sm font-medium"><CalendarClock className="h-4 w-4 text-primary" /><time dateTime={item.departureTime ?? undefined}>{date}</time></div>}
    <div className="mt-5 grid grid-cols-[20px_1fr] gap-x-3"><div className="flex flex-col items-center pt-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /><span className="my-1 min-h-6 w-px flex-1 bg-border" /><MapPin className="h-4 w-4 text-destructive" /></div><div className="min-w-0"><p className="text-sm leading-5">{item.origin}</p><p className="mt-5 text-sm font-medium leading-5">{item.destination}</p></div></div>
    <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">{person && <Meta icon={UserRound} text={person.name} />}{item.vehicle && <Meta icon={CarFront} text={[item.vehicle.color, item.vehicle.licensePlate].filter(Boolean).join(' · ')} />}{item.seats != null && <Meta icon={Armchair} text={`${item.seats} ghế${role === 'DRIVER' && item.availableSeats != null ? ` · còn ${item.availableSeats}` : ''}`} />}{item.distanceKm != null && <Meta icon={Navigation} text={`${item.distanceKm.toLocaleString('vi-VN')} km`} />}{date && <Meta icon={Clock3} text={date} />}</div>
    {item.cancellationReason && <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm"><span className="font-medium text-destructive">Lý do hủy: </span>{item.cancellationReason}</div>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">{item.price != null ? <p className="font-semibold tabular-nums">{Math.round(item.price).toLocaleString('vi-VN')}đ{item.source === 'CARPOOL_RIDE' ? '/ghế' : ''}</p> : <span />}<Link href={hrefFor(item)}><Button className="min-h-11 gap-2">{active ? 'Tiếp tục chuyến' : item.status === 'WAITING_PAYMENT' ? 'Thanh toán' : item.status === 'COMPLETED' ? 'Xem & đánh giá' : 'Xem chi tiết'}<ChevronRight className="h-4 w-4" /></Button></Link></div>
  </article>;
}
function Meta({ icon: Icon, text }: { icon: typeof UserRound; text: string }) { return <span className="inline-flex min-h-8 items-center gap-1.5 rounded-md bg-muted px-2.5"><Icon className="h-3.5 w-3.5" />{text}</span>; }
