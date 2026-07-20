/**
 * Module cache in-memory đơn giản với TTL (Time To Live).
 *
 * WHY dùng Map thay vì thư viện ngoài (node-cache, redis):
 * - Không thêm dependency
 * - Đủ dùng cho scale đơn server (DATN project)
 * - Dễ debug, dễ hiểu
 *
 * TRADE-OFF:
 * - Cache mất khi restart server (chấp nhận được — dữ liệu sẽ được re-fetch)
 * - Không chia sẻ cache giữa nhiều server instance (nếu sau này scale ngang
 *   thì nâng lên Redis)
 * - RAM: ~1KB/entry, max 1000 entry → tối đa ~1MB (rất nhỏ)
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp (ms)
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  /**
   * Lấy giá trị từ cache.
   * Trả về null nếu không tồn tại hoặc đã hết TTL.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      // Entry hết hạn → xóa để giải phóng RAM
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Lưu giá trị vào cache với TTL.
   * Nếu cache đầy (maxEntries) → xóa entry cũ nhất để tránh memory leak.
   *
   * @param key - Khóa cache
   * @param value - Giá trị cần lưu
   * @param ttlSeconds - Thời gian sống (giây)
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    // Evict entry cũ nhất khi đầy (FIFO — đủ đơn giản cho use case này)
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Xóa thủ công một entry (dùng khi dữ liệu bị invalidate).
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Trả về số entry đang có trong cache (bao gồm cả entry hết hạn chưa bị dọn).
   * Dùng để monitor / debug.
   */
  get size(): number {
    return this.store.size;
  }
}

// Singleton — dùng chung toàn bộ app
export const goongCache = new InMemoryCache(1000);
