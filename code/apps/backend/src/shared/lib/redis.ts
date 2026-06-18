import { createClient } from 'redis';

/**
 * Redis Client Singleton — kết nối Redis cho toàn bộ ứng dụng.
 *
 * Sử dụng:
 * - Geospatial Index: Lưu toạ độ tài xế realtime (GEOADD/GEOSEARCH)
 * - Key-Value: Lưu trạng thái online/offline của tài xế
 *
 * Kiến trúc:
 * - connectRedis() gọi 1 lần trong server.ts khi khởi động
 * - redisClient export để các module khác sử dụng trực tiếp
 * - Helper functions (updateDriverLocation, findNearbyDrivers...) bọc logic Geo
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Key constants — tập trung quản lý để tránh typo và dễ refactor
const REDIS_KEYS = {
  DRIVER_LOCATIONS: 'driver_locations',       // Sorted Set (Geo) chứa toạ độ tài xế
  DRIVER_ONLINE_PREFIX: 'driver:online:',     // Key per driver: "driver:online:{driverId}"
  DRIVER_BUSY_PREFIX: 'driver:busy:',         // Driver đang trong cuốc xe
} as const;

export const redisClient = createClient({ url: REDIS_URL });

// Xử lý lỗi kết nối — log rõ ràng thay vì crash silent
redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

/**
 * Khởi tạo kết nối Redis — gọi 1 lần trong server.ts
 * Graceful: nếu Redis chưa sẵn sàng, server vẫn chạy được (degraded mode)
 */
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log(`[Redis] Connected to ${REDIS_URL}`);
  } catch (error) {
    console.error('[Redis] Failed to connect:', error);
    console.warn('[Redis] Server sẽ chạy ở chế độ degraded (không có matching)');
  }
};

/**
 * Đóng kết nối Redis — gọi khi server shutdown gracefully
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('[Redis] Disconnected');
    }
  } catch (error) {
    console.error('[Redis] Error disconnecting:', error);
  }
};

// ─── Helper Functions cho Driver Location ──────────────────────────────────

/**
 * Cập nhật toạ độ GPS của tài xế vào Redis Geospatial Index.
 * Gọi mỗi khi driver gửi location update qua Socket (mỗi 5-10 giây).
 *
 * GEOADD driver_locations longitude latitude driverId
 * Lưu ý: Redis Geo nhận (longitude, latitude) — ngược với convention thông thường.
 */
export const updateDriverLocation = async (
  driverId: string,
  latitude: number,
  longitude: number
): Promise<void> => {
  if (!redisClient.isOpen) return;

  await redisClient.geoAdd(REDIS_KEYS.DRIVER_LOCATIONS, {
    member: driverId,
    longitude,
    latitude,
  });
};

/**
 * Xoá tài xế khỏi Geospatial Index — khi tắt app hoặc chuyển offline.
 */
export const removeDriverLocation = async (driverId: string): Promise<void> => {
  if (!redisClient.isOpen) return;

  await redisClient.zRem(REDIS_KEYS.DRIVER_LOCATIONS, driverId);
};

/**
 * Tìm các tài xế trong bán kính quanh một toạ độ.
 * Trả về danh sách đã sắp xếp theo khoảng cách tăng dần (gần nhất trước).
 *
 * @param latitude  - Vĩ độ điểm trung tâm (thường là vị trí hành khách)
 * @param longitude - Kinh độ điểm trung tâm
 * @param radiusKm  - Bán kính tìm kiếm (km), mặc định 5km
 * @returns Mảng { driverId, distance } sắp xếp theo khoảng cách tăng dần
 */
export const findNearbyDrivers = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<Array<{ driverId: string; distance: number }>> => {
  if (!redisClient.isOpen) return [];

  const results = await redisClient.geoSearchWith(
    REDIS_KEYS.DRIVER_LOCATIONS,
    { longitude, latitude },
    { radius: radiusKm, unit: 'km' },
    ['WITHDIST'],
    { SORT: 'ASC' } // Gần nhất trước — phục vụ Waterfall matching
  );

  return results.map((result) => ({
    driverId: result.member,
    distance: result.distance ? parseFloat(String(result.distance)) : 0,
  }));
};

// ─── Helper Functions cho Driver Status ────────────────────────────────────

/**
 * Đánh dấu tài xế đang online — sẵn sàng nhận cuốc.
 * TTL 5 phút: nếu driver mất kết nối mà không gửi offline,
 * key tự hết hạn để tránh gửi cuốc cho driver đã disconnect.
 */
export const setDriverOnline = async (driverId: string): Promise<void> => {
  if (!redisClient.isOpen) return;

  await redisClient.set(
    `${REDIS_KEYS.DRIVER_ONLINE_PREFIX}${driverId}`,
    'true',
    { EX: 300 } // TTL 5 phút — driver phải heartbeat để duy trì online
  );
};

/**
 * Đánh dấu tài xế offline — không nhận cuốc nữa.
 */
export const setDriverOffline = async (driverId: string): Promise<void> => {
  if (!redisClient.isOpen) return;

  await redisClient.del(`${REDIS_KEYS.DRIVER_ONLINE_PREFIX}${driverId}`);
};

/**
 * Kiểm tra tài xế có đang online không.
 */
export const isDriverOnline = async (driverId: string): Promise<boolean> => {
  if (!redisClient.isOpen) return false;

  const result = await redisClient.get(`${REDIS_KEYS.DRIVER_ONLINE_PREFIX}${driverId}`);
  return result === 'true';
};

/**
 * Đánh dấu tài xế đang bận (đang trong cuốc xe khác).
 * Waterfall sẽ skip driver đang busy.
 */
export const setDriverBusy = async (driverId: string, tripId: string): Promise<void> => {
  if (!redisClient.isOpen) return;

  await redisClient.set(
    `${REDIS_KEYS.DRIVER_BUSY_PREFIX}${driverId}`,
    tripId,
    { EX: 3600 } // TTL 1 giờ — safety net nếu trip không clear đúng cách
  );
};

/**
 * Xoá trạng thái bận của tài xế — khi hoàn thành hoặc hủy cuốc.
 */
export const clearDriverBusy = async (driverId: string): Promise<void> => {
  if (!redisClient.isOpen) return;

  await redisClient.del(`${REDIS_KEYS.DRIVER_BUSY_PREFIX}${driverId}`);
};

/**
 * Kiểm tra tài xế có đang bận không.
 */
export const isDriverBusy = async (driverId: string): Promise<boolean> => {
  if (!redisClient.isOpen) return false;

  const result = await redisClient.get(`${REDIS_KEYS.DRIVER_BUSY_PREFIX}${driverId}`);
  return result !== null;
};

/**
 * Gia hạn TTL online cho tài xế — gọi mỗi lần driver gửi location update.
 * Đảm bảo driver không bị expire khi đang hoạt động bình thường.
 */
export const refreshDriverOnline = async (driverId: string): Promise<void> => {
  if (!redisClient.isOpen) return;

  await redisClient.expire(`${REDIS_KEYS.DRIVER_ONLINE_PREFIX}${driverId}`, 300);
};
