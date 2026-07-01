'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XCircle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface CancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  type: 'ride' | 'booking';
  onSuccess?: () => void;
}

export function CancelDialog({ isOpen, onClose, id, type, onSuccess }: CancelDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const predefinedReasons = type === 'ride' ? [
    'Xe gặp sự cố',
    'Kẹt xe / Thời tiết xấu',
    'Có việc đột xuất',
    'Khác'
  ] : [
    'Tôi đã tìm được xe khác',
    'Kế hoạch thay đổi',
    'Chờ quá lâu',
    'Khác'
  ];

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Vui lòng chọn hoặc nhập lý do hủy');
      return;
    }

    setLoading(true);
    try {
      if (type === 'ride') {
        await apiClient.patch(`/rides/${id}/status`, { status: 'CANCELLED', cancelReason: reason });
      } else {
        await apiClient.patch(`/bookings/${id}/cancel`, { cancelReason: reason });
      }
      
      toast.success('Đã hủy thành công');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể hủy lúc này');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl text-red-600">
            <XCircle className="w-6 h-6 mr-2" />
            {type === 'ride' ? 'Hủy chuyến đi' : 'Hủy đặt chỗ'}
          </DialogTitle>
          <DialogDescription>
            Hủy chuyến thường xuyên có thể ảnh hưởng đến đánh giá tài khoản của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">Lý do hủy</label>
            <div className="flex flex-wrap gap-2">
              {predefinedReasons.map((r, index) => (
                <button
                  key={index}
                  onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                    reason === r
                      ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-500/10 dark:border-red-500/50 dark:text-red-400 font-medium'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">Nhập lý do khác (nếu có)</label>
            <textarea
              className="w-full h-24 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors resize-none"
              placeholder="Lý do của bạn..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
            Quay lại
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={loading} 
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Xác nhận hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
