'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Car, User, LogOut, Search, PlusSquare, Bookmark, MapPin, LayoutDashboard, Users, BookOpen, CreditCard, ShieldAlert, CalendarCheck } from 'lucide-react';
import { NotificationCenter } from './notification-center';
import { useAuth } from '@/components/providers/auth-provider';
import { useRoleMode } from '@/components/providers/role-mode-provider';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

// ==========================================
// THIẾT KẾ APPLE: Utilities CSS — Passenger Mode (Light)
// ==========================================
const passengerHeaderClass =
  "px-4 lg:px-6 h-12 flex items-center sticky top-0 z-50 transition-all duration-500 bg-[rgba(255,255,255,0.9)] border-b border-[rgba(0,0,0,0.16)] supports-[backdrop-filter]:backdrop-blur-[20px] supports-[backdrop-filter]:saturate-[180%]";

// Driver Mode — Dark header riêng biệt để phân biệt trực quan
const driverHeaderClass =
  "px-4 lg:px-6 h-12 flex items-center sticky top-0 z-50 transition-all duration-500 bg-[rgba(10,30,60,0.92)] border-b border-[rgba(255,255,255,0.08)] supports-[backdrop-filter]:backdrop-blur-[20px] supports-[backdrop-filter]:saturate-[180%]";

// Admin Mode — Black header sang trọng, quyền lực
const adminHeaderClass =
  "px-4 lg:px-6 h-12 flex items-center sticky top-0 z-50 transition-all duration-500 bg-[rgba(29,29,31,0.94)] border-b border-[rgba(255,255,255,0.1)] supports-[backdrop-filter]:backdrop-blur-[20px] supports-[backdrop-filter]:saturate-[180%]";

const passengerNavLinkItem =
  "px-3 py-1.5 rounded-[8px] text-[13px] font-medium tracking-[-0.12px] text-[rgba(0,0,0,0.8)] hover:text-black hover:bg-[rgba(0,0,0,0.04)] flex items-center gap-1.5 transition-colors";

const passengerNavLinkActive =
  "px-3 py-1.5 rounded-[8px] text-[13px] font-semibold tracking-[-0.12px] text-black bg-[rgba(0,0,0,0.08)] flex items-center gap-1.5 transition-colors";

const driverNavLinkItem =
  "px-3 py-1.5 rounded-[8px] text-[13px] font-medium tracking-[-0.12px] text-[rgba(255,255,255,0.8)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] flex items-center gap-1.5 transition-colors";

const driverNavLinkActive =
  "px-3 py-1.5 rounded-[8px] text-[13px] font-semibold tracking-[-0.12px] text-white bg-[rgba(255,255,255,0.12)] flex items-center gap-1.5 transition-colors";

const adminNavLinkItem = driverNavLinkItem;
const adminNavLinkActive = driverNavLinkActive;

const appleNavButtonClass =
  "bg-transparent text-[#1d1d1f] hover:bg-[rgba(0,0,0,0.04)] px-3 py-1 rounded-[980px] text-[12px] font-medium tracking-tight transition-colors";

const appleNavPrimaryCTA =
  "bg-[#1d1d1f] text-white hover:bg-black px-4 py-1.5 rounded-[980px] text-[12px] font-medium tracking-tight transition-colors";

// Tab switch styles
const tabBaseClass =
  "px-4 py-1.5 text-[12px] font-medium tracking-[-0.12px] rounded-[980px] transition-all duration-300 flex items-center gap-1.5 cursor-pointer select-none";

const passengerTabActive =
  "bg-[#0071e3] text-white shadow-[0_2px_8px_rgba(0,113,227,0.3)]";

const passengerTabInactive =
  "text-[rgba(0,0,0,0.56)] hover:text-[rgba(0,0,0,0.8)] hover:bg-[rgba(0,0,0,0.04)]";

const driverTabActive =
  "bg-[#34c759] text-white shadow-[0_2px_8px_rgba(52,199,89,0.3)]";

const driverTabInactive =
  "text-[rgba(255,255,255,0.56)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]";

export const Header: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { mode, setMode } = useRoleMode();
  const router = useRouter();
  const pathname = usePathname();

  const [rolePopupOpen, setRolePopupOpen] = useState(false);
  const [rolePopupContent, setRolePopupContent] = useState<{title: string, desc: string} | null>(null);

  const handleModeSwitch = (newMode: 'passenger' | 'driver') => {
    setMode(newMode);
    if (newMode === 'passenger') {
      setRolePopupContent({
        title: 'Chế độ Hành khách',
        desc: 'Bạn đang ở chế độ Hành khách. Tại đây, bạn có thể tìm kiếm chuyến đi, đặt chỗ và xem lịch sử các chuyến đã đồng hành.'
      });
      router.push('/rides/search');
    } else {
      setRolePopupContent({
        title: 'Chế độ Tài xế',
        desc: 'Bạn đang ở chế độ Tài xế. Tại đây, bạn có thể đăng các chuyến đi mới, chia sẻ chỗ trống và quản lý yêu cầu đặt chỗ từ hành khách.'
      });
      router.push('/rides/post');
    }
    setRolePopupOpen(true);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isDriverMode = mode === 'driver' && !isAdmin;

  let headerClass = passengerHeaderClass;

  if (isAdmin) {
    headerClass = adminHeaderClass;
  } else if (isDriverMode) {
    headerClass = driverHeaderClass;
  }

  const getLinkClass = (href: string) => {
    // Exact match cho trang chủ dashboard/admin, startWith cho các trang con
    const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
    if (isAdmin) return isActive ? adminNavLinkActive : adminNavLinkItem;
    if (isDriverMode) return isActive ? driverNavLinkActive : driverNavLinkItem;
    return isActive ? passengerNavLinkActive : passengerNavLinkItem;
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Đã đăng xuất');
      router.push('/');
    } catch {
      toast.error('Đăng xuất thất bại');
    }
  };

  return (
    <header className={headerClass}>
      <div className="container mx-auto flex items-center max-w-[980px]">
        {/* LOGO */}
        <Link className="flex items-center justify-center mr-6 opacity-80 hover:opacity-100 transition-opacity" href="/">
          <Car className={`h-5 w-5 mr-1 ${isDriverMode || isAdmin ? 'text-white' : 'text-[#1d1d1f]'}`} />
          <span className={`font-semibold text-[17px] tracking-[-0.37px] ${isDriverMode || isAdmin ? 'text-white' : 'text-[#1d1d1f]'}`}>
            CoRide
          </span>
        </Link>

        {/* ROLE SWITCH TABS — chỉ hiện khi đã đăng nhập và không phải ADMIN */}
        {user && !isAdmin && (
          <div className={`hidden md:flex items-center rounded-[980px] p-0.5 mr-6 ${isDriverMode ? 'bg-[rgba(255,255,255,0.08)]' : 'bg-[rgba(0,0,0,0.04)]'}`}>
            <button
              onClick={() => handleModeSwitch('passenger')}
              className={`${tabBaseClass} ${!isDriverMode ? passengerTabActive : (isDriverMode ? driverTabInactive : passengerTabInactive)}`}
            >
              <Search className="h-3 w-3" />
              Tìm chuyến đi
            </button>
            <button
              onClick={() => handleModeSwitch('driver')}
              className={`${tabBaseClass} ${isDriverMode ? driverTabActive : passengerTabInactive}`}
            >
              <MapPin className="h-3 w-3" />
              Đăng chuyến đi
            </button>
          </div>
        )}

        {/* CONTEXTUAL NAVIGATION */}
        <nav className="hidden md:flex gap-6 items-center flex-1">
          {user && isAdmin && (
            <>
              <Link className={getLinkClass('/admin')} href="/admin">
                <LayoutDashboard className="h-3.5 w-3.5" /> Tổng quan
              </Link>
              <Link className={getLinkClass('/admin/driver-verifications')} href="/admin/driver-verifications">
                <ShieldAlert className="h-3.5 w-3.5" /> Duyệt tài xế
              </Link>
              <Link className={getLinkClass('/admin/users')} href="/admin/users">
                <Users className="h-3.5 w-3.5" /> Người dùng
              </Link>
              <Link className={getLinkClass('/admin/rides')} href="/admin/rides">
                <Car className="h-3.5 w-3.5" /> Chuyến đi
              </Link>
              <Link className={getLinkClass('/admin/bookings')} href="/admin/bookings">
                <BookOpen className="h-3.5 w-3.5" /> Đặt chỗ
              </Link>
              <Link className={getLinkClass('/admin/transactions')} href="/admin/transactions">
                <CreditCard className="h-3.5 w-3.5" /> Giao dịch
              </Link>
            </>
          )}
          {user && !isAdmin && !isDriverMode && (
            <>
              <Link className={getLinkClass('/rides/search')} href="/rides/search">
                <Search className="h-3.5 w-3.5" /> Tìm chuyến
              </Link>
              <Link className={getLinkClass('/book')} href="/book">
                <CalendarCheck className="h-3.5 w-3.5" /> Đặt chuyến đi
              </Link>
              <Link className={getLinkClass('/my-bookings')} href="/my-bookings">
                <Bookmark className="h-3.5 w-3.5" /> Chuyến đã đặt
              </Link>
            </>
          )}
          {user && !isAdmin && isDriverMode && (
            <>
              <Link className={getLinkClass('/rides/post')} href="/rides/post">
                <PlusSquare className="h-3.5 w-3.5" /> Đăng chuyến mới
              </Link>
              <Link className={getLinkClass('/my-rides')} href="/my-rides">
                <Car className="h-3.5 w-3.5" /> Chuyến đã tạo
              </Link>
              <Link className={getLinkClass('/booking-requests')} href="/booking-requests">
                <Bookmark className="h-3.5 w-3.5" /> Yêu cầu đặt chỗ
              </Link>
            </>
          )}
          {!user && (
            <Link className={getLinkClass('/rides/search')} href="/rides/search">
              <Search className="h-3.5 w-3.5" /> Tìm chuyến đi
            </Link>
          )}
        </nav>

        {/* RIGHT ACTION ICONS */}
        <div className="ml-auto flex gap-3 items-center">
          {loading ? (
            <div className="h-6 w-20 bg-[rgba(0,0,0,0.08)] animate-pulse rounded-[8px]" />
          ) : user ? (
            <>
              {/* Mobile Role Switch */}
              {user && !isAdmin && (
                <div className="flex md:hidden items-center gap-1">
                  <button
                    onClick={() => handleModeSwitch(isDriverMode ? 'passenger' : 'driver')}
                    className={`px-2.5 py-1 rounded-[980px] text-[11px] font-medium transition-all duration-300 ${isDriverMode
                        ? 'bg-[#34c759] text-white'
                        : 'bg-[#0071e3] text-white'
                      }`}
                  >
                    {isDriverMode ? 'Tài xế' : 'Hành khách'}
                  </button>
                </div>
              )}

              {user && !isAdmin && (
                <div className={`mx-1 h-3 border-l ${isDriverMode ? 'border-[rgba(255,255,255,0.2)]' : 'border-[rgba(0,0,0,0.2)]'}`} />
              )}

              {/* NOTIFICATIONS */}
              <NotificationCenter />

              {/* USER PROFILE */}
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  title="Hồ sơ cá nhân"
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center overflow-hidden ${isDriverMode || isAdmin ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-[rgba(0,0,0,0.04)]'
                    }`}>
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className={`h-3.5 w-3.5 ${isDriverMode || isAdmin ? 'text-white' : 'text-[#1d1d1f]'}`} />
                    )}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`p-1.5 transition-colors rounded-full ${isDriverMode || isAdmin
                      ? 'text-[rgba(255,255,255,0.56)] hover:text-[#ff453a] hover:bg-[rgba(255,255,255,0.1)]'
                      : 'text-[rgba(0,0,0,0.56)] hover:text-[#d93025] hover:bg-[rgba(0,0,0,0.04)]'
                    }`}
                  title="Đăng xuất"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <Link className={appleNavButtonClass} href="/login">
                Đăng nhập
              </Link>
              <Link className={appleNavPrimaryCTA} href="/register">
                Tạo ID CoRide
              </Link>
            </div>
          )}
        </div>
      </div>

      <Dialog open={rolePopupOpen} onOpenChange={setRolePopupOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{rolePopupContent?.title}</DialogTitle>
            <DialogDescription className="text-[14px] leading-relaxed mt-2 text-[rgba(0,0,0,0.7)] dark:text-[rgba(255,255,255,0.7)]">
              {rolePopupContent?.desc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={() => setRolePopupOpen(false)} className="w-full sm:w-auto bg-[#1d1d1f] text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-[#f5f5f7]">
              Đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};
