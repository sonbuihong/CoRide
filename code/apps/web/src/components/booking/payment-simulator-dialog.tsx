import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface PaymentSimulatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onPaymentSuccess: () => void;
}

export function PaymentSimulatorDialog({ isOpen, onClose, bookingId, onPaymentSuccess }: PaymentSimulatorDialogProps) {
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<{ qrUrl: string; amount: number; description: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSuccess(false);
      setProcessing(false);
      apiClient.get(`/payments/simulator/qr/${bookingId}`)
        .then(res => setQrData(res.data.data))
        .catch(err => {
          toast.error('Không thể lấy mã QR thanh toán');
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, bookingId]);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      await apiClient.post('/payments/simulator/confirm', { id: bookingId });
      // Giao diện chuyển sang màn hình đang xử lý
      // Đợi 3.5 giây để khớp với thời gian bên server
      setTimeout(() => {
        setProcessing(false);
        setSuccess(true);
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 1500);
      }, 3500);
    } catch (error) {
      toast.error('Lỗi khi xác nhận thanh toán');
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !processing && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Thanh toán chuyển khoản</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4 min-h-[300px]">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
          ) : success ? (
            <div className="flex flex-col items-center text-green-600 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-bold">Thanh toán thành công!</h3>
              <p className="text-sm text-gray-500 mt-2">Đang cập nhật trạng thái chuyến đi...</p>
            </div>
          ) : processing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#0071e3] mb-4" />
              <p className="text-gray-600 animate-pulse font-medium">Đang chờ xác nhận từ ngân hàng...</p>
              <p className="text-sm text-gray-400 mt-2">Vui lòng không đóng cửa sổ này</p>
            </div>
          ) : qrData ? (
            <div className="flex flex-col items-center w-full">
              <div className="bg-gray-50 p-4 rounded-xl mb-6 w-full text-center border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Số tiền cần thanh toán</p>
                <p className="text-3xl font-bold text-[#0071e3]">{qrData.amount.toLocaleString('vi-VN')}đ</p>
              </div>
              
              <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                <img src={qrData.qrUrl} alt="QR Code" className="w-64 h-64 object-contain" />
              </div>

              <Button 
                className="w-full h-12 text-[16px] font-semibold bg-[#0071e3] hover:bg-[#0071e3]/90 rounded-full text-white"
                onClick={handleConfirm}
              >
                Tôi đã thanh toán
              </Button>
            </div>
          ) : (
            <p className="text-red-500">Lỗi tải dữ liệu QR</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
