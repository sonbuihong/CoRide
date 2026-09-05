'use client';

import React from 'react';
import { Bike, Calendar, Car, Users, Star, ChevronRight, Route } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  driverRating?: number | null;
  isDriverVerified?: boolean;
}

export interface Ride {
  id: string;
  scheduleId?: string | null;
  status?: string;
  origin: string;
  originLat: number | null;
  originLng: number | null;
  destination: string;
  destinationLat: number | null;
  destinationLng: number | null;
  departureTime: string | Date;
  availableSeats: number;
  pricePerSeat: number;
  driver: Driver;
  vehicle?: {
    licensePlate: string;
    type: 'BIKE' | 'CAR';
    color?: string | null;
  } | null;
  matchType?: 'DIRECT' | 'NEARBY' | 'ON_ROUTE';
  matchScore?: number;
  originDistanceKm?: number;
  pickupDistanceKm?: number;
  dropoffDistanceKm?: number;
  detourKm?: number;
  routeOverlap?: number;
}

interface RideCardProps {
  ride: Ride;
  scheduleRides?: Ride[];
  getRideHref?: (rideId: string) => string;
  href?: string;
  userLocation?: { lat: number; lng: number } | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

// Haversine formula to calculate distance in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function RideCard({ ride, scheduleRides, getRideHref, href, userLocation, onMouseEnter, onMouseLeave, onClick }: RideCardProps) {
  const router = useRouter();
  const departureDate = new Date(ride.departureTime);
  const departures = scheduleRides?.length ? scheduleRides : [ride];
  const formattedDate = departureDate.toLocaleDateString('vi-VN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = departureDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let distanceToOrigin = null;
  if (userLocation && ride.originLat && ride.originLng) {
    distanceToOrigin = getDistanceFromLatLonInKm(
      userLocation.lat,
      userLocation.lng,
      ride.originLat,
      ride.originLng
    );
  }

  const matchLabel = ride.matchType === 'DIRECT'
    ? 'Trùng chuyến'
    : ride.matchType === 'NEARBY'
      ? 'Gần tuyến'
      : ride.matchType === 'ON_ROUTE'
        ? 'Đón dọc đường'
        : null;
  const matchBadgeClass = ride.matchType === 'DIRECT'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
    : ride.matchType === 'NEARBY'
      ? 'bg-blue-50 text-[#0066cc] dark:bg-blue-500/15 dark:text-blue-300'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  const vehicleTypeLabel = ride.vehicle?.type === 'CAR' ? 'Ô tô' : 'Xe máy';
  return (
    <div 
      className="group relative w-full bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 sm:p-8 transition-all shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border-2 border-slate-300 dark:border-slate-700 overflow-hidden cursor-pointer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {matchLabel && ride.matchScore != null && (
        <div className="mb-5 flex flex-wrap items-center gap-2" aria-label={`Mức độ phù hợp ${ride.matchScore}%`}>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${matchBadgeClass}`}>
            <Route className="h-3.5 w-3.5" aria-hidden="true" />
            {matchLabel}
          </span>
          <span className="rounded-full bg-[#1d1d1f] px-3 py-1.5 text-[12px] font-bold text-white dark:bg-white dark:text-[#1d1d1f]">
            Phù hợp {ride.matchScore}%
          </span>
          {ride.pickupDistanceKm != null && ride.dropoffDistanceKm != null && (
            <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
              Điểm đón {ride.pickupDistanceKm < 0.1 ? '< 100 m' : `${ride.pickupDistanceKm} km`}
              {' · '}điểm trả {ride.dropoffDistanceKm < 0.1 ? '< 100 m' : `${ride.dropoffDistanceKm} km`}
              {ride.detourKm != null && ride.detourKm > 0.1 ? ` · lệch tuyến ~${ride.detourKm} km` : ''}
            </span>
          )}
          {ride.originDistanceKm != null && (
            <span className="text-[12px] font-semibold text-[#0066cc] dark:text-[#2997ff]">
              Điểm đi tài xế cách điểm đi của bạn{' '}
              {ride.originDistanceKm < 0.1 ? '< 100 m' : `${ride.originDistanceKm} km`}
            </span>
          )}
        </div>
      )}
      {(ride.status === 'ONGOING' || departures.length > 1) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {ride.status === 'ONGOING' && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              Đang di chuyển
            </span>
          )}
          {departures.length > 1 && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-[#0066cc] dark:bg-blue-500/15 dark:text-blue-300">
              Lịch chuyến · {departures.length} ngày
            </span>
          )}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-8 justify-between">
        
        {/* Left: Route Info */}
        <div className="flex-1 space-y-5">
          {/* Timeline / Route */}
          <div className="flex items-stretch space-x-4">
            <div className="flex flex-col items-center justify-between py-1.5">
              <div className="h-2.5 w-2.5 rounded-full border-[2px] border-[#1d1d1f] dark:border-white bg-transparent" />
              <div className="w-[1.5px] flex-1 bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.1)] my-1 relative">
                 <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#1d1d1f] to-transparent dark:from-white opacity-20" />
              </div>
              <div className="h-2.5 w-2.5 rounded-full bg-[#1d1d1f] dark:bg-white" />
            </div>
            
            <div className="flex flex-col justify-between space-y-6">
              <div>
                <p className="text-[12px] font-semibold tracking-wider uppercase text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] mb-0.5">Điểm đi</p>
                <div className="flex items-center gap-2">
                  <p className="text-[21px] font-semibold tracking-tight leading-none text-[#1d1d1f] dark:text-white">{ride.origin}</p>
                  {distanceToOrigin !== null && (
                    <span className="text-[12px] font-medium text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full">
                      Cách bạn {distanceToOrigin < 1 ? '< 1' : distanceToOrigin.toFixed(1)} km
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[12px] font-semibold tracking-wider uppercase text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] mb-0.5">Điểm đến</p>
                <p className="text-[21px] font-semibold tracking-tight leading-none text-[#1d1d1f] dark:text-white">{ride.destination}</p>
              </div>
            </div>
          </div>

          {/* Info Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="relative z-20 inline-flex min-h-9 items-center bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] px-3 py-1.5 rounded-[980px]">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-[rgba(0,0,0,0.64)] dark:text-[rgba(255,255,255,0.64)]" />
              {departures.length > 1 ? (
                <select
                  aria-label={`Chọn một trong ${departures.length} ngày khởi hành`}
                  defaultValue={ride.id}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    const selectedRideId = event.target.value;
                    router.push(getRideHref?.(selectedRideId) ?? `/rides/${selectedRideId}`);
                  }}
                  className="max-w-[220px] cursor-pointer appearance-auto bg-transparent pr-1 text-[12px] font-medium tracking-[-0.12px] text-[#1d1d1f] outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] dark:text-white"
                >
                  {departures.map((departure) => {
                    const optionDate = new Date(departure.departureTime);
                    return (
                      <option key={departure.id} value={departure.id} className="bg-white text-[#1d1d1f]">
                        {optionDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}, {optionDate.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <span className="text-[12px] font-medium tracking-[-0.12px] text-[#1d1d1f] dark:text-white">
                  {formattedTime}, {formattedDate}
                </span>
              )}
            </div>
            <div className="inline-flex items-center bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] px-3 py-1.5 rounded-[980px]">
              <Users className="mr-1.5 h-3.5 w-3.5 text-[rgba(0,0,0,0.64)] dark:text-[rgba(255,255,255,0.64)]" />
              <span className="text-[12px] font-medium tracking-[-0.12px] text-[#1d1d1f] dark:text-white">
                {ride.availableSeats} chỗ trống
              </span>
            </div>
            {ride.vehicle && (
              <div className="inline-flex items-center rounded-[980px] bg-[rgba(0,0,0,0.04)] px-3 py-1.5 dark:bg-[rgba(255,255,255,0.08)]">
                {ride.vehicle.type === 'CAR' ? (
                  <Car className="mr-1.5 h-3.5 w-3.5 text-[rgba(0,0,0,0.64)] dark:text-[rgba(255,255,255,0.64)]" />
                ) : (
                  <Bike className="mr-1.5 h-3.5 w-3.5 text-[rgba(0,0,0,0.64)] dark:text-[rgba(255,255,255,0.64)]" />
                )}
                <span className="text-[12px] font-medium tracking-[-0.12px] text-[#1d1d1f] dark:text-white">
                  Phương tiện: {ride.vehicle.licensePlate} · {vehicleTypeLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Driver & Price */}
        <div className="flex flex-col items-start md:items-end justify-between border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] md:border-t-0 pt-6 md:pt-0">
          
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="h-12 w-12 rounded-full bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden border border-[rgba(0,0,0,0.04)] relative">
              {ride.driver.avatarUrl ? (
                <img src={ride.driver.avatarUrl} alt={ride.driver.firstName} className="h-full w-full object-cover" />
              ) : (
                <Users className="h-5 w-5 text-[rgba(0,0,0,0.48)]" />
              )}
            </div>
            <div className="text-left md:text-right">
              <p className="text-[14px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white flex items-center md:justify-end gap-1">
                {ride.driver.firstName} {ride.driver.lastName}
                {ride.driver.isDriverVerified && (
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#34c759] text-white" title="Tài xế đã xác thực">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </p>
              <div className="flex items-center md:justify-end mt-0.5">
                <Star className="h-3.5 w-3.5 text-[#34c759] fill-[#34c759] mr-1" />
                <span className="text-[12px] text-[rgba(0,0,0,0.64)] dark:text-[rgba(255,255,255,0.64)] tracking-tight">
                  {ride.driver.driverRating ? ride.driver.driverRating.toFixed(1) : 'Lái xe mới'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 md:mt-auto text-left md:text-right w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between">
            <div>
              <p className="text-[12px] uppercase font-semibold tracking-wider text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] mb-1">
                Giá mỗi chỗ
              </p>
              <p className="text-[28px] font-semibold tracking-[-0.28px] leading-none text-[#0071e3]">
                {ride.pricePerSeat.toLocaleString('vi-VN')}đ
              </p>
            </div>
            
            <div className="mt-4 block">
              <span className="flex items-center rounded-full bg-[#0071e3] px-4 py-2 text-[14px] font-semibold text-white">
                Xem chi tiết <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Tầng vô hình bắt sự kiện click toàn thẻ */}
      <Link href={href ?? `/rides/${ride.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">Xem chi tiết chuyến đi</span>
      </Link>
    </div>
  );
}
