import { Request, Response, NextFunction } from 'express';
import { PricingService } from './pricing.service';
import { estimatePriceSchema, upsertPricingConfigSchema } from './pricing.validation';
import { VehicleType } from '@repo/database';

export class PricingController {
  /**
   * GET /api/pricing/estimate
   * Ước tính giá cho 1 loại xe cụ thể.
   * Query params: originLat, originLng, destLat, destLng, vehicleType (optional)
   */
  static async estimate(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = estimatePriceSchema.parse({
        originLat: Number(req.query.originLat),
        originLng: Number(req.query.originLng),
        destLat: Number(req.query.destLat),
        destLng: Number(req.query.destLng),
        vehicleType: req.query.vehicleType as string | undefined,
      });

      const result = await PricingService.estimate(
        parsed.originLat,
        parsed.originLng,
        parsed.destLat,
        parsed.destLng,
        (parsed.vehicleType as VehicleType) ?? 'BIKE'
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pricing/estimate-all
   * Ước tính giá cho cả BIKE và CAR — hiển thị trên UI cho khách chọn.
   */
  static async estimateAll(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = estimatePriceSchema.parse({
        originLat: Number(req.query.originLat),
        originLng: Number(req.query.originLng),
        destLat: Number(req.query.destLat),
        destLng: Number(req.query.destLng),
      });

      const results = await PricingService.estimateAll(
        parsed.originLat,
        parsed.originLng,
        parsed.destLat,
        parsed.destLng
      );

      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pricing/configs — Admin: lấy tất cả PricingConfig
   */
  static async getAllConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const configs = await PricingService.getAllConfigs();
      res.json({ success: true, data: configs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/pricing/configs — Admin: tạo/cập nhật PricingConfig
   */
  static async upsertConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = upsertPricingConfigSchema.parse(req.body);
      const config = await PricingService.upsertConfig(parsed);
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  }
}
