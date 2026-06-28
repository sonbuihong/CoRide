'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportedId: string;
  rideId?: string;
  reportedName: string;
}

const PREDEFINED_REASONS = [
  'Tài xế lái xe không an toàn',
  'Thái độ không phù hợp',
  'Chuyến đi không đúng lộ trình',
  'Thu thêm phí ngoài hệ thống',
  'Khác'
];

export function ReportDialog({ isOpen, onClose, reportedId, rideId, reportedName }: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Vui lòng chọn hoặc nhập lý do báo cáo');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/reports', {
        reportedId,
        rideId,
        reason,
        description,
      });
      toast.success('Gửi báo cáo thành công. Chúng tôi sẽ xử lý sớm nhất có thể.');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl text-red-600">
            <ShieldAlert className="w-6 h-6 mr-2" />
            Báo cáo {reportedName}
          </DialogTitle>
          <DialogDescription>
            Hệ thống sẽ ghi nhận và xử lý nghiêm các trường hợp vi phạm quy định cộng đồng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">Lý do báo cáo</label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_REASONS.map((r, index) => (
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
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">Chi tiết thêm (tùy chọn)</label>
            <textarea
              className="w-full h-24 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors resize-none"
              placeholder="Mô tả chi tiết sự việc..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
            Hủy
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={loading} 
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Gửi báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
