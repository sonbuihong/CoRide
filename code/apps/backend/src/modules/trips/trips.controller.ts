import { Request, Response, NextFunction } from 'express';
import { TripsService } from './trips.service';
import { MatchingService } from '../matching/matching.service';
import { createTripRequestSchema } from './trips.validation';

export class TripsController {
  /**
   * POST /api/trips — Tạo yêu cầu đặt xe mới.
   * Sau khi tạo xong, tự động trigger MatchingService (Waterfall).
   */
  static async createTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const parsed = createTripRequestSchema.parse(req.body);

      // 1. Tạo TripRequest (status: PENDING)
      const trip = await TripsService.createTrip(userId, parsed);

      // 2. Trigger Waterfall Matching bất đồng bộ
      // Không await — trả response cho client ngay, matching chạy ngầm
      MatchingService.startMatching(trip.id).catch((err) => {
        console.error(`[Matching] Error for trip ${trip.id}:`, err);
      });

      res.status(201).json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/trips/:id/cancel — Hủy yêu cầu đặt xe.
   */
  static async cancelTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { reason } = req.body;

      const trip = await TripsService.cancelTrip(id, userId, reason);

      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/trips/active — Lấy trip đang active của hành khách hiện tại.
   */
  static async getActiveTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const trip = await TripsService.getActiveTrip(userId);

      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/trips/active-driver — Lấy trip đang active của tài xế hiện tại.
   */
  static async getActiveDriverTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const trip = await TripsService.getActiveDriverTrip(userId);

      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/trips/:id/status — Tài xế cập nhật trạng thái trip.
   */
  static async updateTripStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { status } = req.body;

      const trip = await TripsService.updateTripStatus(id, userId, status);

      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/trips/history — Lấy lịch sử chuyến đi (phân trang).
   */
  static async getTripHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await TripsService.getTripHistory(userId, page, limit);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
