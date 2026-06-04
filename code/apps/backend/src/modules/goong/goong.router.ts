import { Router } from 'express';
import goongController from './goong.controller';

const router = Router();

/**
 * @route   GET /api/goong/autocomplete
 * @desc    Autocomplete địa điểm
 * @access  Public
 */
router.get('/autocomplete', goongController.autocomplete);

/**
 * @route   GET /api/goong/geocode-v2
 * @desc    Geocoding V2 - Địa chỉ theo đơn vị hành chính mới (kèm so sánh địa giới cũ)
 * @access  Public
 */
router.get('/geocode-v2', goongController.geocodeV2);

/**
 * @route   GET /api/goong/geocode
 * @desc    Geocoding V1 - Chuyển địa chỉ thành tọa độ (legacy)
 * @access  Public
 */
router.get('/geocode', goongController.geocode);

/**
 * @route   GET /api/goong/reverse-geocode
 * @desc    Reverse Geocoding - Chuyển tọa độ thành địa chỉ
 * @access  Public
 */
router.get('/reverse-geocode', goongController.reverseGeocode);

/**
 * @route   POST /api/goong/directions
 * @desc    Directions - Tính toán lộ trình, khoảng cách, thời gian
 * @access  Public
 */
router.post('/directions', goongController.directions);

/**
 * @route   GET /api/goong/place-detail
 * @desc    Lấy thông tin chi tiết về địa điểm
 * @access  Public
 */
router.get('/place-detail', goongController.getPlaceDetail);

export default router;
