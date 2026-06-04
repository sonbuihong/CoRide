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
  ChevronLeft, 
  ChevronRight,
  ArrowUpRight, 
  ArrowDownLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  createdAt: string;
  wallet: {
    user: {
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTransactions = async (page = 1) => {
    try {
      const response = await apiClient.get(`/admin/transactions?page=${page}&limit=10`);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách giao dịch:', error);
      toast.error('Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm) {
      fetchTransactions();
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get(`/admin/transactions?search=${searchTerm}`);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      toast.error('Không thể tìm kiếm giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-500">Thành công</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500 text-white">Chờ xử lý</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Thất bại</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
                Quản lý Giao dịch
              </h1>
              <p className="text-sm text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                Tổng số: {pagination?.total || 0} giao dịch
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
                placeholder="Tìm kiếm theo người dùng, loại giao dịch..."
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

        {/* Transactions Table */}
        <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f5f5f7] dark:bg-[#2d2d2f]">
                <TableHead className="font-semibold">Mã giao dịch</TableHead>
                <TableHead className="font-semibold">Người dùng</TableHead>
                <TableHead className="font-semibold">Loại</TableHead>
                <TableHead className="font-semibold">Số tiền</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="font-semibold">Thời gian</TableHead>
                <TableHead className="font-semibold">Mô tả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                    Không có giao dịch nào
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-[#f5f5f7]/50 dark:hover:bg-[#2d2d2f]/50">
                    <TableCell className="font-mono text-xs">{tx.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{tx.wallet.user.firstName} {tx.wallet.user.lastName}</span>
                        <span className="text-xs text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">{tx.wallet.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {tx.amount > 0 ? (
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDownLeft className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-xs font-semibold">{tx.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className={tx.amount > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs" title={tx.description}>
                      {tx.description}
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
                  onClick={() => fetchTransactions(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchTransactions(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
