import { Router, Request, Response, NextFunction } from 'express';
import goongController from './goong.controller';

const router = Router();

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
router.get('/autocomplete', cacheFor(60), goongController.autocomplete);

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
router.get('/geocode', cacheFor(300), goongController.geocode);

/**
 * @route   GET /api/goong/reverse-geocode
 * @desc    Reverse Geocoding - Chuyển tọa độ thành địa chỉ
 * @access  Public
 * @cache   300s — địa chỉ tại một tọa độ cố định không thay đổi
 */
router.get('/reverse-geocode', cacheFor(300), goongController.reverseGeocode);

/**
 * @route   POST /api/goong/directions
 * @desc    Directions - Tính toán lộ trình
 * @access  Public
 * @cache   Không cache — POST không cache theo HTTP spec
 *          (cân nhắc chuyển sang GET nếu muốn cache sau này)
 */
router.post('/directions', goongController.directions);

/**
 * @route   GET /api/goong/place-detail
 * @desc    Lấy thông tin chi tiết về địa điểm
 * @access  Public
 * @cache   600s — thông tin địa điểm (tên, địa chỉ, tọa độ) rất ít thay đổi
 */
router.get('/place-detail', cacheFor(600), goongController.getPlaceDetail);

export default router;
