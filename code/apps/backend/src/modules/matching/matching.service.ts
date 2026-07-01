import { extendedPrisma as prisma } from '@repo/database';
import {
  findNearbyDrivers,
  isDriverOnline,
  isDriverBusy,
  setDriverBusy,
} from '../../shared/lib/redis';
import { SocketEvents } from '@repo/shared';
import { SocketEventService } from '../../socket/socket.events';
import { AppError } from '../../shared/errors/AppError';

/**
 * MatchingService — Thuật toán Waterfall tìm tài xế cho Ride-Hailing.
 *
 * Luồng:
 * 1. Query Redis (GEOSEARCH) để lấy danh sách tài xế trong bán kính, sắp xếp từ gần → xa.
 * 2. Lọc: chỉ giữ tài xế đang online VÀ không bận (không đang trong cuốc khác).
 * 3. Phát tuần tự: gửi Socket event "trip:new_request" cho tài xế gần nhất.
 * 4. Đợi 10 giây: nếu tài xế accept → kết thúc. Nếu không → chuyển sang tài xế tiếp theo.
 * 5. Nếu hết danh sách → cập nhật trip thành NO_DRIVER.
 *
 * Trade-off:
 * - Waterfall (tuần tự) vs Broadcast (đồng loạt):
 *   + Waterfall: Tài xế gần nhất luôn được ưu tiên, tránh race condition nhiều tài xế nhận cùng lúc.
 *   + Broadcast: Nhanh hơn nhưng cần giải quyết conflict khi 2+ tài xế accept đồng thời.
 *   → Chọn Waterfall vì đơn giản hơn cho DATN, trải nghiệm tốt cho hành khách.
 */

const MATCH_TIMEOUT_MS = 10_000; // 10 giây chờ mỗi tài xế

export class MatchingService {
  /**
   * Bắt đầu quá trình matching cho 1 TripRequest.
   * Chạy bất đồng bộ — không block API response.
   */
  static async startMatching(tripId: string): Promise<void> {
    // 1. Lấy thông tin trip
    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
      include: {
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            passengerRating: true,
          },
        },
      },
    });

    if (!trip) {
      console.error(`[Matching] Trip ${tripId} not found`);
      return;
    }

    // 2. Chuyển status sang MATCHING
    await prisma.tripRequest.update({
      where: { id: tripId },
      data: { status: 'MATCHING' },
    });

    // Thông báo passenger rằng hệ thống đang tìm tài xế
    this.emitToPassenger(trip.passengerId, SocketEvents.TRIP_STATUS_UPDATE, {
      tripId,
      status: 'MATCHING',
      message: 'Đang tìm tài xế cho bạn...',
    });

    // 3. Tìm tài xế gần điểm đón
    const nearbyDrivers = await findNearbyDrivers(
      trip.originLat,
      trip.originLng,
      trip.matchRadius
    );

    if (nearbyDrivers.length === 0) {
      await this.noDriverFound(tripId, trip.passengerId);
      return;
    }

    // 4. Lọc tài xế hợp lệ (online + không bận + không phải chính hành khách)
    const eligibleDrivers = await this.filterEligibleDrivers(
      nearbyDrivers,
      trip.passengerId
    );

    if (eligibleDrivers.length === 0) {
      await this.noDriverFound(tripId, trip.passengerId);
      return;
    }

    // 5. Bắt đầu Waterfall — phát lần lượt
    await this.waterfallMatch(tripId, trip, eligibleDrivers);
  }

  /**
   * Lọc danh sách tài xế: chỉ giữ những tài xế đang online và không bận.
   */
  private static async filterEligibleDrivers(
    nearbyDrivers: Array<{ driverId: string; distance: number }>,
    passengerId: string
  ): Promise<Array<{ driverId: string; distance: number }>> {
    const eligible: Array<{ driverId: string; distance: number }> = [];

    for (const driver of nearbyDrivers) {
      // Skip nếu tài xế chính là hành khách (tự gọi xe cho mình)
      if (driver.driverId === passengerId) continue;

      const [online, busy] = await Promise.all([
        isDriverOnline(driver.driverId),
        isDriverBusy(driver.driverId),
      ]);

      if (online && !busy) {
        eligible.push(driver);
      }
    }

    return eligible;
  }

  /**
   * Waterfall matching: phát yêu cầu lần lượt từ tài xế gần nhất.
   *
   * Cơ chế timeout:
   * - Gửi Socket event "trip:new_request" tới tài xế
   * - Đợi tối đa 10 giây
   * - Nếu tài xế accept: MatchingService.handleDriverAccept() được gọi từ Socket handler
   *   → resolve Promise, kết thúc matching
   * - Nếu timeout hoặc reject: chuyển sang tài xế tiếp theo
   */
  private static async waterfallMatch(
    tripId: string,
    trip: any,
    drivers: Array<{ driverId: string; distance: number }>
  ): Promise<void> {
    const maxAttempts = Math.min(drivers.length, trip.maxAttempts);

    for (let i = 0; i < maxAttempts; i++) {
      // Kiểm tra trip vẫn đang MATCHING (chưa bị hủy bởi hành khách)
      const currentTrip = await prisma.tripRequest.findUnique({
        where: { id: tripId },
        select: { status: true },
      });

      if (!currentTrip || currentTrip.status !== 'MATCHING') {
        console.log(`[Matching] Trip ${tripId} no longer matching (status: ${currentTrip?.status})`);
        return;
      }

      const driver = drivers[i];

      // Cập nhật matchAttempts
      await prisma.tripRequest.update({
        where: { id: tripId },
        data: { matchAttempts: i + 1 },
      });

      console.log(
        `[Matching] Trip ${tripId}: Sending to driver ${driver.driverId} (${driver.distance.toFixed(1)}km away, attempt ${i + 1}/${maxAttempts})`
      );

      // Gửi thông báo cuốc xe cho tài xế
      this.emitToDriver(driver.driverId, SocketEvents.TRIP_NEW_REQUEST, {
        tripId,
        passenger: trip.passenger,
        originAddress: trip.originAddress,
        originLat: trip.originLat,
        originLng: trip.originLng,
        destAddress: trip.destAddress,
        destLat: trip.destLat,
        destLng: trip.destLng,
        vehicleType: trip.vehicleType,
        estimatedDistance: trip.estimatedDistance,
        estimatedDuration: trip.estimatedDuration,
        estimatedPrice: trip.estimatedPrice,
        driverDistance: driver.distance, // Khoảng cách từ tài xế đến điểm đón
      });

      // Đợi phản hồi hoặc timeout
      const accepted = await this.waitForDriverResponse(tripId, driver.driverId);

      if (accepted) {
        console.log(`[Matching] Trip ${tripId}: Driver ${driver.driverId} accepted!`);
        return; // Matching thành công, kết thúc
      }

      // Tài xế không nhận → thông báo hết hạn
      this.emitToDriver(driver.driverId, SocketEvents.TRIP_REQUEST_EXPIRED, { tripId });

      console.log(
        `[Matching] Trip ${tripId}: Driver ${driver.driverId} timed out/rejected. Trying next...`
      );
    }

    // Hết danh sách tài xế — không ai nhận
    await this.noDriverFound(tripId, trip.passengerId);
  }

  /**
   * Đợi phản hồi từ tài xế trong 10 giây.
   * Trả true nếu tài xế accept, false nếu timeout hoặc reject.
   *
   * Cơ chế: Poll DB mỗi giây để check xem trip đã được accept chưa.
   * Trade-off: Polling đơn giản hơn Promise-based event system,
   * nhưng tốn query DB hơn. Chấp nhận được cho DATN scale nhỏ.
   */
  private static async waitForDriverResponse(
    tripId: string,
    driverId: string
  ): Promise<boolean> {
    const pollIntervalMs = 1000; // Poll mỗi giây
    const maxPolls = MATCH_TIMEOUT_MS / pollIntervalMs; // 10 lần poll

    for (let i = 0; i < maxPolls; i++) {
      await this.sleep(pollIntervalMs);

      const trip = await prisma.tripRequest.findUnique({
        where: { id: tripId },
        select: { status: true, driverId: true },
      });

      if (!trip) return false; // Trip bị xoá

      // Tài xế đã accept
      if (trip.status === 'ACCEPTED' && trip.driverId === driverId) {
        return true;
      }

      // Trip bị hủy bởi hành khách
      if (trip.status === 'CANCELLED') {
        return false;
      }

      // Tài xế reject (status vẫn MATCHING nhưng matchAttempts tăng)
      // → tiếp tục poll cho đến hết timeout
    }

    return false; // Timeout
  }

  /**
   * Xử lý khi tài xế accept cuốc — gọi từ Socket handler.
   * Đây là entry point duy nhất để cập nhật trip thành ACCEPTED.
   */
  static async handleDriverAccept(tripId: string, driverId: string) {
    // Kiểm tra tài xế đã verified KYC chưa
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: { isDriverVerified: true },
    });

    if (!driver?.isDriverVerified) {
      throw new AppError('Bạn cần xác thực tài xế trước khi nhận cuốc', 403);
    }

    // Atomic update — tránh race condition 2 tài xế accept cùng lúc
    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
      select: { status: true, passengerId: true },
    });

    if (!trip || trip.status !== 'MATCHING') {
      throw new AppError('Chuyến xe này không còn ở trạng thái đang tìm tài xế', 400);
    }

    // Cập nhật trip
    const updatedTrip = await prisma.tripRequest.update({
      where: { id: tripId },
      data: {
        driverId,
        status: 'ACCEPTED',
        matchedAt: new Date(),
      },
      include: {
        passenger: {
          select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true },
        },
        driver: {
          select: {
            id: true, firstName: true, lastName: true, phone: true,
            avatarUrl: true, driverRating: true, driverRatingCount: true,
          },
        },
      },
    });

    // Đánh dấu tài xế đang bận
    await setDriverBusy(driverId, tripId);

    // Thông báo hành khách: đã tìm được tài xế!
    this.emitToPassenger(trip.passengerId, SocketEvents.TRIP_MATCHED, {
      tripId,
      driver: updatedTrip.driver,
      status: 'ACCEPTED',
      message: 'Đã tìm được tài xế cho bạn!',
    });

    return updatedTrip;
  }

  /**
   * Xử lý khi tài xế reject cuốc — gọi từ Socket handler.
   * Không cần update DB, Waterfall sẽ tự timeout và chuyển tài xế tiếp.
   */
  static handleDriverReject(tripId: string, driverId: string): void {
    console.log(`[Matching] Driver ${driverId} rejected trip ${tripId}`);
    // Waterfall loop sẽ tự chuyển sang tài xế tiếp theo khi timeout
  }

  /**
   * Xử lý khi không tìm được tài xế nào.
   */
  private static async noDriverFound(tripId: string, passengerId: string): Promise<void> {
    await prisma.tripRequest.update({
      where: { id: tripId },
      data: { status: 'NO_DRIVER' },
    });

    this.emitToPassenger(passengerId, SocketEvents.TRIP_NO_DRIVER, {
      tripId,
      message: 'Không tìm được tài xế trong khu vực. Vui lòng thử lại sau.',
    });

    console.log(`[Matching] Trip ${tripId}: No eligible drivers found`);
  }

  // ─── Socket Helpers ──────────────────────────────────────────────────

  private static emitToPassenger(passengerId: string, event: string, data: any): void {
    try {
      SocketEventService.emitToUser(passengerId, event, data);
    } catch (error) {
      console.warn(`[Matching] Socket emit to passenger ${passengerId} failed:`, error);
    }
  }

  private static emitToDriver(driverId: string, event: string, data: any): void {
    try {
      SocketEventService.emitToUser(driverId, event, data);
    } catch (error) {
      console.warn(`[Matching] Socket emit to driver ${driverId} failed:`, error);
    }
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
