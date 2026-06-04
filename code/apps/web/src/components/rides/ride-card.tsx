'use client';

import React from 'react';
import { Calendar, Users, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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
  origin: string;
  destination: string;
  departureTime: string | Date;
  availableSeats: number;
  pricePerSeat: number;
  driver: Driver;
}

interface RideCardProps {
  ride: Ride;
}

export function RideCard({ ride }: RideCardProps) {
  const departureDate = new Date(ride.departureTime);
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

  return (
    <div className="group relative w-full bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 sm:p-8 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-transparent hover:border-[rgba(0,0,0,0.04)] dark:hover:border-[rgba(255,255,255,0.05)] overflow-hidden">
      
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
                <p className="text-[21px] font-semibold tracking-tight leading-none text-[#1d1d1f] dark:text-white">{ride.origin}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold tracking-wider uppercase text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] mb-0.5">Điểm đến</p>
                <p className="text-[21px] font-semibold tracking-tight leading-none text-[#1d1d1f] dark:text-white">{ride.destination}</p>
              </div>
            </div>
          </div>

          {/* Info Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="inline-flex items-center bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] px-3 py-1.5 rounded-[980px]">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-[rgba(0,0,0,0.64)] dark:text-[rgba(255,255,255,0.64)]" />
              <span className="text-[12px] font-medium tracking-[-0.12px] text-[#1d1d1f] dark:text-white">
                {formattedTime}, {formattedDate}
              </span>
            </div>
            <div className="inline-flex items-center bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] px-3 py-1.5 rounded-[980px]">
              <Users className="mr-1.5 h-3.5 w-3.5 text-[rgba(0,0,0,0.64)] dark:text-[rgba(255,255,255,0.64)]" />
              <span className="text-[12px] font-medium tracking-[-0.12px] text-[#1d1d1f] dark:text-white">
                {ride.availableSeats} chỗ trống
              </span>
            </div>
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
            
            <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity mt-4">
              <span className="text-[14px] text-[#0066cc] dark:text-[#2997ff] flex items-center hover:underline">
                Xem chi tiết <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Tầng vô hình bắt sự kiện click toàn thẻ */}
      <Link href={`/rides/${ride.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">Xem chi tiết chuyến đi</span>
      </Link>
    </div>
  );
}
