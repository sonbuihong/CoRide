'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useRoleMode } from '@/components/providers/role-mode-provider';
import { Search, Bookmark, Car, PlusSquare, Users, User, LayoutDashboard, Home, Clock, Bell, Grid, LayoutGrid } from 'lucide-react';

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
    // Passenger - exact visual match
    tabs = [
      { name: '', href: '/rides/search', icon: Home, isHome: true },
      { name: '', href: '/my-bookings', icon: Clock },
      { name: '', href: '/notifications', icon: Bell },
      { name: '', href: '/profile', icon: User },
      { name: '', href: '#', icon: LayoutGrid, isSpecial: true },
    ];
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1d1d1f] border-t border-gray-200 dark:border-gray-800 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
      {/* Container for absolute floating items */}
      <div className="flex items-center justify-around h-[65px] px-2 relative">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== '/admin' && tab.href !== '#' && pathname.startsWith(tab.href) && tab.href !== '/profile' && tab.href !== '/rides/search' && tab.href !== '/rides/post');
          const isStrictActive = pathname === tab.href;
          const active = tab.href === '/profile' || tab.href === '/rides/search' || tab.href === '/rides/post' || tab.href === '/admin' ? isStrictActive : isActive;
          
          if (isAdmin || isDriverMode) {
             return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                  active 
                    ? 'text-[#0071e3] dark:text-[#2997ff]' 
                    : 'text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                <Icon className={`h-[24px] w-[24px] ${active ? 'fill-current opacity-20' : ''}`} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium tracking-tight">
                  {tab.name}
                </span>
              </Link>
            );
          }

          // PASSENGER UI exact matching image
          if (tab.isSpecial) {
            return (
              <div key="special-tab" className="flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer group">
                <div className="absolute -top-4 w-[60px] h-[60px] rounded-full bg-white dark:bg-[#1d1d1f] border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow-sm">
                  <div className="grid grid-cols-2 gap-1 w-[26px] h-[26px]">
                    <div className="bg-[#4285F4] rounded-[3px]"></div>
                    <div className="bg-[#34A853] rounded-[3px]"></div>
                    <div className="bg-[#FBBC05] rounded-[3px]"></div>
                    <div className="bg-[#EA4335] rounded-[3px]"></div>
                  </div>
                </div>
              </div>
            );
          }
          
          if (tab.isHome) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
              >
                <div className="absolute -top-4 w-[70px] h-[70px] rounded-full bg-gradient-to-tr from-[#9be3f2] to-[#c7f4fa] dark:from-cyan-700 dark:to-cyan-900 border-[4px] border-white dark:border-[#1d1d1f] flex items-center justify-center shadow-sm">
                   <Icon className="h-[28px] w-[28px] text-white dark:text-cyan-200 fill-white" strokeWidth={2.5} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active 
                  ? 'text-gray-800 dark:text-gray-200' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Icon className="h-[24px] w-[24px]" strokeWidth={2.5} fill={active ? 'currentColor' : 'none'} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
