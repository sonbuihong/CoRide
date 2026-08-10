'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import apiClient from '../../lib/api-client';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Vui lòng nhập email');
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi gửi email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) return setError('Vui lòng nhập đủ mã OTP và mật khẩu mới');
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1d1d1f] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)]">
        {step === 1 && (
          <div>
            <div className="mb-6">
              <Link href="/login" className="inline-flex items-center text-sm font-medium text-[#0071e3] hover:text-[#005ea6] transition-colors mb-4">
                <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quên mật khẩu?</h1>
              <p className="text-gray-500 mt-2 text-sm">Nhập email của bạn để nhận mã xác minh OTP.</p>
            </div>
            <form onSubmit={handleSendOtp} className="space-y-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0071e3] text-white py-3 rounded-full font-medium hover:bg-[#0077ED] transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi mã OTP'}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-6">
              <button onClick={() => setStep(1)} className="inline-flex items-center text-sm font-medium text-[#0071e3] hover:text-[#005ea6] transition-colors mb-4">
                <ArrowLeft className="w-4 h-4 mr-1" /> Đổi email
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đặt lại mật khẩu</h1>
              <p className="text-gray-500 mt-2 text-sm">Nhập mã OTP gồm 6 chữ số được gửi đến <span className="font-medium text-gray-900 dark:text-gray-300">{email}</span></p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mã OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3] tracking-widest text-center text-lg font-mono"
                  placeholder="------"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  placeholder="Ít nhất 8 ký tự"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0071e3] text-white py-3 rounded-full font-medium hover:bg-[#0077ED] transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thành công!</h1>
            <p className="text-gray-500 mb-8">Mật khẩu của bạn đã được đặt lại thành công.</p>
            <Link href="/login" className="block w-full bg-[#0071e3] text-white py-3 rounded-full font-medium hover:bg-[#0077ED] transition-colors">
              Đăng nhập ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
