const fs = require('fs');
const path = 'code/apps/backend/src/modules/bookings/bookings.service.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Replace createBooking
const startCreateBooking = code.indexOf('static async createBooking');
const endCreateBooking = code.indexOf('static async updateBookingStatus');

if (startCreateBooking !== -1 && endCreateBooking !== -1) {
  const newCreateBooking = `static async createBooking(passengerId: string, data: CreateBookingInput) {
    const { rideId, seats } = data;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);

    if (ride.driverId === passengerId) {
      throw new AppError('Tài xế không thể đặt chỗ trên chuyến đi của chính mình', 400);
    }

    if (ride.status !== 'SCHEDULED') {
      throw new AppError('Chuyến đi này không còn nhận đặt chỗ nữa', 400);
    }

    if (ride.availableSeats < seats) {
      throw new AppError('Chuyến đi không đủ ghế trống', 400);
    }

    const booking = await prisma.booking.create({
      data: {
        rideId,
        passengerId,
        seats,
        totalPrice: ride.pricePerSeat * seats,
        status: BookingStatus.PENDING,
        passengerLat: (data as any).passengerLat,
        passengerLng: (data as any).passengerLng,
        pickupAddress: (data as any).pickupAddress ?? null,
      },
      include: {
        ride: { select: { origin: true, destination: true } },
        passenger: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    try {
      const payload = {
        bookingId: booking.id,
        passenger: booking.passenger,
        seats: booking.seats,
        totalPrice: booking.totalPrice,
        rideId: booking.rideId,
        origin: booking.ride.origin,
        destination: booking.ride.destination,
        pickupLat: booking.passengerLat,
        pickupLng: booking.passengerLng,
        pickupAddress: booking.pickupAddress,
        isScheduled: true,
      };
      SocketEventService.emitToUser(ride.driverId, SocketEvents.BOOKING_NEW_REQUEST, payload);
    } catch (e) {}

    return booking;
  }

  `;
  code = code.substring(0, startCreateBooking) + newCreateBooking + code.substring(endCreateBooking);
}

// 2. Thêm validation vào updateBookingStatus
// Tìm:
// if (!booking) throw new AppError('Không tìm thấy yêu cầu đặt chỗ', 404);
//
// if (booking.ride.driverId !== userId) {
//   throw new AppError('FORBIDDEN_BOOKING_ACCESS', 403);
// }
// (Đã có sẵn FORBIDDEN_BOOKING_ACCESS, thỏa mãn yêu cầu confirm và reject)

// 3. cancelBooking
// Tìm:
// if (booking.passengerId !== userId) throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
// Nó có thể chưa kiểm tra passengerId. Ta thay thế:
code = code.replace(
  /if \(booking.passengerId !== userId\) \{[\s\S]*?\}/,
  `if (booking.passengerId !== userId) {
      throw new AppError('FORBIDDEN_BOOKING_ACCESS', 403);
    }`
);

fs.writeFileSync(path, code);
console.log('Patched');
