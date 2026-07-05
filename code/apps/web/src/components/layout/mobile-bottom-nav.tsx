'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useRoleMode } from '@/components/providers/role-mode-provider';
import { Search, Bookmark, Car, PlusSquare, Users, User, LayoutDashboard } from 'lucide-react';

export function MobileBottomNav() {
  const { user, loading } = useAuth();
  const { mode } = useRoleMode();
  const pathname = usePathname();

  // Ẩn thanh bottom nav trên trang ongoing (đang trong chuyến đi)
  const isOngoingPage = pathname === '/ongoing';
  if (isOngoingPage) return null;

  const isAdmin = user?.role === 'ADMIN';
  const isDriverMode = !!user && mode === 'driver' && !isAdmin;

  // Nếu đang loading hoặc chưa đăng nhập, chỉ hiện nút về trang chủ hoặc tìm chuyến
  if (loading || !user) {
    return null; // Không hiện khi chưa đăng nhập, để họ dùng top header
  }

  // Định nghĩa các tab dựa trên role
  let tabs = [];

  if (isAdmin) {
    tabs = [
      { name: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
      { name: 'Chuyến đi', href: '/admin/rides', icon: Car },
      { name: 'Người dùng', href: '/admin/users', icon: Users },
      { name: 'Hồ sơ', href: '/profile', icon: User },
    ];
  } else if (isDriverMode) {
    tabs = [
      { name: 'Đăng chuyến', href: '/rides/post', icon: PlusSquare },
      { name: 'Chuyến của tôi', href: '/my-rides', icon: Car },
      { name: 'Yêu cầu', href: '/booking-requests', icon: Users },
      { name: 'Hồ sơ', href: '/profile', icon: User },
    ];
  } else {
    // Passenger
    tabs = [
      { name: 'Tìm chuyến', href: '/rides/search', icon: Search },
      { name: 'Chuyến của tôi', href: '/my-bookings', icon: Bookmark },
      { name: 'Hồ sơ', href: '/profile', icon: User },
    ];
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(29,29,31,0.92)] border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] supports-[backdrop-filter]:backdrop-blur-[20px] supports-[backdrop-filter]:saturate-[180%] pb-safe">
      <div className="flex items-center justify-around h-[60px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // Exact match cho admin home, startWith cho các tab khác
          const isActive = pathname === tab.href || (tab.href !== '/admin' && pathname.startsWith(tab.href) && tab.href !== '/profile' && tab.href !== '/rides/search' && tab.href !== '/rides/post');
          // For specific exact matches:
          const isStrictActive = pathname === tab.href;
          const active = tab.href === '/profile' || tab.href === '/rides/search' || tab.href === '/rides/post' || tab.href === '/admin' ? isStrictActive : isActive;
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                active 
                  ? 'text-[#0071e3] dark:text-[#2997ff]' 
                  : 'text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <Icon className={`h-6 w-6 ${active ? 'fill-current opacity-20' : ''}`} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-tight">
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
