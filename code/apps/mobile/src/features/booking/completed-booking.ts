/** Fields returned by GET /bookings/:id. Historical payment methods may be null. */
export interface CompletedBookingData {
  id: string;
  rideId: string;
  passengerId: string;
  status: string;
  isDroppedOff?: boolean;
  pickedUpAt?: string | null;
  droppedOffAt?: string | null;
  createdAt?: string | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  seats?: number;
  sharedDistanceKm?: number | null;
  totalPrice?: number | null;
  paymentStatus?: string;
  paymentMethod?: string | null;
  ride: {
    status: string;
    origin?: string;
    destination?: string;
    departureTime?: string | null;
    driverId: string;
    driver?: {
      firstName?: string | null;
      lastName?: string | null;
      avatarUrl?: string | null;
      driverRating?: number | null;
      driverRatingCount?: number | null;
    } | null;
    vehicle?: {
      type?: string;
      color?: string | null;
      licensePlate?: string | null;
    } | null;
  };
}

export function isPassengerJourneyCompleted(booking: {
  status?: string;
  isDroppedOff?: boolean;
}) {
  return booking.status === 'COMPLETED' || booking.isDroppedOff === true;
}

export function validDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function canReviewCompletedBooking(
  booking: CompletedBookingData,
  reviewsLoaded: boolean,
  alreadyReviewed: boolean,
) {
  // The existing review API requires the shared ride to finish, even after an individual drop-off.
  return (
    booking.paymentStatus === 'PAID' &&
    booking.ride.status === 'COMPLETED' &&
    reviewsLoaded &&
    !alreadyReviewed
  );
}

export function completedSummary(booking: CompletedBookingData) {
  const pickedUp = validDate(booking.pickedUpAt);
  const finished = validDate(booking.droppedOffAt);
  const elapsed =
    pickedUp && finished
      ? (finished.getTime() - pickedUp.getTime()) / 60_000
      : undefined;
  const distance = booking.sharedDistanceKm;
  const amount = booking.totalPrice;
  return {
    pickup: booking.pickupAddress?.trim() || booking.ride.origin?.trim(),
    dropoff: booking.dropoffAddress?.trim() || booking.ride.destination?.trim(),
    started: pickedUp || validDate(booking.ride.departureTime),
    pickedUp,
    finished,
    // Only passenger-specific measurements; never substitute whole-ride estimates.
    minutes:
      elapsed !== undefined && elapsed >= 0 ? Math.round(elapsed) : undefined,
    distance:
      typeof distance === 'number' && Number.isFinite(distance) && distance >= 0
        ? distance
        : undefined,
    amount:
      typeof amount === 'number' && Number.isFinite(amount) && amount >= 0
        ? `${amount.toLocaleString('vi-VN')}đ`
        : undefined,
    paid: booking.paymentStatus === 'PAID',
    canPay: booking.status === 'COMPLETED' && booking.paymentStatus === 'UNPAID',
    paymentMethodLabel: booking.paymentMethod === 'QR' ? 'QR' : undefined,
    paymentLabel:
      booking.paymentStatus === 'PAID'
        ? 'Đã thanh toán'
        : booking.paymentStatus === 'UNPAID'
          ? 'Chưa thanh toán'
          : booking.paymentStatus === 'REFUNDED'
            ? 'Đã hoàn tiền'
            : 'Chưa có thông tin thanh toán',
  };
}
