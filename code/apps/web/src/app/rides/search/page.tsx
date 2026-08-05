'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Heart, Map, Lightbulb, 
  Bus, Clock, Store, MoreVertical, MapPin, Building2
} from 'lucide-react';
import { reverseGeocodeDetailed, cleanAddressText, buildFullAddressFromDetail } from '@/lib/goong';

const mockLocations = [
  {
    id: '1',
    name: 'Bến Xe Nước Ngầm',
    address: '1 Đường Ngọc Hồi, Phường Yên Sở, Thành Phố Hà Nội, Việt Nam',
    distance: '7.04 km',
    type: 'bus'
  },
  {
    id: '2',
    name: 'Bến Xe Giáp Bát',
    address: 'Đường Giải Phóng, Phường Hoàng Mai, Thành Phố Hà Nội, Việt Nam',
    distance: '5.41 km',
    type: 'recent'
  },
  {
    id: '3',
    name: 'Lotte Mall Tây Hồ',
    address: '272 Đường Võ Chí Công, Phường Tây Hồ, Thành Phố Hà Nội, Việt Nam',
    distance: '7.31 km',
    type: 'store'
  },
  {
    id: '4',
    name: 'Bệnh viện Bạch Mai',
    address: '78 Đường Giải Phóng, Phường Kim Liên, Thành Phố Hà Nội, Việt Nam',
    distance: '3.27 km',
    type: 'hospital'
  },
  {
    id: '5',
    name: 'Bến Xe Gia Lâm',
    address: 'Phố Ngô Gia Khảm, Phường Bồ Đề, Thành Phố Hà Nội, Việt Nam',
    distance: '3.26 km',
    type: 'bus'
  }
];

export default function SearchPage() {
  const router = useRouter();
  const [originValue, setOriginValue] = useState('');
  const [destinationValue, setDestinationValue] = useState('');
  const [showMergedToggle, setShowMergedToggle] = useState(true);
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);
  const [isLoadingGps, setIsLoadingGps] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    
    setIsLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const result = await reverseGeocodeDetailed(coords.latitude, coords.longitude);
          if (result) {
            const fullAddress = buildFullAddressFromDetail({
              name: result.name,
              formatted_address: result.address,
            });
            const finalAddress = fullAddress || cleanAddressText(result.address);
            setGpsAddress(finalAddress);
          }
        } catch {
          console.warn('Không lấy được địa chỉ từ GPS');
        } finally {
          setIsLoadingGps(false);
        }
      },
      () => {
        setIsLoadingGps(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'bus': return <Bus className="h-5 w-5 text-[#1d1d1f] dark:text-white" strokeWidth={1.5} />;
      case 'recent': return <Clock className="h-5 w-5 text-[#1d1d1f] dark:text-white" strokeWidth={1.5} />;
      case 'store': return <Store className="h-5 w-5 text-[#1d1d1f] dark:text-white" strokeWidth={1.5} />;
      case 'hospital': return <Building2 className="h-5 w-5 text-[#1d1d1f] dark:text-white" strokeWidth={1.5} />;
      default: return <MapPin className="h-5 w-5 text-[#1d1d1f] dark:text-white" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black font-sans overflow-hidden w-full">
      
      {/* Left Sidebar */}
      <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black h-full flex-shrink-0 shadow-sm z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
           <h1 className="text-[22px] font-semibold text-[#1d1d1f] dark:text-white">Tìm kiếm điểm đến</h1>
           <button 
             onClick={() => router.back()}
             className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
           >
              <ArrowLeft className="h-5 w-5 text-[#1d1d1f] dark:text-white" />
           </button>
        </div>

        {/* Inputs */}
        <div className="px-4 py-2 flex flex-col gap-3">
          {/* Use current location */}
          <div className="flex items-center gap-3 w-full bg-[#f5f8fa] dark:bg-gray-900 hover:bg-[#eaf2f8] dark:hover:bg-gray-800 rounded-[20px] h-[52px] px-4 transition-colors focus-within:ring-2 focus-within:ring-[#0071e3]/20">
            <div className="h-2 w-2 rounded-full bg-[#0071e3] ml-1 flex-shrink-0"></div>
            <input 
              type="text"
              value={originValue}
              onChange={(e) => setOriginValue(e.target.value)}
              placeholder="Sử dụng vị trí hiện tại"
              className="flex-1 bg-transparent text-[15px] font-medium text-[#1d1d1f] dark:text-white placeholder:text-[#1d1d1f]/60 dark:placeholder:text-white/60 focus:outline-none text-ellipsis overflow-hidden whitespace-nowrap"
            />
          </div>
          
          {/* Search Input */}
          <div className="flex items-center gap-3 w-full border-[1.5px] border-[#0071e3] rounded-[20px] h-[52px] px-4 bg-white dark:bg-gray-900 shadow-[0_0_0_4px_rgba(0,113,227,0.05)] focus-within:ring-2 focus-within:ring-[#0071e3]/20">
            <MapPin className="h-5 w-5 text-[#ff3b30] flex-shrink-0" strokeWidth={2} />
            <input 
              type="text" 
              value={destinationValue}
              onChange={(e) => setDestinationValue(e.target.value)}
              placeholder="Bạn muốn đi đâu"
              className="flex-1 bg-transparent text-[15px] text-[#1d1d1f] dark:text-white placeholder:text-[#1d1d1f]/60 dark:placeholder:text-white/60 font-medium focus:outline-none text-ellipsis overflow-hidden whitespace-nowrap"
            />
          </div>
        </div>

        <div className="mx-4 my-2 h-[1px] bg-gray-100 dark:bg-gray-800"></div>

        {/* Menu Items */}
        <div className="px-3 py-2 flex flex-col gap-1.5 flex-1">
           <button className="flex items-center gap-4 w-full bg-[#f5f8fa] dark:bg-gray-800 rounded-[20px] h-[52px] px-4">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                 <Bus className="h-4 w-4 text-gray-600 dark:text-gray-300" strokeWidth={2} />
              </div>
              <span className="text-[15px] font-medium text-[#1d1d1f] dark:text-white">Địa điểm gần đây & Yêu thích</span>
           </button>

           <button className="flex items-center gap-4 w-full hover:bg-gray-50 dark:hover:bg-gray-900 rounded-[20px] h-[52px] px-4 transition-colors">
              <div className="h-8 w-8 rounded-full flex items-center justify-center">
                 <Heart className="h-5 w-5 text-[#ff3b30] fill-[#ff3b30]" />
              </div>
              <span className="text-[15px] font-medium text-[#1d1d1f] dark:text-white">Địa chỉ đã lưu</span>
           </button>

           <button className="flex items-center gap-4 w-full hover:bg-gray-50 dark:hover:bg-gray-900 rounded-[20px] h-[52px] px-4 transition-colors">
              <div className="h-8 w-8 rounded-full flex items-center justify-center">
                 <Map className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
              </div>
              <span className="text-[15px] font-medium text-[#1d1d1f] dark:text-white">Chọn trên bản đồ</span>
           </button>

           <div className="flex items-center justify-between w-full hover:bg-gray-50 dark:hover:bg-gray-900 rounded-[20px] h-[52px] px-4 transition-colors cursor-pointer" onClick={() => setShowMergedToggle(!showMergedToggle)}>
              <div className="flex items-center gap-4">
                 <div className="h-8 w-8 rounded-full flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
                 </div>
                 <span className="text-[15px] font-medium text-[#1d1d1f] dark:text-white">Hiển thị địa chỉ sau sáp nhập</span>
              </div>
              {/* Toggle Switch */}
              <div className={`w-[48px] h-[26px] rounded-full p-0.5 flex items-center transition-colors ${showMergedToggle ? 'bg-[#0071e3]' : 'bg-gray-300 dark:bg-gray-700'}`}>
                 <div className={`w-[22px] h-[22px] bg-white rounded-full shadow-sm transform transition-transform ${showMergedToggle ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
              </div>
           </div>
        </div>

        {/* Footer Area */}
        <div className="p-6 mt-auto">
           <p className="text-[15px] font-bold text-[#1d1d1f] dark:text-white mb-4">Không thấy địa điểm bạn cần?</p>
           <button className="w-full h-[52px] rounded-[16px] border border-gray-300 dark:border-gray-700 flex items-center justify-center text-[15px] font-semibold text-[#1d1d1f] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              Thêm ngay địa điểm mới
           </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="hidden md:flex flex-1 bg-[#fafafc] dark:bg-[#0a0a0c] flex-col py-10 px-8 lg:px-16 overflow-y-auto relative">
         <h2 className="text-[32px] font-bold text-[#1d1d1f] dark:text-white mb-8">Địa điểm gần đây & Yêu thích</h2>
         
         <div className="flex flex-col gap-3 max-w-4xl w-full">
            {/* Cards */}
            {mockLocations.map(loc => (
               <div key={loc.id} className="flex items-center p-4 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-800 rounded-[20px] hover:shadow-sm transition-all cursor-pointer">
                  {/* Icon Area */}
                  <div className="h-16 w-16 rounded-[16px] bg-[#eef3f7] dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mr-4 relative overflow-hidden">
                     {/* Map snippet pattern */}
                     <div className="absolute inset-0 opacity-40" 
                          style={{ 
                            backgroundImage: 'radial-gradient(circle at center, #94a3b8 1.5px, transparent 1.5px)', 
                            backgroundSize: '10px 10px' 
                          }}>
                     </div>
                     <div className="absolute inset-0 bg-blue-100/30 dark:bg-blue-900/10"></div>
                     <div className="absolute bottom-[-10px] right-[-10px] w-12 h-12 bg-green-200/40 dark:bg-green-800/20 rounded-full blur-md"></div>
                     <div className="absolute top-[-5px] left-[-15px] w-16 h-8 bg-blue-200/50 dark:bg-blue-800/30 rotate-45"></div>

                     <div className="relative z-10 bg-white dark:bg-[#2c2c2e] p-2.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100/50 dark:border-gray-700">
                        {getIconForType(loc.type)}
                     </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 pr-4">
                     <h3 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-white mb-1 leading-tight">{loc.name}</h3>
                     <p className="text-[14px] text-gray-500 line-clamp-2 leading-snug">{loc.address}</p>
                  </div>

                  {/* Actions & Distance */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                     <span className="text-[14px] font-medium text-[#1d1d1f] dark:text-white px-2">{loc.distance}</span>
                     <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Heart className="h-[22px] w-[22px] text-gray-400" strokeWidth={1.5} />
                     </button>
                     <button className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <MoreVertical className="h-[22px] w-[22px] text-gray-400" strokeWidth={1.5} />
                     </button>
                  </div>
               </div>
            ))}

            {/* Xem tất cả button */}
            <button className="mt-2 w-full h-[52px] bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-800 rounded-[16px] flex items-center justify-center text-[16px] font-semibold text-[#1d1d1f] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
               Xem tất cả
            </button>
         </div>
      </div>
    </div>
  );
}
