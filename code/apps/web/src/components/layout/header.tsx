'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, Bell, Bookmark, Car, ChevronDown, CircleDollarSign, LayoutDashboard, LogOut, Menu, MessageCircle, Plus, Route, Search, ShieldCheck, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { useRoleMode } from '@/components/providers/role-mode-provider';
import { NotificationCenter } from './notification-center';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: typeof Car };
const passengerNav: NavItem[] = [
  { href: '/rides', label: 'Tìm chuyến', icon: Search }, { href: '/ride-hailing', label: 'Ride-Hailing', icon: Car },
  { href: '/activity', label: 'Hoạt động', icon: Activity }, { href: '/messages', label: 'Tin nhắn', icon: MessageCircle },
];
const driverNav: NavItem[] = [
  { href: '/driver', label: 'Tổng quan', icon: LayoutDashboard }, { href: '/rides/post', label: 'Đăng chuyến', icon: Plus },
  { href: '/my-rides', label: 'Chuyến của tôi', icon: Route }, { href: '/booking-requests', label: 'Yêu cầu', icon: Users },
  { href: '/messages', label: 'Tin nhắn', icon: MessageCircle },
];
const adminPrimary: NavItem[] = [{ href: '/admin', label: 'Tổng quan', icon: LayoutDashboard }, { href: '/admin/users', label: 'Người dùng', icon: Users }];
const adminManage: NavItem[] = [
  { href: '/admin/rides', label: 'Carpooling', icon: Route }, { href: '/admin/trips', label: 'Ride-Hailing', icon: Car },
  { href: '/admin/bookings', label: 'Đặt chỗ', icon: Bookmark }, { href: '/admin/transactions', label: 'Giao dịch', icon: CircleDollarSign },
  { href: '/admin/pricing', label: 'Cấu hình giá', icon: CircleDollarSign }, { href: '/admin/driver-verifications', label: 'KYC tài xế', icon: ShieldCheck },
  { href: '/admin/reports', label: 'Báo cáo', icon: Bell },
];

export function Header() {
  const { user, loading, logout } = useAuth(); const { mode, setMode } = useRoleMode(); const pathname = usePathname(); const router = useRouter();
  const isAdmin = user?.role === 'ADMIN'; const isDriver = !!user && mode === 'driver' && !isAdmin;
  const nav = isAdmin ? adminPrimary : isDriver ? driverNav : passengerNav;
  const active = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
  const switchMode = () => { const next = isDriver ? 'passenger' : 'driver'; setMode(next); router.push(next === 'driver' ? '/driver' : '/rides'); };
  const signOut = async () => { if (!window.confirm('Bạn có chắc chắn muốn đăng xuất?')) return; try { await logout(); toast.success('Đã đăng xuất'); router.push('/'); } catch { toast.error('Đăng xuất thất bại'); } };
  const dark = isAdmin || isDriver;
  return <header className={cn('sticky top-0 z-50 h-14 border-b backdrop-blur-md', dark ? 'border-white/10 bg-slate-950/95 text-white' : 'bg-background/95')}><div className="mx-auto flex h-full max-w-7xl items-center gap-5 px-4 sm:px-6"><Link href={isAdmin ? '/admin' : isDriver ? '/driver' : '/'} className="flex min-h-11 items-center gap-2 font-semibold tracking-tight"><Car className="h-5 w-5" />CoRide</Link>
    {!loading && user && !isAdmin && <button onClick={switchMode} className={cn('hidden min-h-9 items-center rounded-full px-3 text-xs font-semibold md:inline-flex', isDriver ? 'bg-emerald-500/15 text-emerald-300' : 'bg-primary/10 text-primary')} aria-label={`Chuyển sang chế độ ${isDriver ? 'hành khách' : 'tài xế'}`}>{isDriver ? 'Tài xế' : 'Hành khách'}<ChevronDown className="ml-1 h-3.5 w-3.5" /></button>}
    <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 lg:flex">{nav.map(item => <NavLink key={item.href} item={item} selected={active(item.href)} dark={dark} />)}{isAdmin && <details className="group relative"><summary className="flex min-h-10 cursor-pointer list-none items-center rounded-lg px-3 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white">Quản lý<ChevronDown className="ml-1 h-4 w-4 group-open:rotate-180" /></summary><div className="absolute left-0 top-11 grid w-56 gap-1 rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg">{adminManage.map(item => <NavLink key={item.href} item={item} selected={active(item.href)} />)}</div></details>}</nav>
    <div className="ml-auto flex items-center gap-1">{loading ? <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" /> : user ? <><div className="hidden lg:block"><NotificationCenter /></div><Link href="/notifications" className={cn('flex h-11 w-11 items-center justify-center rounded-lg lg:hidden', dark ? 'hover:bg-white/10' : 'hover:bg-muted')} aria-label="Thông báo"><Bell className="h-5 w-5" /></Link><Link href="/profile" className={cn('hidden min-h-10 items-center gap-2 rounded-lg px-2 text-sm xl:flex', dark ? 'hover:bg-white/10' : 'hover:bg-muted')}><User className="h-4 w-4" />Hồ sơ</Link><button onClick={signOut} className={cn('hidden h-10 w-10 items-center justify-center rounded-lg xl:flex', dark ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground')} aria-label="Đăng xuất"><LogOut className="h-4 w-4" /></button><MobileMenu nav={nav} extra={isAdmin ? adminManage : []} dark={dark} isAdmin={isAdmin} isDriver={isDriver} onSwitch={switchMode} onLogout={signOut} selected={active} /></> : <div className="flex items-center gap-2"><Link href="/login" className="inline-flex min-h-10 items-center px-3 text-sm font-medium">Đăng nhập</Link><Link href="/register" className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Đăng ký</Link></div>}</div></div></header>;
}

function NavLink({ item, selected, dark = false }: { item: NavItem; selected: boolean; dark?: boolean }) { const Icon = item.icon; return <Link href={item.href} aria-current={selected ? 'page' : undefined} className={cn('flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors', dark ? selected ? 'bg-white/12 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white' : selected ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}><Icon className="h-4 w-4" />{item.label}</Link>; }
function MobileMenu({ nav, extra, dark, isAdmin, isDriver, onSwitch, onLogout, selected }: { nav: NavItem[]; extra: NavItem[]; dark: boolean; isAdmin: boolean; isDriver: boolean; onSwitch: () => void; onLogout: () => void; selected: (href: string) => boolean }) { return <Sheet><SheetTrigger render={<button className={cn('flex h-11 w-11 items-center justify-center rounded-lg lg:hidden', dark ? 'hover:bg-white/10' : 'hover:bg-muted')} aria-label="Mở menu" />}><Menu className="h-5 w-5" /></SheetTrigger><SheetContent side="right" className="w-[min(88vw,380px)]"><SheetHeader><SheetTitle>Điều hướng CoRide</SheetTitle></SheetHeader><nav className="mt-6 grid gap-1">{[...nav, ...extra].map(item => <NavLink key={item.href} item={item} selected={selected(item.href)} />)}</nav><div className="mt-6 grid gap-2 border-t pt-6"><NavLink item={{ href: '/notifications', label: 'Thông báo', icon: Bell }} selected={selected('/notifications')} /><NavLink item={{ href: '/profile', label: 'Hồ sơ', icon: User }} selected={selected('/profile')} />{!isAdmin && <button onClick={onSwitch} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-left text-sm font-medium hover:bg-muted"><Car className="h-4 w-4" />Chuyển sang {isDriver ? 'Hành khách' : 'Tài xế'}</button>}<button onClick={onLogout} className="mt-2 flex min-h-11 items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" />Đăng xuất</button></div></SheetContent></Sheet>; }
