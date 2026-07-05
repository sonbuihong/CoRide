'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface Transaction {
  id: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'RECEIVE_PAYMENT' | 'REFUND';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  description: string | null;
  createdAt: string;
}

interface WalletData {
  rideBalance: number;
  driverEarnings: number;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        setLoading(true);
        // Note: Assuming API prefix is /api, and client automatically prepends it or it's handled in apiClient
        const res = await apiClient.get('/payments/wallet');
        setWallet(res.data.data.wallet);
        setTransactions(res.data.data.transactions);
      } catch (err: any) {
        console.error('Lỗi khi tải thông tin ví:', err);
        setError('Không thể tải thông tin ví. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletInfo();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getTransactionIcon = (type: Transaction['type'], status: Transaction['status']) => {
    if (status === 'FAILED') return <XCircle className="h-5 w-5 text-[#ff3b30]" />;
    if (status === 'PENDING') return <Clock className="h-5 w-5 text-[#ff9500]" />;
    
    switch (type) {
      case 'DEPOSIT':
      case 'RECEIVE_PAYMENT':
      case 'REFUND':
        return <ArrowDownToLine className="h-5 w-5 text-[#34c759]" />;
      case 'WITHDRAWAL':
      case 'PAYMENT':
        return <ArrowUpFromLine className="h-5 w-5 text-[#ff3b30]" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-[#34c759]" />;
    }
  };

  const getTransactionTitle = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT': return 'Nạp tiền';
      case 'WITHDRAWAL': return 'Rút tiền';
      case 'PAYMENT': return 'Thanh toán chuyến đi';
      case 'RECEIVE_PAYMENT': return 'Nhận tiền cước';
      case 'REFUND': return 'Hoàn tiền';
      default: return 'Giao dịch';
    }
  };

  const isPositive = (type: Transaction['type']) => {
    return ['DEPOSIT', 'RECEIVE_PAYMENT', 'REFUND'].includes(type);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0071e3]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24 flex flex-col items-center justify-center space-y-4">
        <p className="text-[17px] text-[#1d1d1f] dark:text-white">{error}</p>
        <Link href="/profile">
          <button className="bg-[#0071e3] text-white px-6 py-2 rounded-[980px] text-[14px] font-medium hover:bg-[#0077ED] transition-colors">
            Quay lại Hồ sơ
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24 transition-colors duration-300">
      <div className="container max-w-[680px] mx-auto px-4 space-y-8 animate-in fade-in duration-500">
        
        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <Link href="/profile">
            <button className="flex items-center text-[14px] font-medium text-[#0071e3] transition-colors hover:text-[#005ea6] group">
              <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Tài khoản
            </button>
          </Link>
        </div>

        {/* Page Title */}
        <h1 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.28px] leading-[1.07] text-[#1d1d1f] dark:text-white mb-2">
          Ví điện tử.
        </h1>

        <div className="space-y-6">
          
          {/* Balances Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Ride Balance Card */}
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                <Wallet className="w-24 h-24" />
              </div>
              <h3 className="text-[14px] font-medium text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] mb-2">
                Số dư đi xe (Hành khách)
              </h3>
              <p className="text-[34px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-6">
                {formatCurrency(wallet?.rideBalance || 0)}
              </p>
              <button 
                onClick={() => alert('Chức năng Nạp tiền đang được phát triển')}
                className="w-full bg-[#0071e3] text-white px-4 py-2.5 rounded-[980px] text-[14px] font-medium hover:bg-[#0077ED] transition-colors flex items-center justify-center gap-2"
              >
                <ArrowDownToLine className="w-4 h-4" />
                Nạp tiền
              </button>
            </div>

            {/* Driver Earnings Card */}
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] relative overflow-hidden">
              <h3 className="text-[14px] font-medium text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] mb-2">
                Thu nhập tài xế
              </h3>
              <p className="text-[34px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-6">
                {formatCurrency(wallet?.driverEarnings || 0)}
              </p>
              <button 
                onClick={() => alert('Chức năng Rút tiền đang được phát triển')}
                className="w-full bg-[#1d1d1f] text-white dark:bg-[#f5f5f7] dark:text-[#1d1d1f] px-4 py-2.5 rounded-[980px] text-[14px] font-medium hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
              >
                <ArrowUpFromLine className="w-4 h-4" />
                Rút tiền
              </button>
            </div>

          </div>

          {/* Transactions History */}
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)]">
            <h3 className="text-[21px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-6">
              Lịch sử giao dịch
            </h3>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                Chưa có giao dịch nào
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 -mx-3 rounded-[12px] hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center group-hover:bg-white dark:group-hover:bg-[#3a3a3c] transition-colors">
                        {getTransactionIcon(tx.type, tx.status)}
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-[#1d1d1f] dark:text-white">
                          {getTransactionTitle(tx.type)}
                        </p>
                        <p className="text-[12px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] line-clamp-1 max-w-[200px] md:max-w-[300px]">
                          {tx.description || new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div className="flex flex-col items-end">
                        <p className={`text-[14px] font-semibold ${isPositive(tx.type) ? 'text-[#34c759]' : 'text-[#1d1d1f] dark:text-white'}`}>
                          {isPositive(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-[12px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                          {tx.status === 'PENDING' ? 'Đang xử lý' : tx.status === 'FAILED' ? 'Thất bại' : 'Thành công'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[rgba(0,0,0,0.3)] dark:text-[rgba(255,255,255,0.3)]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
