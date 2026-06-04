/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Navigation, MapPin } from 'lucide-react';

interface StructuredAddressInputProps {
  prefix: 'origin' | 'dest';
  onAddressChange: (address: {
    houseNumber?: string;
    street?: string;
    ward?: string;
    district?: string;
    province: string;
    addressType?: 'OLD' | 'NEW';
    fullAddress: string;
    lat?: number;
    lng?: number;
  }) => void;
  detailLevel?: 'FULL' | 'WARD' | 'DISTRICT';
  className?: string;
  onMapSelect?: () => void;
}

const VIETNAM_PROVINCES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
];

export const StructuredAddressInput: React.FC<StructuredAddressInputProps> = ({
  prefix,
  onAddressChange,
  detailLevel = 'FULL',
  className,
  onMapSelect,
}) => {
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [addressType, setAddressType] = useState<'OLD' | 'NEW'>('NEW');
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);

  const generateFullAddress = () => {
    const parts: string[] = [];
    if (houseNumber) parts.push(houseNumber);
    if (street) parts.push(street);
    if (ward) parts.push(ward);
    if (district) parts.push(district);
    if (province) parts.push(province);
    return parts.join(', ');
  };

  useEffect(() => {
    const fullAddress = generateFullAddress();
    onAddressChange({
      houseNumber: houseNumber || undefined,
      street: street || undefined,
      ward: ward || undefined,
      district: district || undefined,
      province: province || '',
      addressType,
      fullAddress,
    });
  }, [houseNumber, street, ward, district, province, addressType]);

  const isFieldVisible = (field: 'houseNumber' | 'street' | 'ward' | 'district') => {
    if (detailLevel === 'FULL') return true;
    if (detailLevel === 'WARD') return field === 'ward' || field === 'district';
    if (detailLevel === 'DISTRICT') return field === 'district';
    return false;
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }
    setIsLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { reverseGeocodeStructured } = await import('@/lib/goong');
          const addressData = await reverseGeocodeStructured(coords.latitude, coords.longitude);
          
          if (addressData) {
            // Set form fields from structured data
            setProvince(addressData.province || '');
            setDistrict(addressData.district || '');
            setWard(addressData.ward || '');
            setStreet(addressData.street || '');
            setHouseNumber(addressData.houseNumber || '');
            
            onAddressChange({
              houseNumber: addressData.houseNumber || undefined,
              street: addressData.street || undefined,
              ward: addressData.ward || undefined,
              district: addressData.district || undefined,
              province: addressData.province || '',
              addressType: 'NEW',
              fullAddress: addressData.fullAddress,
              lat: coords.latitude,
              lng: coords.longitude,
            });
          }
        } catch (err) {
          console.error('[StructuredAddressInput] Lỗi định vị:', err);
          alert('Không thể lấy vị trí hiện tại.');
        } finally {
          setIsLoadingGPS(false);
        }
      },
      (err) => {
        console.error('[StructuredAddressInput] Lỗi định vị:', err);
        alert('Không thể lấy vị trí hiện tại.');
        setIsLoadingGPS(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* GPS and Map Selection Buttons */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLoadingGPS}
          className="flex-1 h-[40px] rounded-[8px] bg-[#fafafc] border border-[rgba(0,0,0,0.08)] flex items-center justify-center hover:border-[rgba(0,0,0,0.12)] transition-colors dark:bg-[rgba(255,255,255,0.05)] dark:border-[rgba(255,255,255,0.05)]"
        >
          <Navigation className={cn('mr-2 h-4 w-4 text-[#0071e3]', isLoadingGPS && 'animate-pulse')} />
          <span className="text-[15px] text-[#1d1d1f] dark:text-white">
            {isLoadingGPS ? 'Đang lấy vị trí...' : 'Lấy vị trí GPS'}
          </span>
        </button>
        {onMapSelect && (
          <button
            type="button"
            onClick={onMapSelect}
            className="flex-1 h-[40px] rounded-[8px] bg-[#fafafc] border border-[rgba(0,0,0,0.08)] flex items-center justify-center hover:border-[rgba(0,0,0,0.12)] transition-colors dark:bg-[rgba(255,255,255,0.05)] dark:border-[rgba(255,255,255,0.05)]"
          >
            <MapPin className="mr-2 h-4 w-4 text-[#0071e3]" />
            <span className="text-[15px] text-[#1d1d1f] dark:text-white">Chọn trên bản đồ</span>
          </button>
        )}
      </div>

      {/* Detail Level Selector */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => { setHouseNumber(''); setStreet(''); setWard(''); setDistrict(''); }}
          className={cn(
            'px-3 py-1.5 text-xs rounded-md transition-colors',
            detailLevel === 'FULL'
              ? 'bg-[#0071e3] text-white'
              : 'bg-[#fafafc] text-[#1d1d1f] border border-[rgba(0,0,0,0.08)]'
          )}
        >
          Đầy đủ
        </button>
        <button
          type="button"
          onClick={() => { setHouseNumber(''); setStreet(''); setWard(''); }}
          className={cn(
            'px-3 py-1.5 text-xs rounded-md transition-colors',
            detailLevel === 'WARD'
              ? 'bg-[#0071e3] text-white'
              : 'bg-[#fafafc] text-[#1d1d1f] border border-[rgba(0,0,0,0.08)]'
          )}
        >
          Xã/Phường
        </button>
        <button
          type="button"
          onClick={() => { setHouseNumber(''); setStreet(''); setWard(''); setDistrict(''); }}
          className={cn(
            'px-3 py-1.5 text-xs rounded-md transition-colors',
            detailLevel === 'DISTRICT'
              ? 'bg-[#0071e3] text-white'
              : 'bg-[#fafafc] text-[#1d1d1f] border border-[rgba(0,0,0,0.08)]'
          )}
        >
          Huyện/Quận
        </button>
      </div>

      {/* Province (Required) */}
      <div className="space-y-1">
        <Label htmlFor={`${prefix}-province`} className="text-[14px] font-semibold text-[#1d1d1f] tracking-[-0.22px] mb-1 block dark:text-white">
          Tỉnh/Thành phố *
        </Label>
        <select
          id={`${prefix}-province`}
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="w-full h-[48px] rounded-[11px] bg-[#fafafc] border-[3px] border-[rgba(0,0,0,0.04)] px-4 text-[17px] text-[#1d1d1f] transition-all hover:border-[rgba(0,0,0,0.08)] focus-visible:ring-0 focus-visible:border-transparent focus-visible:outline-none focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 dark:bg-[rgba(255,255,255,0.05)] dark:text-white dark:border-[rgba(255,255,255,0.05)]"
          required
        >
          <option value="">Chọn tỉnh/Thành phố</option>
          {VIETNAM_PROVINCES.map((prov) => (
            <option key={prov} value={prov}>
              {prov}
            </option>
          ))}
        </select>
      </div>

      {/* District */}
      {isFieldVisible('district') && (
        <div className="space-y-1">
          <Label htmlFor={`${prefix}-district`} className="text-[14px] font-semibold text-[#1d1d1f] tracking-[-0.22px] mb-1 block dark:text-white">
            Huyện/Quận
          </Label>
          <input
            id={`${prefix}-district`}
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Nhập huyện/quận"
            className="w-full h-[48px] rounded-[11px] bg-[#fafafc] border-[3px] border-[rgba(0,0,0,0.04)] px-4 text-[17px] text-[#1d1d1f] transition-all hover:border-[rgba(0,0,0,0.08)] focus-visible:ring-0 focus-visible:border-transparent focus-visible:outline-none focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 dark:bg-[rgba(255,255,255,0.05)] dark:text-white dark:border-[rgba(255,255,255,0.05)]"
          />
        </div>
      )}

      {/* Ward */}
      {isFieldVisible('ward') && (
        <div className="space-y-1">
          <Label htmlFor={`${prefix}-ward`} className="text-[14px] font-semibold text-[#1d1d1f] tracking-[-0.22px] mb-1 block dark:text-white">
            Xã/Phường
          </Label>
          <input
            id={`${prefix}-ward`}
            type="text"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            placeholder="Nhập xã/phường"
            className="w-full h-[48px] rounded-[11px] bg-[#fafafc] border-[3px] border-[rgba(0,0,0,0.04)] px-4 text-[17px] text-[#1d1d1f] transition-all hover:border-[rgba(0,0,0,0.08)] focus-visible:ring-0 focus-visible:border-transparent focus-visible:outline-none focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 dark:bg-[rgba(255,255,255,0.05)] dark:text-white dark:border-[rgba(255,255,255,0.05)]"
          />
        </div>
      )}

      {/* Street */}
      {isFieldVisible('street') && (
        <div className="space-y-1">
          <Label htmlFor={`${prefix}-street`} className="text-[14px] font-semibold text-[#1d1d1f] tracking-[-0.22px] mb-1 block dark:text-white">
            Tên đường
          </Label>
          <input
            id={`${prefix}-street`}
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Nhập tên đường"
            className="w-full h-[48px] rounded-[11px] bg-[#fafafc] border-[3px] border-[rgba(0,0,0,0.04)] px-4 text-[17px] text-[#1d1d1f] transition-all hover:border-[rgba(0,0,0,0.08)] focus-visible:ring-0 focus-visible:border-transparent focus-visible:outline-none focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 dark:bg-[rgba(255,255,255,0.05)] dark:text-white dark:border-[rgba(255,255,255,0.05)]"
          />
        </div>
      )}

      {/* House Number */}
      {isFieldVisible('houseNumber') && (
        <div className="space-y-1">
          <Label htmlFor={`${prefix}-housenumber`} className="text-[14px] font-semibold text-[#1d1d1f] tracking-[-0.22px] mb-1 block dark:text-white">
            Số nhà
          </Label>
          <input
            id={`${prefix}-housenumber`}
            type="text"
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            placeholder="Nhập số nhà"
            className="w-full h-[48px] rounded-[11px] bg-[#fafafc] border-[3px] border-[rgba(0,0,0,0.04)] px-4 text-[17px] text-[#1d1d1f] transition-all hover:border-[rgba(0,0,0,0.08)] focus-visible:ring-0 focus-visible:border-transparent focus-visible:outline-none focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 dark:bg-[rgba(255,255,255,0.05)] dark:text-white dark:border-[rgba(255,255,255,0.05)]"
          />
        </div>
      )}

      {/* Address Type Toggle (for province mergers) */}
      <div className="space-y-1">
        <Label className="text-[14px] font-semibold text-[#1d1d1f] tracking-[-0.22px] mb-1 block dark:text-white">
          Loại địa chỉ
        </Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAddressType('NEW')}
            className={cn(
              'flex-1 h-[40px] rounded-[8px] text-[15px] transition-colors',
              addressType === 'NEW'
                ? 'bg-[#0071e3] text-white'
                : 'bg-[#fafafc] text-[#1d1d1f] border border-[rgba(0,0,0,0.08)]'
            )}
          >
            Địa chỉ mới
          </button>
          <button
            type="button"
            onClick={() => setAddressType('OLD')}
            className={cn(
              'flex-1 h-[40px] rounded-[8px] text-[15px] transition-colors',
              addressType === 'OLD'
                ? 'bg-[#0071e3] text-white'
                : 'bg-[#fafafc] text-[#1d1d1f] border border-[rgba(0,0,0,0.08)]'
            )}
          >
            Địa chỉ cũ
          </button>
        </div>
      </div>
    </div>
  );
};
