'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '../../../lib/api-client';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface Report {
  id: string;
  reporter: { id: string; firstName: string; lastName: string; email: string };
  reportedUser: { id: string; firstName: string; lastName: string; email: string };
  reason: string;
  description: string | null;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/reports');
      setReports(res.data.reports || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển trạng thái báo cáo thành ${status}?`)) return;
    try {
      await apiClient.patch(`/reports/${id}/resolve`, { status, actionTaken: 'Xử lý bởi Admin' });
      fetchReports();
    } catch (err) {
      console.error('Lỗi xử lý báo cáo:', err);
      alert('Có lỗi xảy ra khi xử lý báo cáo');
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Báo cáo</h1>
          <p className="text-gray-500">Xem và xử lý các báo cáo vi phạm từ người dùng.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Ngày tạo</th>
                    <th className="px-6 py-4 font-semibold">Người báo cáo</th>
                    <th className="px-6 py-4 font-semibold">Người bị báo cáo</th>
                    <th className="px-6 py-4 font-semibold">Lý do</th>
                    <th className="px-6 py-4 font-semibold">Trạng thái</th>
                    <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        Chưa có báo cáo nào
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 dark:text-white">{report.reporter.firstName} {report.reporter.lastName}</p>
                          <p className="text-xs text-gray-500">{report.reporter.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 dark:text-white">{report.reportedUser.firstName} {report.reportedUser.lastName}</p>
                          <p className="text-xs text-gray-500">{report.reportedUser.email}</p>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate" title={report.description || report.reason}>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{report.reason}</span>
                          {report.description && <p className="text-xs text-gray-500 truncate mt-1">{report.description}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${report.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : ''}
                            ${report.status === 'DISMISSED' ? 'bg-gray-100 text-gray-800' : ''}
                          `}>
                            {report.status === 'PENDING' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {report.status === 'RESOLVED' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {report.status === 'DISMISSED' && <XCircle className="w-3 h-3 mr-1" />}
                            {report.status === 'PENDING' ? 'Chờ xử lý' : report.status === 'RESOLVED' ? 'Đã giải quyết' : 'Bỏ qua'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {report.status === 'PENDING' && (
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => handleResolve(report.id, 'RESOLVED')}
                                className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition-colors"
                                title="Giải quyết"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleResolve(report.id, 'DISMISSED')}
                                className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                                title="Bỏ qua"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
