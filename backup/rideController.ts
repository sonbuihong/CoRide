import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { getIO } from '../socket/socket.server';
import { SocketEvents } from '@repo/shared'; // Assume this exists or I'll just emit raw string

export const createRide = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { origin, destination, departureTime, availableSeats, pricePerSeat, description } = req.body;

  const ride = await prisma.ride.create({
    data: {
      driverId: userId,
      origin,
      destination,
      departureTime: new Date(departureTime),
      availableSeats,
      pricePerSeat,
      description,
      status: 'SCHEDULED', // ACTIVE -> SCHEDULED
    },
  });

  res.status(201).json({ success: true, data: ride });
};

export const searchRides = async (req: Request, res: Response) => {
  const { origin, destination, date } = req.query;

  // Search logic here, simplified for example
  const rides = await prisma.ride.findMany({
    where: {
      status: 'SCHEDULED', // ACTIVE -> SCHEDULED
      availableSeats: { gt: 0 },
      ...(origin && { origin: { contains: origin as string, mode: 'insensitive' } }),
      ...(destination && { destination: { contains: destination as string, mode: 'insensitive' } }),
    },
    include: {
      driver: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true, driverRating: true },
      },
    },
    orderBy: { departureTime: 'asc' },
  });

  res.json({ success: true, data: rides });
};

export const getRideDetail = async (req: Request, res: Response) => {
  const { id } = req.params;

  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      driver: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true, driverRating: true, phone: true },
      },
      bookings: {
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
        include: {
          passenger: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!ride) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy chuyến đi' });
  }

  res.json({ success: true, data: ride });
};

export const updateRideStatus = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { status } = req.body; // e.g. ONGOING (DEPARTED -> ONGOING), COMPLETED, CANCELLED

  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride) return res.status(404).json({ success: false, error: 'Không tìm thấy chuyến đi' });
  if (ride.driverId !== userId) return res.status(403).json({ success: false, error: 'Không có quyền' });

  const updatedRide = await prisma.ride.update({
    where: { id },
    data: { status },
  });

  // Emit socket event to passengers if needed
  try {
    const io = getIO();
    // Logic to notify passengers can go here
  } catch (err) {
    console.error('Socket emit failed', err);
  }

  res.json({ success: true, data: updatedRide });
};
