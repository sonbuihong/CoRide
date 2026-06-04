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
  Eye,
  ChevronLeft, 
  ChevronRight 
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

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  driverRating?: number;
  driverRatingCount?: number;
  passengerRating?: number;
  passengerRatingCount?: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: '',
  });

  const fetchUsers = async (page = 1) => {
    try {
      const response = await apiClient.get(`/admin/users?page=${page}&limit=10`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm) {
      fetchUsers();
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get(`/admin/users?search=${searchTerm}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      toast.error('Không thể tìm kiếm người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await apiClient.patch(`/admin/users/${selectedUser.id}`, editFormData);
      toast.success('Cập nhật người dùng thành công');
      setEditDialogOpen(false);
      fetchUsers(pagination?.page || 1);
    } catch (error) {
      console.error('Lỗi khi cập nhật người dùng:', error);
      toast.error('Không thể cập nhật người dùng');
    }
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await apiClient.delete(`/admin/users/${selectedUser.id}`);
      toast.success('Xóa người dùng thành công');
      setDeleteDialogOpen(false);
      fetchUsers(pagination?.page || 1);
    } catch (error) {
      console.error('Lỗi khi xóa người dùng:', error);
      toast.error('Không thể xóa người dùng');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-500">Admin</Badge>;
      default:
        return <Badge variant="secondary">Người dùng</Badge>;
    }
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
                Quản lý Người dùng
              </h1>
              <p className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                Tổng số: {pagination?.total || 0} người dùng
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
                placeholder="Tìm kiếm theo email, tên..."
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

        {/* Users Table */}
        <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f5f5f7] dark:bg-[#2d2d2f]">
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Họ tên</TableHead>
                <TableHead className="font-semibold">Số điện thoại</TableHead>
                <TableHead className="font-semibold">Vai trò</TableHead>
                <TableHead className="font-semibold">Đánh giá</TableHead>
                <TableHead className="font-semibold">Ngày tham gia</TableHead>
                <TableHead className="font-semibold text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                    Không có người dùng nào
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-[#f5f5f7]/50 dark:hover:bg-[#2d2d2f]/50">
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-[13px]">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 dark:text-gray-500">Lái xe:</span>
                          <span className="font-medium text-[#1d1d1f] dark:text-white">
                            {user.driverRating !== undefined && user.driverRating !== null
                              ? user.driverRating.toFixed(1)
                              : '0.0'}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({user.driverRatingCount ?? 0})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 dark:text-gray-500">Khách:</span>
                          <span className="font-medium text-[#1d1d1f] dark:text-white">
                            {user.passengerRating !== undefined && user.passengerRating !== null
                              ? user.passengerRating.toFixed(1)
                              : '0.0'}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({user.passengerRatingCount ?? 0})
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(user)}
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
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchUsers(pagination.page + 1)}
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
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin người dùng: {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Họ</Label>
              <Input
                id="firstName"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Tên</Label>
              <Input
                id="lastName"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò</Label>
              <select
                id="role"
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                className="w-full h-[48px] rounded-[11px] border border-[rgba(0,0,0,0.1)] px-3 bg-white dark:bg-[#1d1d1f] dark:text-white"
              >
                <option value="USER">Người dùng</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateUser}>
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
              Bạn có chắc chắn muốn xóa người dùng {selectedUser?.email}? Hành động này không thể hoàn tác.
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
