import { decodePolyline, getDirections, getDistanceMatrix, type RouteGeometry } from './goong';
import type { GoongVehicleType } from '@repo/shared';

export interface Coordinate {
  id?: string;
  lat: number;
  lng: number;
}

/**
 * Tìm thứ tự waypoint tối ưu (TSP) sử dụng Goong Distance Matrix.
 * Trả về danh sách index của mảng waypoints đã được sắp xếp.
 *
 * @param start - Điểm xuất phát (Tài xế)
 * @param waypoints - Các điểm đón khách
 * @param end - Điểm kết thúc chung
 */
export async function getOptimalWaypointOrderGoong(
  start: Coordinate,
  waypoints: Coordinate[],
  end: Coordinate
): Promise<number[]> {
  if (waypoints.length <= 1) {
    return waypoints.map((_, i) => i);
  }

  // Thuật toán: Gom tất cả các điểm thành 1 mảng [Start, ...Waypoints, End]
  const allPoints = [start, ...waypoints, end];
  const pointsStr = allPoints.map((p) => `${p.lat},${p.lng}`).join('|');

  try {
    const data = await getDistanceMatrix(pointsStr, pointsStr, 'car');

    if (!data?.rows) {
      throw new Error('Invalid Goong Distance Matrix response');
    }

    const matrix = data.rows;

    // Helper: Tính tổng quãng đường của 1 hoán vị (permutation)
    const getDistanceOfPath = (perm: number[]): number => {
      let totalDist = 0;
      // Từ Start (0) đến điểm đón đầu tiên trong perm
      totalDist += matrix[0].elements[perm[0] + 1].distance.value;

      // Giữa các điểm đón
      for (let i = 0; i < perm.length - 1; i++) {
        const fromIdx = perm[i] + 1;
        const toIdx = perm[i + 1] + 1;
        totalDist += matrix[fromIdx].elements[toIdx].distance.value;
      }

      // Từ điểm đón cuối cùng đến End (N+1)
      const lastWpIdx = perm[perm.length - 1] + 1;
      const endIdx = allPoints.length - 1;
      totalDist += matrix[lastWpIdx].elements[endIdx].distance.value;

      return totalDist;
    };

    // Tạo danh sách các hoán vị của các waypoint (0, 1, ..., N-1)
    const indices = waypoints.map((_, i) => i);
    const permutations = permute(indices);

    let minDistance = Infinity;
    let bestPerm: number[] = indices;

    for (const perm of permutations) {
      const dist = getDistanceOfPath(perm);
      if (dist < minDistance) {
        minDistance = dist;
        bestPerm = perm;
      }
    }

    return bestPerm;
  } catch (error) {
    console.error('Error calculating TSP with Goong:', error);
    // Fallback: Giữ nguyên thứ tự ban đầu nếu lỗi
    return waypoints.map((_, i) => i);
  }
}

/**
 * Lấy polyline route bằng cách ghép nối nhiều đoạn /Direction của Goong.
 * (Vì Goong /Direction V1/V2 không hỗ trợ array waypoints mượt mà như OSRM, 
 * cách an toàn và chính xác nhất là gộp polyline của từng đoạn nhỏ).
 *
 * Trả về mảng tọa độ `[lat, lng][]` để truyền trực tiếp vào `<Polyline>` của react-leaflet.
 */
export async function getGoongMultiStopRoute(
  start: Coordinate,
  waypoints: Coordinate[],
  end: Coordinate,
  vehicle: GoongVehicleType = 'car',
): Promise<[number, number][]> {
  const points = [start, ...waypoints, end];
  let finalRoute: [number, number][] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    try {
      const data = await getDirections(`${p1.lat},${p1.lng}`, `${p2.lat},${p2.lng}`, vehicle);

      if (data && data.routes && data.routes.length > 0) {
        // Goong Direction trả về routes[0].overview_polyline.points (đã encode)
        const encodedPolyline = data.routes[0].overview_polyline.points;
        const decoded = decodeGoongPolyline(encodedPolyline);
        finalRoute = finalRoute.concat(decoded);
      }
    } catch (e) {
      console.error(`Error fetching Goong Direction for segment ${i}:`, e);
    }
  }

  return finalRoute;
}

// Hàm hoán vị (Heap's algorithm) dùng cho TSP
function permute(arr: number[]): number[][] {
  const result: number[][] = [];

  const generate = (n: number, heapArr: number[]) => {
    if (n === 1) {
      result.push([...heapArr]);
      return;
    }

    generate(n - 1, heapArr);

    for (let i = 0; i < n - 1; i++) {
      if (n % 2 === 0) {
        const temp = heapArr[i];
        heapArr[i] = heapArr[n - 1];
        heapArr[n - 1] = temp;
      } else {
        const temp = heapArr[0];
        heapArr[0] = heapArr[n - 1];
        heapArr[n - 1] = temp;
      }
      generate(n - 1, heapArr);
    }
  };

  generate(arr.length, [...arr]);
  return result;
}

// Helper decode polyline encoded từ Goong
// Trả về format [lat, lng] cho React Leaflet
export function decodeGoongPolyline(encoded: RouteGeometry): [number, number][] {
  // OSRM fallback returns GeoJSON coordinates as [lng, lat]. This helper
  // exposes [lat, lng], matching the encoded Goong polyline branch below.
  if (Array.isArray(encoded)) {
    return decodePolyline(encoded).map(([lng, lat]) => [lat, lng]);
  }

  const poly: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push([lat / 1e5, lng / 1e5]);
  }
  return poly;
}
