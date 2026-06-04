import { extendedPrisma as prisma } from '@repo/database';

// Tái sử dụng shared type thay vì khai báo interface riêng
import type { GoongPlaceDetailResult } from '@repo/shared';

/**
 * Lưu hoặc cập nhật địa điểm vào DB từ kết quả Goong Place Detail
 * Dùng upsert trên placeId — nếu đã tồn tại thì update, chưa thì create
 * Tránh duplicate và đảm bảo data luôn fresh nhất
 */
export const saveLocation = async (placeDetail: GoongPlaceDetailResult) => {
  try {
    const location = await prisma.location.upsert({
      where: { placeId: placeDetail.place_id },
      update: {
        name: placeDetail.name,
        address: placeDetail.formatted_address,
        latitude: placeDetail.geometry.location.lat,
        longitude: placeDetail.geometry.location.lng,
      },
      create: {
        placeId: placeDetail.place_id,
        name: placeDetail.name,
        address: placeDetail.formatted_address,
        latitude: placeDetail.geometry.location.lat,
        longitude: placeDetail.geometry.location.lng,
      },
    });
    return location;
  } catch (error) {
    console.error('[LocationService] Lỗi khi lưu địa điểm:', error);
    throw error;
  }
};

/**
 * Tìm địa điểm đã lưu theo placeId
 * Dùng để check cache trước khi gọi Goong API
 */
export const getLocationByPlaceId = async (placeId: string) => {
  return prisma.location.findUnique({
    where: { placeId },
  });
};
