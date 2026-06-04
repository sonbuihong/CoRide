'use client';

import React, { useState, useEffect } from 'react';
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
import { Loader2, ShieldAlert } from 'lucide-react';

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
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const backendHost = apiBase.replace('/api', '');
    return `${backendHost}${url}`;
  };

  useEffect(() => {
    if (!authLoading && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/driver-verifications');
      setRequests(res.data.data);
    } catch (error) {
      toast.error('Không thể tải danh sách yêu cầu xét duyệt');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-[#1d1d1f]" />
        <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Duyệt Tài xế (KYC)</h1>
      </div>

      <div className="bg-white rounded-[16px] shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Ngày gửi</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email / SĐT</TableHead>
              <TableHead>Phương tiện</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                  Không có yêu cầu nào đang chờ duyệt.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell className="font-medium">{req.user.firstName} {req.user.lastName}</TableCell>
                  <TableCell>
                    {req.user.email}<br/>
                    <span className="text-xs text-gray-500">{req.user.phone || 'Chưa cập nhật SĐT'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold uppercase">{req.vehiclePlate}</span><br/>
                    <span className="text-xs text-gray-500">
                      {req.vehicleType === 'BIKE' ? '🏍️ Xe máy' : '🚗 Ô tô'} - {req.vehicleModel || 'Không rõ'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedReq(req)}>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu xác thực</DialogTitle>
          </DialogHeader>
          
          {selectedReq && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">1. Bằng lái xe (GPLX)</h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <span className="text-xs text-gray-400">Mặt trước</span>
                      <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border">
                        <img src={getImageUrl(selectedReq.licenseFrontImageUrl)} alt="License Front" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Mặt sau</span>
                      <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border">
                        <img src={getImageUrl(selectedReq.licenseBackImageUrl)} alt="License Back" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">2. Giấy đăng ký xe (Cà vẹt)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-400">Mặt trước</span>
                      <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border">
                        <img src={getImageUrl(selectedReq.registrationFrontImageUrl)} alt="Reg Front" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Mặt sau</span>
                      <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border">
                        <img src={getImageUrl(selectedReq.registrationBackImageUrl)} alt="Reg Back" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Thông tin người dùng</h4>
                  <p className="font-medium">{selectedReq.user.firstName} {selectedReq.user.lastName}</p>
                  <p className="text-sm">{selectedReq.user.email}</p>
                  <p className="text-sm">{selectedReq.user.phone}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Thông tin phương tiện</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-gray-500">Phân loại:</div>
                    <div className="text-sm font-bold">{selectedReq.vehicleType === 'BIKE' ? '🏍️ Xe máy' : '🚗 Ô tô'}</div>
                    <div className="text-sm text-gray-500">Biển số:</div>
                    <div className="text-sm font-bold uppercase">{selectedReq.vehiclePlate}</div>
                    <div className="text-sm text-gray-500">Mẫu xe:</div>
                    <div className="text-sm">{selectedReq.vehicleModel || 'Không có'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setIsRejectDialogOpen(true)}
              disabled={isProcessing}
            >
              Từ chối
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => selectedReq && handleApprove(selectedReq.id)}
              disabled={isProcessing}
            >
              Duyệt tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog từ chối */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu</DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp lý do từ chối để người dùng có thể cập nhật lại thông tin chính xác.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="reason">Lý do từ chối</Label>
            <Input 
              id="reason" 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="VD: Ảnh bằng lái bị mờ, không rõ biển số xe..."
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={isProcessing}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
