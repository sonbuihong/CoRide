import { Request, Response } from 'express';
import goongService from './goong.service';

class GoongController {
  /**
   * GET /api/goong/autocomplete
   * Autocomplete V1 — gợi ý địa điểm với đầy đủ params: query, location, limit, radius, more_compound
   */
  async autocomplete(req: Request, res: Response) {
    try {
      const { query, limit, location, radius, more_compound } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query parameter is required' });
      }

      const limitNum = limit ? parseInt(limit as string, 10) : 10;
      const radiusNum = radius ? parseInt(radius as string, 10) : undefined;
      // more_compound mặc định true — trả thêm quận/xã/tỉnh tách sẵn
      const moreCompound = more_compound !== 'false';

      const results = await goongService.autocomplete(
        query,
        limitNum,
        location as string | undefined,
        radiusNum,
        moreCompound
      );

      res.json(results);
    } catch (error) {
      console.error('Autocomplete controller error:', error);
      res.status(500).json({ message: 'Không thể tìm kiếm địa điểm' });
    }
  }

  /**
   * GET /api/goong/geocode
   * Geocoding - Chuyển địa chỉ thành tọa độ (V1)
   */
  async geocode(req: Request, res: Response) {
    try {
      const { address } = req.query;

      if (!address || typeof address !== 'string') {
        return res.status(400).json({ message: 'Address parameter is required' });
      }

      const result = await goongService.geocode(address);

      if (!result) {
        return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
      }

      res.json(result);
    } catch (error) {
      console.error('Geocode controller error:', error);
      res.status(500).json({ message: 'Không thể tìm thấy tọa độ cho địa chỉ này' });
    }
  }

  /**
   * GET /api/goong/geocode-v2
   * Geocoding V2 - Trả về địa chỉ theo địa giới hành chính mới kèm địa giới cũ để hiển thị so sánh
   */
  async geocodeV2(req: Request, res: Response) {
    try {
      const { address } = req.query;

      if (!address || typeof address !== 'string') {
        return res.status(400).json({ message: 'Address parameter is required' });
      }

      const results = await goongService.geocodeV2(address);

      if (!results) {
        return res.status(404).json({ message: 'Không tìm thấy địa chỉ mới' });
      }

      res.json(results);
    } catch (error) {
      console.error('Geocode V2 controller error:', error);
      res.status(500).json({ message: 'Không thể lấy thông tin địa chỉ mới' });
    }
  }

  /**
   * GET /api/goong/reverse-geocode
   * Reverse Geocoding - Chuyển tọa độ thành địa chỉ
   */
  async reverseGeocode(req: Request, res: Response) {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ message: 'Lat and Lng parameters are required' });
      }

      const latNum = parseFloat(lat as string);
      const lngNum = parseFloat(lng as string);

      if (isNaN(latNum) || isNaN(lngNum)) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }

      const result = await goongService.reverseGeocode(latNum, lngNum);

      if (!result) {
        return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
      }

      res.json(result);
    } catch (error) {
      console.error('Reverse geocode controller error:', error);
      res.status(500).json({ message: 'Không thể tìm thấy địa chỉ cho tọa độ này' });
    }
  }

  /**
   * POST /api/goong/directions
   * Directions V2 — Tính toán lộ trình, khoảng cách, thời gian (Goong API V2)
   */
  async directions(req: Request, res: Response) {
    try {
      const { origin, destination, vehicle } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({ message: 'Origin and destination are required' });
      }

      const vehicleType = vehicle || 'car';
      const result = await goongService.directions(origin, destination, vehicleType);

      if (!result) {
        return res.status(404).json({ message: 'Không thể tính toán lộ trình' });
      }

      res.json(result);
    } catch (error) {
      console.error('Directions controller error:', error);
      res.status(500).json({ message: 'Không thể tính toán lộ trình' });
    }
  }

  /**
   * GET /api/goong/place-detail
   * Lấy thông tin chi tiết về địa điểm
   */
  async getPlaceDetail(req: Request, res: Response) {
    try {
      const { place_id } = req.query;

      if (!place_id || typeof place_id !== 'string') {
        return res.status(400).json({ message: 'Place ID parameter is required' });
      }

      const result = await goongService.getPlaceDetail(place_id);

      if (!result) {
        return res.status(404).json({ message: 'Không tìm thấy địa điểm' });
      }

      res.json(result);
    } catch (error) {
      console.error('Place detail controller error:', error);
      res.status(500).json({ message: 'Không thể lấy thông tin chi tiết địa điểm' });
    }
  }
}

export default new GoongController();
