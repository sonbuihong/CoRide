"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SocketEvents } from '@repo/shared';

// Generic Trip Type based on Prisma Schema
export type Trip = {
  id: string;
  pickup: string;
  destination: string;
  status: string;
  driverId?: string;
  passengerId?: string;
  [key: string]: any;
};

interface TripContextProps {
  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
}

const TripContext = createContext<TripContextProps | undefined>(undefined);

import { useSocket } from '@/components/providers/socket-provider';

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleTripCreated = (newTrip: Trip) => {
      setTrips((prevTrips) => {
        if (prevTrips.some(t => t.id === newTrip.id)) return prevTrips;
        return [newTrip, ...prevTrips]; 
      });
    };

    const handleTripUpdated = (updatedTrip: Trip) => {
      setTrips((prevTrips) => 
        prevTrips.map(t => t.id === updatedTrip.id ? updatedTrip : t)
      );
    };

    const handleTripDeleted = ({ id }: { id: string }) => {
      setTrips((prevTrips) => prevTrips.filter(t => t.id !== id));
    };

    socket.on(SocketEvents.TRIP_CREATED, handleTripCreated);
    socket.on(SocketEvents.TRIP_UPDATED, handleTripUpdated);
    socket.on(SocketEvents.TRIP_DELETED, handleTripDeleted);

    return () => {
      socket.off(SocketEvents.TRIP_CREATED, handleTripCreated);
      socket.off(SocketEvents.TRIP_UPDATED, handleTripUpdated);
      socket.off(SocketEvents.TRIP_DELETED, handleTripDeleted);
    };
  }, []);

  return (
    <TripContext.Provider value={{ trips, setTrips }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTripContext = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTripContext must be used within TripProvider");
  return ctx;
};
