import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import goongController from './goong.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import {
  autocompleteQuerySchema, directionsBodySchema, distanceMatrixBodySchema, geocodeQuerySchema,
  geolocationBodySchema, placeDetailQuerySchema, reverseGeocodeQuerySchema, staticMapQuerySchema,
  tripBodySchema,
} from './goong.validation';

const router = Router();
const autocompleteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const heavyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

/**
 * Middleware đặt HTTP Cache-Control header cho response.
 *
 * WHY: Browser và proxy/CDN tự phục vụ từ cache khi cùng URL + params
 * → Không gọi đến backend → Không tốn quota Goong API.
 *
 * stale-while-revalidate: cho phép trả cache cũ ngay lập tức trong khi
 * fetch dữ liệu mới ở nền (UX không bị chờ, dữ liệu luôn cập nhật).
 *
 * @param maxAgeSeconds - Thời gian tối đa browser cache response (giây)
 */
function cacheFor(maxAgeSeconds: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set(
      'Cache-Control',
      `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${Math.floor(maxAgeSeconds / 2)}`
    );
    next();
  };
}

/**
 * @route   GET /api/goong/autocomplete
 * @desc    Autocomplete địa điểm
 * @access  Public
 * @cache   60s — kết quả gợi ý thay đổi khi dữ liệu Goong cập nhật
 */
router.get('/autocomplete', autocompleteLimiter, validate(autocompleteQuerySchema, 'query'), cacheFor(60), goongController.autocomplete);

/**
 * @route   GET /api/goong/geocode-v2
 * @desc    Geocoding V2 - Địa chỉ theo đơn vị hành chính mới
 * @access  Public
 * @cache   300s — địa giới hành chính thay đổi rất ít
 */
router.get('/geocode-v2', cacheFor(300), goongController.geocodeV2);

/**
 * @route   GET /api/goong/geocode
 * @desc    Geocoding V1 - Chuyển địa chỉ thành tọa độ (legacy)
 * @access  Public
 * @cache   300s — tọa độ địa chỉ gần như không thay đổi
 */
router.get('/geocode', validate(geocodeQuerySchema, 'query'), cacheFor(300), goongController.geocode);

/**
 * @route   GET /api/goong/reverse-geocode
 * @desc    Reverse Geocoding - Chuyển tọa độ thành địa chỉ
 * @access  Public
 * @cache   300s — địa chỉ tại một tọa độ cố định không thay đổi
 */
router.get('/reverse-geocode', validate(reverseGeocodeQuerySchema, 'query'), cacheFor(300), goongController.reverseGeocode);

/**
 * @route   POST /api/goong/directions
 * @desc    Directions - Tính toán lộ trình
 * @access  Public
 * @cache   Không cache — POST không cache theo HTTP spec
 *          (cân nhắc chuyển sang GET nếu muốn cache sau này)
 */
router.post('/directions', heavyLimiter, validate(directionsBodySchema), goongController.directions);

/**
 * @route   GET /api/goong/place-detail
 * @desc    Lấy thông tin chi tiết về địa điểm
 * @access  Public
 * @cache   600s — thông tin địa điểm (tên, địa chỉ, tọa độ) rất ít thay đổi
 */
router.get('/place-detail', validate(placeDetailQuerySchema, 'query'), cacheFor(600), goongController.getPlaceDetail);

router.post('/distance-matrix', heavyLimiter, validate(distanceMatrixBodySchema), goongController.distanceMatrix);
router.post('/trip', heavyLimiter, validate(tripBodySchema), goongController.trip);
router.get('/static-map', heavyLimiter, validate(staticMapQuerySchema, 'query'), goongController.staticMap);
router.post('/geolocation', heavyLimiter, validate(geolocationBodySchema), goongController.geolocation);

export default router;
