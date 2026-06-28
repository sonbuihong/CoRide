'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '../../../lib/api-client';
import { Loader2, ArrowLeft, Plus, Trash2, Car, Bike } from 'lucide-react';
import Link from 'next/link';

interface Vehicle {
  id: string;
  licensePlate: string;
  type: 'BIKE' | 'CAR';
  color?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ licensePlate: '', type: 'BIKE', color: '', imageUrl: '' });
  const [uploadingImg, setUploadingImg] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadingImg(true);
    try {
      const res = await apiClient.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewVehicle({ ...newVehicle, imageUrl: res.data.url });
    } catch (err) {
      console.error('Lỗi upload ảnh xe:', err);
      alert('Không thể tải ảnh. Vui lòng thử lại.');
    } finally {
      setUploadingImg(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await apiClient.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách xe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/vehicles', newVehicle);
      setIsAdding(false);
      setNewVehicle({ licensePlate: '', type: 'BIKE', color: '', imageUrl: '' });
      fetchVehicles();
    } catch (err) {
      console.error('Lỗi khi thêm xe:', err);
      alert('Có lỗi xảy ra khi thêm xe');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phương tiện này?')) return;
    try {
      await apiClient.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      console.error('Lỗi khi xóa xe:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f5f7] dark:bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24">
      <div className="container max-w-[680px] mx-auto px-4 space-y-8">
        <div className="flex items-center space-x-2">
          <Link href="/profile">
            <button className="flex items-center text-[14px] font-medium text-[#0071e3] transition-colors hover:text-[#005ea6] group">
              <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Tài khoản
            </button>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-[40px] md:text-[48px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white leading-none">
            Phương tiện
          </h1>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-[#0071e3] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#0077ED] transition-colors"
          >
            <Plus className="h-4 w-4" /> Thêm xe
          </button>
        </div>

        {isAdding && (
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 shadow-sm border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)]">
            <h3 className="text-lg font-semibold mb-4">Thêm phương tiện mới</h3>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Biển số xe</label>
                <input
                  required
                  value={newVehicle.licensePlate}
                  onChange={(e) => setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white"
                  placeholder="VD: 29A-12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại xe</label>
                <select
                  value={newVehicle.type}
                  onChange={(e) => setNewVehicle({...newVehicle, type: e.target.value as 'BIKE' | 'CAR'})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white"
                >
                  <option value="BIKE">Xe máy</option>
                  <option value="CAR">Ô tô</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Màu sắc (Tùy chọn)</label>
                <input
                  value={newVehicle.color}
                  onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white"
                  placeholder="VD: Đen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ảnh xe (Tùy chọn)</label>
                <div className="flex items-center gap-4">
                  {newVehicle.imageUrl && (
                    <img src={newVehicle.imageUrl} alt="Xe" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImg}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploadingImg && <p className="text-sm text-blue-500 mt-1">Đang tải ảnh lên...</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Hủy</button>
                <button type="submit" className="bg-[#0071e3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0077ED]">Lưu phương tiện</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {vehicles.length === 0 && !isAdding ? (
            <p className="text-center text-gray-500 py-8">Bạn chưa thêm phương tiện nào.</p>
          ) : (
            vehicles.map((v) => (
              <div key={v.id} className="bg-white dark:bg-[#1d1d1f] rounded-[20px] p-5 shadow-sm border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300">
                    {v.type === 'CAR' ? <Car className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold dark:text-white">{v.licensePlate}</h4>
                    <p className="text-sm text-gray-500">{v.type === 'CAR' ? 'Ô tô' : 'Xe máy'} {v.color ? `• ${v.color}` : ''}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteVehicle(v.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                  title="Xóa xe"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
