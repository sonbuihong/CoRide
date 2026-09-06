import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canReviewCompletedBooking,
  completedSummary,
  isPassengerJourneyCompleted,
  validDate,
  type CompletedBookingData,
} from './completed-booking';

const booking: CompletedBookingData = {
  id: 'booking-test',
  rideId: 'ride-test',
  passengerId: 'passenger-test',
  status: 'COMPLETED',
  totalPrice: 16000,
  paymentStatus: 'UNPAID',
  ride: {
    status: 'COMPLETED',
    driverId: 'driver-test',
    origin: 'Điểm đầu',
    destination: 'Điểm cuối',
    departureTime: '2026-09-06T06:00:00+07:00',
  },
};

test('completed booking or individual drop-off takes precedence over an ongoing shared ride', () => {
  assert.equal(isPassengerJourneyCompleted(booking), true);
  assert.equal(
    isPassengerJourneyCompleted({ status: 'CONFIRMED', isDroppedOff: true }),
    true,
  );
  assert.equal(
    isPassengerJourneyCompleted({ ...booking, status: 'CONFIRMED' }),
    false,
  );
});
test('pending, upcoming, active and cancelled bookings do not become completed from ride status alone', () => {
  for (const status of ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED']) {
    assert.equal(isPassengerJourneyCompleted({ ...booking, status }), false);
  }
});
test('unpaid shows payment; paid hides payment; refunded must not charge again', () => {
  assert.equal(completedSummary(booking).canPay, true);
  const paid = completedSummary({ ...booking, paymentStatus: 'PAID' });
  assert.equal(paid.paid, true);
  assert.equal(paid.canPay, false);
  assert.equal(
    completedSummary({ ...booking, paymentStatus: 'REFUNDED' }).canPay,
    false,
  );
  assert.equal(
    completedSummary({ ...booking, paymentStatus: undefined }).canPay,
    false,
  );
});
test('formats actual amount and does not invent missing amount', () => {
  assert.equal(completedSummary(booking).amount, '16.000đ');
  assert.equal(
    completedSummary({ ...booking, totalPrice: null }).amount,
    undefined,
  );
  assert.equal(completedSummary({ ...booking, totalPrice: 0 }).amount, '0đ');
});
test('uses passenger addresses with ride fallbacks', () => {
  assert.equal(
    completedSummary({ ...booking, pickupAddress: ' Điểm đón riêng ' }).pickup,
    'Điểm đón riêng',
  );
  assert.equal(
    completedSummary({ ...booking, pickupAddress: ' ' }).pickup,
    booking.ride.origin,
  );
  assert.equal(
    completedSummary({ ...booking, dropoffAddress: 'Điểm trả riêng' }).dropoff,
    'Điểm trả riêng',
  );
  assert.equal(completedSummary(booking).dropoff, booking.ride.destination);
});
test('never invents finish time or passenger duration from ride departure', () => {
  const result = completedSummary(booking);
  assert.equal(result.finished, undefined);
  assert.equal(result.minutes, undefined);
  assert.equal(result.distance, undefined);
  assert.equal(
    completedSummary({ ...booking, droppedOffAt: '2026-09-06T07:00:00+07:00' })
      .minutes,
    undefined,
  );
});
test('uses actual passenger timestamps and shared distance only', () => {
  const result = completedSummary({
    ...booking,
    pickedUpAt: '2026-09-06T06:05:00+07:00',
    droppedOffAt: '2026-09-06T06:35:00+07:00',
    sharedDistanceKm: 12.5,
  });
  assert.equal(result.minutes, 30);
  assert.equal(result.distance, 12.5);
  assert.equal(result.started?.getTime(), result.pickedUp?.getTime());
});
test('invalid dates and negative durations are omitted', () => {
  assert.equal(validDate('invalid'), undefined);
  assert.equal(validDate(null), undefined);
  assert.equal(
    completedSummary({
      ...booking,
      pickedUpAt: '2026-09-06T08:00:00Z',
      droppedOffAt: '2026-09-06T07:00:00Z',
    }).minutes,
    undefined,
  );
});
test('review CTA requires paid, loaded reviews and no existing review', () => {
  const paid = { ...booking, paymentStatus: 'PAID' };
  assert.equal(canReviewCompletedBooking(paid, true, false), true);
  assert.equal(canReviewCompletedBooking(paid, true, true), false);
  assert.equal(canReviewCompletedBooking(paid, false, false), false);
  assert.equal(canReviewCompletedBooking(booking, true, false), false);
});
test('drop-off summary is immediate but review respects existing shared-ride API requirement', () => {
  const droppedOff = {
    ...booking,
    status: 'CONFIRMED',
    isDroppedOff: true,
    paymentStatus: 'PAID',
    ride: { ...booking.ride, status: 'ONGOING' },
  };
  assert.equal(isPassengerJourneyCompleted(droppedOff), true);
  assert.equal(canReviewCompletedBooking(droppedOff, true, false), false);
});
