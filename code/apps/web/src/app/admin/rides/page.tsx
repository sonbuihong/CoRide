'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Search, 
  Edit, 
  Trash2,
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Calendar,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Ride {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  status: string;
  price: number;
  availableSeats: number;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  bookings: {
    id: string;
    seats: number;
    status: string;
    passenger: {
      firstName: string;
      lastName: string;
    };
  }[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminRidesPage() {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: '',
  });

  const fetchRides = async (page = 1) => {
    try {
      const response = await apiClient.get(`/admin/rides?page=${page}&limit=10`);
      setRides(response.data.rides);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách chuyến đi:', error);
      toast.error('Không thể tải danh sách chuyến đi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm) {
      fetchRides();
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get(`/admin/rides?search=${searchTerm}`);
      setRides(response.data.rides);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      toast.error('Không thể tìm kiếm chuyến đi');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ride: Ride) => {
    setSelectedRide(ride);
    setEditFormData({
      status: ride.status,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateRide = async () => {
    if (!selectedRide) return;
    try {
      await apiClient.patch(`/admin/rides/${selectedRide.id}`, editFormData);
      toast.success('Cập nhật chuyến đi thành công');
      setEditDialogOpen(false);
      fetchRides(pagination?.page || 1);
    } catch (error) {
      console.error('Lỗi khi cập nhật chuyến đi:', error);
      toast.error('Không thể cập nhật chuyến đi');
    }
  };

  const handleDelete = (ride: Ride) => {
    setSelectedRide(ride);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRide) return;
    try {
      await apiClient.delete(`/admin/rides/${selectedRide.id}`);
      toast.success('Xóa chuyến đi thành công');
      setDeleteDialogOpen(false);
      fetchRides(pagination?.page || 1);
    } catch (error) {
      console.error('Lỗi khi xóa chuyến đi:', error);
      toast.error('Không thể xóa chuyến đi');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Đang hoạt động</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-500">Hoàn thành</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
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
                Quản lý Chuyến đi
              </h1>
              <p className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                Tổng số: {pagination?.total || 0} chuyến đi
              </p>
            </div>
            <Button
              onClick={() => router.push('/admin')}
              variant="outline"
            >
              Quay lại Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.4)]" />
              <Input
                placeholder="Tìm kiếm theo điểm đi, điểm đến, tài xế..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-[48px] rounded-[11px]"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="h-[48px] px-6">
              Tìm kiếm
            </Button>
          </div>
        </div>

        {/* Rides Table */}
        <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f5f5f7] dark:bg-[#2d2d2f]">
                <TableHead className="font-semibold">Tài xế</TableHead>
                <TableHead className="font-semibold">Lộ trình</TableHead>
                <TableHead className="font-semibold">Thời gian</TableHead>
                <TableHead className="font-semibold">Giá</TableHead>
                <TableHead className="font-semibold">Ghế trống</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="font-semibold">Ngày tạo</TableHead>
                <TableHead className="font-semibold text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                    Không có chuyến đi nào
                  </TableCell>
                </TableRow>
              ) : (
                rides.map((ride) => (
                  <TableRow key={ride.id} className="hover:bg-[#f5f5f7]/50 dark:hover:bg-[#2d2d2f]/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{ride.driver.firstName} {ride.driver.lastName}</span>
                        <span className="text-xs text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                          {ride.driver.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-green-600" />
                        <span className="text-sm">{ride.origin}</span>
                        <span className="text-[rgba(0,0,0,0.4)]">→</span>
                        <MapPin className="h-3 w-3 text-red-600" />
                        <span className="text-sm">{ride.destination}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-[rgba(0,0,0,0.4)]" />
                        <span className="text-sm">
                          {new Date(ride.departureTime).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(ride.price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-[rgba(0,0,0,0.4)]" />
                        <span className="font-medium">{ride.availableSeats}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(ride.status)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(ride.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(ride)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(ride)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]">
              <span className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                Trang {pagination.page} / {pagination.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchRides(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchRides(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa chuyến đi</DialogTitle>
            <DialogDescription>
              Cập nhật trạng thái chuyến đi: {selectedRide?.origin} → {selectedRide?.destination}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <select
                id="status"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full h-[48px] rounded-[11px] border border-[rgba(0,0,0,0.1)] px-3 bg-white dark:bg-[#1d1d1f] dark:text-white"
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateRide}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa chuyến đi này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
