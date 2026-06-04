'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  X, 
  Loader2,
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookingActionButtonsProps {
  bookingId: string;
  status: string;
  onRefresh: () => void;
}

export const BookingActionButtons = ({ bookingId, status, onRefresh }: BookingActionButtonsProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpdateStatus = async (newStatus: 'CONFIRMED' | 'REJECTED') => {
    setLoading(newStatus);
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(newStatus === 'CONFIRMED' ? 'Đã xác nhận đặt chỗ thành công' : 'Đã từ chối yêu cầu đặt chỗ');
      onRefresh();
    } catch (error: unknown) {
      toast.error(((error as { response?: { data?: { message?: string } } }).response)?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setLoading(null);
    }
  };

  if (status !== 'PENDING') return null;

  return (
    <div className="flex items-center gap-2">
      <Button 
        size="sm" 
        className="bg-green-600 hover:bg-green-700 text-white"
        disabled={loading !== null}
        onClick={() => handleUpdateStatus('CONFIRMED')}
      >
        {loading === 'CONFIRMED' ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Check className="h-4 w-4 mr-1" />
        )}
        Duyệt
      </Button>

      <AlertDialog>
        <AlertDialogTrigger>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-destructive border-destructive hover:bg-destructive/10"
            disabled={loading !== null}
          >
            <X className="h-4 w-4 mr-1" />
            Từ chối
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Xác nhận từ chối
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn từ chối yêu cầu đặt chỗ này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bỏ qua</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleUpdateStatus('REJECTED')}
              className="bg-destructive hover:bg-destructive/90"
            >
              Từ chối yêu cầu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
