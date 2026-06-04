'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../../lib/api-client';
import { Loader2, Users, Car, BookOpen, CreditCard, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';

interface Stats {
  totalUsers: number;
  totalRides: number;
  totalBookings: number;
  totalTransactions: number;
  recentUsers: number;
  recentRides: number;
  recentBookings: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdminAccess = useCallback(() => {
    if (!authLoading) {
      if (!user) {
        toast.error('Vui lòng đăng nhập');
        router.push('/login');
      } else if (user.role !== 'ADMIN') {
        toast.error('Bạn không có quyền truy cập trang này');
        router.push('/');
      }
    }
  }, [authLoading, user, router]);

  const fetchStats = useCallback(async () => {
    // Only fetch stats if user is authenticated and is admin
    if (!user || user.role !== 'ADMIN') {
      setLoading(false);
      return;
    }
    
    try {
      const response = await apiClient.get('/admin/stats');
      setStats(response.data.stats);
    } catch {
      console.error('Lỗi khi tải thống kê');
      toast.error('Không thể tải thống kê hệ thống');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  useEffect(() => {
    if (!authLoading && user && user.role === 'ADMIN') {
      fetchStats();
    }
  }, [authLoading, user, fetchStats]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-[#1d1d1f] border-b border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                Quản lý hệ thống CoRide
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                Xin chào, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">
                  {stats?.totalUsers || 0}
                </p>
                <p className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  Tổng người dùng
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Car className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">
                  {stats?.totalRides || 0}
                </p>
                <p className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  Tổng chuyến đi
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">
                  {stats?.totalBookings || 0}
                </p>
                <p className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  Tổng đặt chỗ
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#1d1d1f] dark:text-white">
                  {stats?.totalTransactions || 0}
                </p>
                <p className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  Tổng giao dịch
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]">
            <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white mb-4">
              Hoạt động gần đây (30 ngày)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  Người dùng mới
                </span>
                <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">
                  +{stats?.recentUsers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  Chuyến đi mới
                </span>
                <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">
                  +{stats?.recentRides || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  Đặt chỗ mới
                </span>
                <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">
                  +{stats?.recentBookings || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]">
            <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white mb-4">
              Quản lý nhanh
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/admin/users')}
                className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Quản lý người dùng
                  </span>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/rides')}
                className="w-full flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Car className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Quản lý chuyến đi
                  </span>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/bookings')}
                className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Quản lý đặt chỗ
                  </span>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/transactions')}
                className="w-full flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Quản lý giao dịch
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]">
            <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-white mb-4">
              Thông tin hệ thống
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  Phiên bản
                </span>
                <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">
                  v1.0.0
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  Database
                </span>
                <span className="text-sm font-medium text-[#1d1d1f] dark:text-white">
                  PostgreSQL
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                  API Status
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}