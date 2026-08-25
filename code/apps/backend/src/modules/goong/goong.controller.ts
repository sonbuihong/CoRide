import { Request, Response } from 'express';
import goongService from './goong.service';

class GoongController {
  /**
   * GET /api/goong/autocomplete
   * Autocomplete V1/V2 — version=v2 trả địa chỉ theo địa giới sau sáp nhập
   */
  async autocomplete(req: Request, res: Response) {
    try {
      const { query, limit, location, radius, more_compound, version, session_token } = (res.locals.validatedQuery ?? req.query) as any;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query parameter is required' });
      }

      const limitNum = limit ? parseInt(limit as string, 10) : 10;
      const radiusNum = radius ? parseInt(radius as string, 10) : undefined;
      // more_compound mặc định true — trả thêm quận/xã/tỉnh tách sẵn
      const moreCompound = more_compound !== 'false';
      const apiVersion = version === 'v2' ? 'v2' : 'v1';

      const results = await goongService.autocomplete(
        query,
        limitNum,
        location as string | undefined,
        radiusNum,
        moreCompound,
        apiVersion,
        session_token,
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
      const { address, version } = (res.locals.validatedQuery ?? req.query) as any;

      if (!address || typeof address !== 'string') {
        return res.status(400).json({ message: 'Address parameter is required' });
      }

      const result = await goongService.forwardGeocode(address, version);

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
      const { lat, lng, version } = (res.locals.validatedQuery ?? req.query) as any;

      if (!lat || !lng) {
        return res.status(400).json({ message: 'Lat and Lng parameters are required' });
      }

      const latNum = parseFloat(lat as string);
      const lngNum = parseFloat(lng as string);

      if (isNaN(latNum) || isNaN(lngNum)) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }

      const apiVersion = version === 'v2' ? 'v2' : 'v1';
      const result = await goongService.reverseGeocode(latNum, lngNum, apiVersion);

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
      const { origin, destination, vehicle, alternatives, waypoints = [] } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({ message: 'Origin and destination are required' });
      }

      const vehicleType = vehicle || 'car';
      const result = await goongService.directions(origin, destination, vehicleType, alternatives, waypoints);

      if (!result) {
        return res.status(404).json({ message: 'Không thể tính toán lộ trình' });
      }

      res.json(result);
    } catch (error: any) {
      console.error('Directions controller error:', error);
      res.status(500).json({ message: 'Không thể tính toán lộ trình', error: error.message, stack: error.stack });
    }
  }

  /**
   * GET /api/goong/place-detail
   * Lấy thông tin chi tiết về địa điểm
   */
  async getPlaceDetail(req: Request, res: Response) {
    try {
      const { place_id, version, session_token } = (res.locals.validatedQuery ?? req.query) as any;

      if (!place_id || typeof place_id !== 'string') {
        return res.status(400).json({ message: 'Place ID parameter is required' });
      }

      const apiVersion = version === 'v2' ? 'v2' : 'v1';
      const result = await goongService.getPlaceDetail(place_id, apiVersion, session_token);

      if (!result) {
        return res.status(404).json({ message: 'Không tìm thấy địa điểm' });
      }

      res.json(result);
    } catch (error) {
      console.error('Place detail controller error:', error);
      res.status(500).json({ message: 'Không thể lấy thông tin chi tiết địa điểm' });
    }
  }

  async distanceMatrix(req: Request, res: Response) {
    try {
      const { origins, destinations, vehicle } = req.body;
      const result = await goongService.distanceMatrix(origins, destinations, vehicle);
      if (!result) return res.status(404).json({ code: 'NOT_FOUND', message: 'Không tìm thấy ma trận khoảng cách', retryable: false });
      res.json(result);
    } catch (error: any) {
      res.status(502).json({ code: 'UPSTREAM_ERROR', message: 'Không thể tính ma trận khoảng cách', retryable: true });
    }
  }

  async trip(req: Request, res: Response) {
    try {
      const { origin, waypoints, destination, vehicle, roundtrip } = req.body;
      const result = await goongService.optimizeTrip(origin, waypoints, destination, vehicle, roundtrip);
      if (!result) return res.status(404).json({ code: 'NOT_FOUND', message: 'Không thể tối ưu tuyến đa điểm', retryable: false });
      res.json(result);
    } catch (error: any) {
      res.status(502).json({ code: 'UPSTREAM_ERROR', message: 'Dịch vụ tối ưu tuyến đang bận', retryable: true });
    }
  }

  async staticMap(req: Request, res: Response) {
    try {
      const options = (res.locals.validatedQuery ?? req.query) as any;
      const image = await goongService.staticMap(options);
      // Helmet defaults CORP to `same-origin`, while Expo Web renders this
      // image from a different development/production origin. Static maps are
      // public, immutable render assets, so allow embedding without weakening
      // the policy for the rest of the API.
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
      res.send(image);
    } catch (error: any) {
      res.status(502).json({ code: 'UPSTREAM_ERROR', message: 'Không thể tải bản đồ tĩnh', retryable: true });
    }
  }

  async geolocation(req: Request, res: Response) {
    try {
      const result = await goongService.geolocate(req.body);
      res.json(result);
    } catch (error: any) {
      if (error?.message === 'GOONG_GEOLOCATION_DISABLED') {
        return res.status(503).json({ code: 'FEATURE_DISABLED', message: 'Geo Location chưa được bật cho bản build này', retryable: false });
      }
      res.status(502).json({ code: 'UPSTREAM_ERROR', message: 'Không thể định vị từ dữ liệu mạng', retryable: true });
    }
  }
}

export default new GoongController();
