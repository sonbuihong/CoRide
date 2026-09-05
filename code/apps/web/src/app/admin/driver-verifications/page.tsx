'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';

interface VerificationRequest {
  id: string;
  userId: string;
  licenseFrontImageUrl: string;
  licenseBackImageUrl: string;
  registrationFrontImageUrl: string;
  registrationBackImageUrl: string;
  vehiclePlate: string;
  vehicleModel: string | null;
  vehicleType: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
}

export default function AdminDriverVerificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<VerificationRequest | null>(null);
  
  // Dialog state
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
    const backendHost = apiBase.replace('/api', '');
    return `${backendHost}${url}`;
  };

  const checkAccess = useCallback(() => {
    if (!authLoading && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/driver-verifications');
      setRequests(res.data.data);
    } catch {
      toast.error('Không thể tải danh sách yêu cầu xét duyệt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (!authLoading && user?.role === 'ADMIN') {
      fetchRequests();
    }
  }, [authLoading, user, fetchRequests]);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn duyệt yêu cầu này? Người dùng sẽ được phép đăng chuyến đi.')) return;
    
    setIsProcessing(true);
    try {
      await apiClient.patch(`/admin/driver-verifications/${id}`, { decision: 'APPROVED' });
      toast.success('Đã duyệt yêu cầu thành công');
      fetchRequests();
      setSelectedReq(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setIsProcessing(true);
    try {
      await apiClient.patch(`/admin/driver-verifications/${selectedReq?.id}`, { 
        decision: 'REJECTED',
        rejectionReason 
      });
      toast.success('Đã từ chối yêu cầu');
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedReq(null);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#f5f5f7] dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl min-h-screen">
      {/* Header quay lại */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin')}
          className="text-[rgba(0,0,0,0.56)] hover:text-black dark:text-white/60 dark:hover:text-white flex items-center p-2 rounded-lg"
          id="btn-back-to-admin"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại Admin
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-[#1d1d1f] dark:text-white" />
        <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Duyệt Hồ sơ Tài xế (KYC)</h1>
      </div>

      <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-zinc-900/50">
            <TableRow>
              <TableHead className="font-semibold">Ngày gửi</TableHead>
              <TableHead className="font-semibold">Họ tên</TableHead>
              <TableHead className="font-semibold">Email / SĐT</TableHead>
              <TableHead className="font-semibold">Phương tiện</TableHead>
              <TableHead className="text-right font-semibold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-500 dark:text-zinc-400">
                  Không có yêu cầu xác thực nào đang chờ duyệt.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                  <TableCell className="text-gray-600 dark:text-zinc-300">
                    {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="font-semibold text-gray-800 dark:text-zinc-100">
                    {req.user.firstName} {req.user.lastName}
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-zinc-300">
                    <div>{req.user.email}</div>
                    <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                      {req.user.phone || 'Chưa cập nhật SĐT'}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-zinc-300">
                    <div className="font-bold uppercase tracking-wider">{req.vehiclePlate}</div>
                    <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                      {req.vehicleType === 'BIKE' ? 'Xe máy' : 'Ô tô'} - {req.vehicleModel || 'Không rõ'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedReq(req)}
                      className="rounded-lg shadow-sm"
                    >
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Chi tiết yêu cầu Dialog */}
      <Dialog open={!!selectedReq && !isRejectDialogOpen} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <DialogContent className="max-w-3xl rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Chi tiết yêu cầu xác thực tài xế</DialogTitle>
          </DialogHeader>
          
          {selectedReq && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Cột Trái: Ảnh GPLX và Đăng ký xe */}
              <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2">
                <div>
                  <h4 className="text-[13px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    1. Bằng lái xe (GPLX)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Mặt trước</span>
                      <div className="aspect-[4/3] bg-gray-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                        <img 
                          src={getImageUrl(selectedReq.licenseFrontImageUrl)} 
                          alt="Mặt trước bằng lái" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Mặt sau</span>
                      <div className="aspect-[4/3] bg-gray-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                        <img 
                          src={getImageUrl(selectedReq.licenseBackImageUrl)} 
                          alt="Mặt sau bằng lái" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-[13px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    2. Giấy đăng ký xe (Cà vẹt)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Mặt trước</span>
                      <div className="aspect-[4/3] bg-gray-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                        <img 
                          src={getImageUrl(selectedReq.registrationFrontImageUrl)} 
                          alt="Mặt trước đăng ký" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Mặt sau</span>
                      <div className="aspect-[4/3] bg-gray-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
                        <img 
                          src={getImageUrl(selectedReq.registrationBackImageUrl)} 
                          alt="Mặt sau đăng ký" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cột Phải: Thông tin đối chiếu */}
              <div className="space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[13px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                      Thông tin cá nhân
                    </h4>
                    <p className="font-bold text-lg text-gray-800 dark:text-zinc-100">
                      {selectedReq.user.firstName} {selectedReq.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-zinc-300 mt-1">{selectedReq.user.email}</p>
                    <p className="text-sm text-gray-600 dark:text-zinc-300 mt-0.5">{selectedReq.user.phone || 'Chưa cập nhật SĐT'}</p>
                  </div>
                  
                  <div className="p-5 bg-gray-50 dark:bg-zinc-900/60 rounded-[16px] border border-gray-100 dark:border-zinc-800">
                    <h4 className="text-[13px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                      Thông tin phương tiện
                    </h4>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div className="text-gray-500">Phân loại:</div>
                      <div className="font-bold text-gray-800 dark:text-zinc-100">
                        {selectedReq.vehicleType === 'BIKE' ? 'Xe máy' : 'Ô tô'}
                      </div>
                      <div className="text-gray-500">Biển số:</div>
                      <div className="font-bold text-gray-800 dark:text-zinc-100 uppercase tracking-wider">
                        {selectedReq.vehiclePlate}
                      </div>
                      <div className="text-gray-500">Mẫu xe:</div>
                      <div className="font-semibold text-gray-800 dark:text-zinc-200">
                        {selectedReq.vehicleModel || 'Không có'}
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex space-x-2 justify-end pt-4 border-t border-gray-50 dark:border-zinc-800">
                  <Button 
                    variant="outline" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 rounded-lg"
                    onClick={() => setIsRejectDialogOpen(true)}
                    disabled={isProcessing}
                    id="btn-kyc-reject"
                  >
                    Từ chối
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6"
                    onClick={() => selectedReq && handleApprove(selectedReq.id)}
                    disabled={isProcessing}
                    id="btn-kyc-approve"
                  >
                    Duyệt tài khoản
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog từ chối */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Từ chối yêu cầu xác thực tài xế</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Vui lòng cung cấp lý do cụ thể từ chối để người dùng nhận biết và chỉnh sửa lại hồ sơ phù hợp.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="rejection-reason" className="font-semibold">Lý do từ chối</Label>
            <Input 
              id="rejection-reason" 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ví dụ: Ảnh bằng lái bị mờ, thông tin biển số không trùng khớp..."
              className="mt-2 rounded-lg"
            />
          </div>

          <DialogFooter className="space-x-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setIsRejectDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" className="rounded-lg" onClick={handleRejectSubmit} disabled={isProcessing}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
