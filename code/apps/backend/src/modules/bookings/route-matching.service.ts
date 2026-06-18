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
}

export class RouteMatchingService {
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
    } = params;

    // 1. Khoảng cách từ điểm đón khách đến đoạn thẳng (vị trí tài xế → đích tài xế)
    const detourKm = this.pointToSegmentDistance(
      passengerPickupLat,
      passengerPickupLng,
      driverCurrentLat,
      driverCurrentLng,
      driverDestLat,
      driverDestLng
    );

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
