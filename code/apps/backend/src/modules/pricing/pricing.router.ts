import { Router } from 'express';
import { PricingController } from './pricing.controller';
import { authenticate, restrictTo } from '../../shared/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/pricing/estimate:
 *   get:
 *     summary: Ước tính giá chuyến đi cho 1 loại xe
 *     tags: [Pricing]
 */
router.get('/estimate', authenticate, PricingController.estimate);

/**
 * @swagger
 * /api/pricing/estimate-all:
 *   get:
 *     summary: Ước tính giá cho cả BIKE và CAR
 *     tags: [Pricing]
 */
router.get('/estimate-all', authenticate, PricingController.estimateAll);

/**
 * @swagger
 * /api/pricing/configs:
 *   get:
 *     summary: (Admin) Lấy tất cả cấu hình giá
 *     tags: [Pricing]
 */
router.get('/configs', authenticate, restrictTo('ADMIN'), PricingController.getAllConfigs);

/**
 * @swagger
 * /api/pricing/configs:
 *   put:
 *     summary: (Admin) Tạo hoặc cập nhật cấu hình giá
 *     tags: [Pricing]
 */
router.put('/configs', authenticate, restrictTo('ADMIN'), PricingController.upsertConfig);

export default router;
