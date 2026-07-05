/**
 * RouteMatchingService — Tính toán địa lý để xác định hành khách có "thuận đường" không.
 *
 * Thuật toán Haversine:
 * - Tính khoảng cách giữa 2 điểm trên mặt cầu Trái Đất theo đường thẳng.
 * - Chính xác cho khoảng cách ngắn (< 500km), sai số < 0.5% — đủ tốt cho bài toán này.
 *
 * Ý tưởng "thuận đường":
 * - Tài xế đang đi từ vị trí hiện tại (driverCurrent) đến đích (driverDest).
 * - Hành khách muốn ghép tại vị trí (passengerPickup) và đến (passengerDest).
 * - Thuận đường khi: điểm đón khách gần đoạn đường tài xế đang đi (<= maxDetourKm)
 *   VÀ điểm đến khách không quá xa điểm đến tài xế (<= maxDestDeviationKm).
 */

/** Bán kính Trái Đất (km) — dùng trong Haversine */
const EARTH_RADIUS_KM = 6371;

export interface RouteCheckResult {
  isOnRoute: boolean;
  detourKm: number;       // Khoảng cách từ điểm đón khách tới tuyến đường tài xế
  destDeviationKm: number; // Khoảng cách từ điểm đến khách tới điểm đến tài xế
}

export interface RouteCheckParams {
  driverCurrentLat: number;    // Vị trí hiện tại tài xế (từ Redis)
  driverCurrentLng: number;
  driverDestLat: number;       // Điểm đến của tài xế
  driverDestLng: number;
  passengerPickupLat: number;  // Điểm đón khách
  passengerPickupLng: number;
  passengerDestLat: number;    // Điểm đến của khách
  passengerDestLng: number;
  maxDetourKm: number;         // Ngưỡng lệch đường tối đa (default 2km)
  maxDestDeviationKm: number;  // Ngưỡng lệch điểm đến tối đa (default 5km)
  currentWaypoints?: {lat: number, lng: number}[]; // Các điểm đón khách hiện tại
}

import goongService from '../goong/goong.service';

export class RouteMatchingService {
  /**
   * Tính toán thuận đường sử dụng Goong Distance Matrix API
   * Tính toán chi phí thực tế (khoảng cách lái xe).
   */
  static async checkRouteWithGoong(params: RouteCheckParams): Promise<RouteCheckResult> {
    const {
      driverCurrentLat, driverCurrentLng,
      driverDestLat, driverDestLng,
      passengerPickupLat, passengerPickupLng,
      passengerDestLat, passengerDestLng,
      maxDetourKm, maxDestDeviationKm,
      currentWaypoints = []
    } = params;

    // Nếu đã có nhiều điểm đón, tạm thời fallback về Haversine (point-to-segment)
    // vì việc ghép chuỗi ma trận đa điểm (TSP) rất phức tạp và tốn query.
    if (currentWaypoints.length > 0) {
      return this.checkRoute(params);
    }

    const origins = `${driverCurrentLat},${driverCurrentLng}|${passengerPickupLat},${passengerPickupLng}|${passengerDestLat},${passengerDestLng}`;
    const destinations = `${passengerPickupLat},${passengerPickupLng}|${passengerDestLat},${passengerDestLng}|${driverDestLat},${driverDestLng}`;

    try {
      const matrix = await goongService.distanceMatrix(origins, destinations);
      if (!matrix || !matrix.rows || matrix.rows.length < 3) {
        console.warn('Goong API failed, falling back to Haversine');
        return this.checkRoute(params);
      }

      const getDist = (origIdx: number, destIdx: number) => {
        const el = matrix.rows[origIdx].elements[destIdx];
        if (el.status !== 'OK') return Infinity;
        return el.distance.value / 1000; // km
      };

      // Khoảng cách gốc: Driver -> DriverDest
      const originalDist = getDist(0, 2);

      // Khoảng cách mới: Driver -> Pickup -> PassDest -> DriverDest
      const dToP = getDist(0, 0); // Driver -> Pickup
      const pToPd = getDist(1, 1); // Pickup -> PassDest
      const pdToD = getDist(2, 2); // PassDest -> DriverDest
      
      const newDist = dToP + pToPd + pdToD;
      const detourKm = newDist - originalDist;

      // Sai lệch điểm đến
      const destDeviationKm = getDist(2, 2);

      // Đảm bảo điểm đón không bị vòng ngược quá xa
      const isAhead = dToP <= originalDist + 1.0;

      const isOnRoute =
        isAhead &&
        detourKm <= maxDetourKm &&
        destDeviationKm <= maxDestDeviationKm;

      return { isOnRoute, detourKm, destDeviationKm };
    } catch (error) {
      console.error('checkRouteWithGoong Error:', error);
      return this.checkRoute(params);
    }
  }

  /**
   * Kiểm tra hành khách có nằm thuận đường với tài xế không.
   *
   * Điều kiện ghép:
   * 1. Khoảng cách từ điểm đón khách đến tuyến đường tài xế <= maxDetourKm
   * 2. Khoảng cách từ điểm đến khách đến điểm đến tài xế <= maxDestDeviationKm
   * 3. Điểm đón khách phải nằm "phía trước" tài xế (không phải đường quay đầu)
   */
  static checkRoute(params: RouteCheckParams): RouteCheckResult {
    const {
      driverCurrentLat,
      driverCurrentLng,
      driverDestLat,
      driverDestLng,
      passengerPickupLat,
      passengerPickupLng,
      passengerDestLat,
      passengerDestLng,
      maxDetourKm,
      maxDestDeviationKm,
      currentWaypoints = [],
    } = params;

    // Lập danh sách các điểm trên lộ trình hiện tại của tài xế
    const pathPoints = [
      { lat: driverCurrentLat, lng: driverCurrentLng },
      ...currentWaypoints,
      { lat: driverDestLat, lng: driverDestLng }
    ];

    // 1. Khoảng cách từ điểm đón khách đến tuyến đường tài xế
    // Tính khoảng cách nhỏ nhất từ điểm đón tới tất cả các đoạn (segments) trên lộ trình
    let detourKm = Infinity;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      const distToSegment = this.pointToSegmentDistance(
        passengerPickupLat, passengerPickupLng,
        p1.lat, p1.lng,
        p2.lat, p2.lng
      );
      if (distToSegment < detourKm) {
        detourKm = distToSegment;
      }
    }

    // 2. Khoảng cách từ điểm đến khách đến điểm đến tài xế
    const destDeviationKm = this.haversineDistance(
      passengerDestLat,
      passengerDestLng,
      driverDestLat,
      driverDestLng
    );

    // 3. Guard: điểm đón khách phải nằm "trên đường đi" của tài xế
    //    Tức là khoảng cách (vị trí hiện tại tài xế → điểm đón khách) nhỏ hơn
    //    khoảng cách (vị trí hiện tại tài xế → đích tài xế)
    //    → Khách không phải ở phía sau lưng tài xế
    const distDriverToPickup = this.haversineDistance(
      driverCurrentLat,
      driverCurrentLng,
      passengerPickupLat,
      passengerPickupLng
    );
    const distDriverToDest = this.haversineDistance(
      driverCurrentLat,
      driverCurrentLng,
      driverDestLat,
      driverDestLng
    );

    // Khách phải ở trước mặt tài xế (tính thêm buffer 1km để tránh loại nhầm)
    const isAhead = distDriverToPickup <= distDriverToDest + 1.0;

    const isOnRoute =
      isAhead &&
      detourKm <= maxDetourKm &&
      destDeviationKm <= maxDestDeviationKm;

    return { isOnRoute, detourKm, destDeviationKm };
  }

  /**
   * Haversine formula: khoảng cách giữa 2 điểm GPS (km).
   * Công thức: a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
   *            c = 2·atan2(√a, √(1−a))
   *            d = R·c
   */
  static haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  /**
   * Khoảng cách từ điểm P đến đoạn thẳng AB (Point-to-Segment Distance).
   *
   * Thuật toán:
   * - Chiếu P xuống đường thẳng qua A và B → điểm chiếu Q.
   * - Nếu Q nằm giữa A và B: khoảng cách = dist(P, Q).
   * - Nếu Q nằm ngoài đoạn AB: khoảng cách = min(dist(P, A), dist(P, B)).
   *
   * Dùng không gian toạ độ phẳng (Cartesian) thay vì Spherical vì khoảng cách ngắn
   * (< 20km trong đô thị) nên sai số cong của Trái Đất không đáng kể.
   */
  static pointToSegmentDistance(
    pLat: number,
    pLng: number,
    aLat: number,
    aLng: number,
    bLat: number,
    bLng: number
  ): number {
    // Nếu A = B (tài xế đứng yên tại đích), chỉ tính khoảng cách từ P đến điểm đó
    const ab2 = (bLat - aLat) ** 2 + (bLng - aLng) ** 2;
    if (ab2 === 0) {
      return this.haversineDistance(pLat, pLng, aLat, aLng);
    }

    // t = tham số chiếu (0 = tại A, 1 = tại B)
    const t = Math.max(
      0,
      Math.min(
        1,
        ((pLat - aLat) * (bLat - aLat) + (pLng - aLng) * (bLng - aLng)) / ab2
      )
    );

    // Điểm chiếu Q trên đoạn AB
    const qLat = aLat + t * (bLat - aLat);
    const qLng = aLng + t * (bLng - aLng);

    return this.haversineDistance(pLat, pLng, qLat, qLng);
  }
}
