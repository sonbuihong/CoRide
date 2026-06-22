"use client";
import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

export const useDriverLocation = (driverId: string | null | undefined) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!driverId) return;

    const socket = getSocket();
    
    // We don't necessarily join a driver room, backend sends to the passenger based on trip or ride, 
    // but based on backend `driver:location`, we listen to it.
    // In backend: 
    // `socket.to(roomName).emit('driver:location', { latitude: data.latitude, longitude: data.longitude, timestamp: Date.now() });`
    
    const handleLocationUpdate = (data: { latitude: number, longitude: number, timestamp: number }) => {
      setLocation({ latitude: data.latitude, longitude: data.longitude });
    };

    socket.on('driver:location', handleLocationUpdate);

    return () => {
      socket.off('driver:location', handleLocationUpdate);
    };
  }, [driverId]);

  return location;
};
