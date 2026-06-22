"use client";
import { useTripContext } from '@/contexts/TripContext';
import { useSocket } from '@/hooks/useSocket';

export const TripList = () => {
  const { trips } = useTripContext();
  const { status } = useSocket();

  return (
    <div className="p-4 border rounded shadow w-full max-w-2xl mx-auto mt-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Danh sách chuyến đi Real-time</h2>
        
        {/* Hiển thị trạng thái kết nối */}
        <span className={`text-sm font-medium ${
          status === 'connected' ? 'text-green-600' : 
          status === 'connecting' ? 'text-yellow-500' : 'text-red-500'
        }`}>
          {status === 'connected' ? 'Đã kết nối Socket' : 
           status === 'connecting' ? 'Đang kết nối lại...' : 'Mất kết nối'}
        </span>
      </div>
      
      {trips.length === 0 ? (
        <p className="text-gray-500 text-sm">Chưa có chuyến đi nào, hoặc đang tải từ API...</p>
      ) : (
        <ul className="space-y-3">
          {trips.map(trip => (
            <li key={trip.id} className="p-3 border rounded bg-slate-50 flex justify-between">
              <div>
                <p className="font-semibold text-gray-800">
                  {trip.originAddress || trip.pickup || 'N/A'} ➔ {trip.destAddress || trip.destination || 'N/A'}
                </p>
              </div>
              <div className="text-sm font-bold text-blue-600">
                {trip.status}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
