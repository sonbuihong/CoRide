"use client";
import { useSocket } from '@/components/providers/socket-provider';
import { useTripContext, Trip } from '@/contexts/TripContext';

export default function TripList() {
  const { trips } = useTripContext();
  const { isConnected } = useSocket();
  const status = isConnected ? 'connected' : 'disconnected';

  return (
    <div className="p-4 border rounded shadow w-full max-w-2xl mx-auto mt-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Danh sách chuyến đi Real-time</h2>
        
        {/* Hiển thị trạng thái kết nối */}
        <span className={`text-sm font-medium ${
          isConnected ? 'text-green-600' : 'text-red-500'
        }`}>
          {isConnected ? 'Đã kết nối Socket' : 'Mất kết nối'}
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
