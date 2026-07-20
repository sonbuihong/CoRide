/**
 * Client-side in-memory cache cho Goong API calls.
 *
 * WHY: Browser đã gửi request đến backend (vượt qua HTTP cache header),
 * module này ngăn chặn ngay tại tầng JavaScript — không gửi request nào cả.
 *
 * Bổ sung cho HTTP Cache-Control (phương án D):
 * - HTTP Cache: hoạt động sau request đầu tiên, browser lưu ở disk/memory
 * - JS Cache (module này): hoạt động trong cùng tab, tức thì, không có
 *   network overhead
 *
 * Kịch bản điển hình được giải quyết:
 * - SearchForm + BookForm cùng mount → gọi reverseGeocode cùng lat/lng
 *   → Lần 2 trả về ngay từ JS cache, không gửi HTTP request
 * - GoongAutocomplete và AddressAutocomplete cùng gõ cùng query
 *   → Lần 2 trả về ngay từ JS cache
 *
 * TRADE-OFF:
 * + Cắt 100% duplicate call trong cùng 1 tab, tức thì
 * - Cache bị mất khi reload/đổi tab (chấp nhận được)
 * - RAM nhỏ (~< 1MB với maxSize mặc định)
 */

interface ClientCacheEntry<T> {
  value: T;
  expiresAt: number;
}

class ClientCache {
  private store = new Map<string, ClientCacheEntry<unknown>>();
  private readonly maxSize: number;

  constructor(maxSize = 200) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as ClientCacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    // Evict entry cũ nhất khi đầy để tránh memory leak trong tab dài
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

// Singleton per-tab — dùng chung cho toàn bộ app trong 1 session
export const goongClientCache = new ClientCache(200);
