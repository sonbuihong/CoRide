import type { NextFunction, Request, Response } from 'express';
import {
  cancelTripSchema,
  completeTripSchema,
  createTripRequestSchema,
  driverTripStatusSchema,
  type CompleteTripInput,
  type DriverTripStatus,
} from '@repo/shared';

import { MatchingService } from '../matching/matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { emitTripUpdated } from './trip-realtime.service';
import { TripsService } from './trips.service';

const transitionTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
  status: DriverTripStatus,
  options?: CompleteTripInput,
): Promise<void> => {
  try {
    const result = await TripsService.updateTripStatus(
      req.params.id as string,
      req.user!.id,
      status,
      options,
    );
    emitTripUpdated(result.trip, { previousStatus: result.previousStatus });

    if (status === 'ARRIVED') {
      void NotificationsService.createNotification(
        result.trip.passengerId,
        'Tài xế đã đến',
        'Tài xế đang chờ bạn tại điểm đón.',
        'TRIP_DRIVER_ARRIVED',
        { type: 'TRIP', id: result.trip.id },
      ).catch((error) => console.error('[Trip] Notification error:', error));
    }
    res.json({ success: true, data: result.trip });
  } catch (error) {
    next(error);
  }
};

export class TripsController {
  static async createTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const trip = await TripsService.createTrip(
        userId,
        createTripRequestSchema.parse(req.body),
      );

      emitTripUpdated(trip, { message: 'Yêu cầu chuyến đã được tạo.' });
      void MatchingService.startMatching(trip.id).catch((error) => {
        console.error(`[Matching] Error for trip ${trip.id}:`, error);
      });
      res.status(201).json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  static async acceptTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await MatchingService.handleDriverAccept(
        req.params.id as string,
        req.user!.id,
      );
      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  static async rejectTrip(req: Request, res: Response, next: NextFunction) {
    try {
      await MatchingService.handleDriverReject(req.params.id as string, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async cancelTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const input = cancelTripSchema.parse(req.body ?? {});
      const result = await TripsService.cancelTrip(
        req.params.id as string,
        req.user!.id,
        input.cancelReason ?? input.reason,
      );
      emitTripUpdated(result.trip, {
        previousStatus: result.previousStatus,
        message: result.cancelledBy === 'PASSENGER'
          ? 'Hành khách đã hủy chuyến.'
          : 'Tài xế đã hủy chuyến.',
      });

      const oppositeUserId = result.cancelledBy === 'PASSENGER'
        ? result.trip.driverId
        : result.trip.passengerId;
      if (oppositeUserId) {
        void NotificationsService.createNotification(
          oppositeUserId,
          'Chuyến đi đã bị hủy',
          result.cancelledBy === 'PASSENGER'
            ? 'Hành khách đã hủy chuyến đi.'
            : 'Tài xế đã hủy chuyến đi.',
          'TRIP_CANCELLED',
          { type: 'TRIP', id: result.trip.id },
        ).catch((error) => console.error('[Trip] Notification error:', error));
      }

      res.json({ success: true, data: result.trip });
    } catch (error) {
      next(error);
    }
  }

  static async setEnRoute(req: Request, res: Response, next: NextFunction) {
    await transitionTrip(req, res, next, 'ARRIVING');
  }

  static async markArrived(req: Request, res: Response, next: NextFunction) {
    await transitionTrip(req, res, next, 'ARRIVED');
  }

  static async startTrip(req: Request, res: Response, next: NextFunction) {
    await transitionTrip(req, res, next, 'IN_PROGRESS');
  }

  static async completeTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const options = completeTripSchema.parse(req.body ?? {});
      await transitionTrip(req, res, next, 'WAITING_PAYMENT', options);
    } catch (error) {
      next(error);
    }
  }

  /** Backward-compatible endpoint; transition validation still runs centrally. */
  static async updateTripStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = driverTripStatusSchema.parse(req.body?.status);
      const options = status === 'WAITING_PAYMENT'
        ? completeTripSchema.parse(req.body ?? {})
        : undefined;
      await transitionTrip(req, res, next, status, options);
    } catch (error) {
      next(error);
    }
  }

  static async getActiveTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.getActiveTrip(req.user!.id);
      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  static async getActiveDriverTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.getActiveDriverTrip(req.user!.id);
      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  static async getTripHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TripsService.getTripHistory(
        req.user!.id,
        Number(req.query.page) || 1,
        Number(req.query.limit) || 10,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getTripById(req: Request, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.getTripById(req.params.id as string, req.user!.id);
      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }
}
